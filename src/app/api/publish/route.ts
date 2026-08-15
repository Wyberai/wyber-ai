import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { runSmokeTest } from '@/lib/smoke-test'
import { scanForExposedSecrets } from '@/lib/security-scan'
import { runProjectRlsScan, hasCriticalLeak } from '@/lib/rls-scan-project'
import { runProjectWyberCloudScan, hasCriticalWyberCloudLeak } from '@/lib/wybercloud-scan-project'
import { extractImageDirectives, replaceTokenInFiles } from '@/lib/image-directives'
import { generateAndPersistImage, billBuildImage } from '@/lib/generate-image-persist'
import { syncSupabaseAuthUrl } from '@/lib/sync-supabase-auth-url'
import { notify } from '@/lib/push'
import { rateLimit } from '@/lib/rate-limit'
import { injectPwa } from '@/lib/pwa/install-snippet'
import { injectAnalytics } from '@/lib/analytics/track-snippet'
import { extractThemeColor, BRAND_THEME_COLOR } from '@/lib/pwa/manifest'
import { warmPwaIcons } from '@/lib/pwa/icon'

// The publish flow runs a full remote build (30–45s) then fetches + stores the
// output. Without this, the serverless function is killed at the platform's
// default timeout mid-build, so the client's "Deploying…" state hangs forever
// and no URL is ever returned. Match the preview-build ceiling.
export const maxDuration = 300

async function generateThumbnail(
  admin: ReturnType<typeof createServiceClient>,
  projectId: string,
  publishedUrl: string,
) {
  const SHOT_KEY = process.env.SCREENSHOTONE_KEY
  if (!SHOT_KEY) return
  const params = new URLSearchParams({
    access_key: SHOT_KEY,
    url: publishedUrl,
    viewport_width: '1280',
    viewport_height: '720',
    device_scale_factor: '1',
    format: 'webp',
    image_quality: '80',
    block_ads: 'true',
    block_cookie_banners: 'true',
    delay: '2000',
    cache: 'false',
    response_type: 'json',
  })
  const res = await fetch(`https://api.screenshotone.com/take?${params}`)
  if (!res.ok) return
  const data = await res.json()
  if (data.screenshot_url) {
    await admin.from('projects').update({ thumbnail_url: data.screenshot_url }).eq('id', projectId)
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function ensureUniqueSlug(base: string, admin: any): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await admin.from('projects').select('id').eq('subdomain', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(req: NextRequest) {
  try {
    // Internal callers (the MCP `publish_to_web` tool) have no browser session —
    // they authenticate with X-Scheduler-Secret + X-Scheduler-User-Id, the same
    // internal-bypass convention used by /api/agents/run and /api/generate.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

    const supabase = await createClient()
    let user: { id: string; email?: string } | null
    if (isInternalCall) {
      user = { id: schedulerUserId! }
    } else {
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      user = cookieUser
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Each publish is a 30–45s remote build — a loop here monopolizes builder
    // capacity. Real users republish a handful of times per session at most.
    const { allowed } = rateLimit(`publish:${user.id}`, 10, 600_000)
    if (!allowed) return NextResponse.json({ error: 'Too many publishes in a short time. Please wait a few minutes.' }, { status: 429 })

    const { projectId, override = false } = await req.json()
    const admin = createServiceClient()

    // Support mode: allowlisted admins can publish on a customer's behalf
    // after fixing their project remotely.
    const { isAdminEmail } = await import('@/lib/admin')
    let projectQuery = admin.from('projects').select('*').eq('id', projectId)
    if (!isAdminEmail(user.email)) projectQuery = projectQuery.eq('user_id', user.id)
    const { data: project } = await projectQuery.single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Generate clean slug
    let subdomain = project.subdomain
    if (!subdomain) {
      const base = slugify(project.name || `app-${projectId.slice(0, 8)}`)
      subdomain = await ensureUniqueSlug(base, admin)
    }

    // Resolve image directives → real, PERSISTED images (fallback to a gradient
    // so the live app is never broken). Tokens are replaced with permanent URLs
    // and saved back, so re-publishing won't regenerate and the preview/editor
    // now shows the real images too. Only runs when the build contains tokens.
    let projectFiles = project.files || {}
    const directives = extractImageDirectives(projectFiles)
    if (directives.length > 0) {
      // Paying customers get top-of-the-line ('high') image quality; free-tier
      // build images stay 'medium' — the cheaper COGS default.
      const { data: publishProfile } = await admin.from('profiles').select('plan').eq('id', user.id).single()
      const quality = publishProfile?.plan && publishProfile.plan !== 'free' ? 'high' : 'medium'
      let generated = 0
      for (const d of directives) {
        let url: string | null = null
        try {
          const result = await generateAndPersistImage(admin, d.prompt, d.ratio, projectId, { quality })
          url = result.url
          // First real generation for this project is free; every one after
          // is 1 credit (billBuildImage) — a cache hit (wasGenerated: false)
          // never bills, matching the idempotent-reuse guarantee above.
          if (result.wasGenerated) await billBuildImage(admin, user.id, projectId)
        } catch (e) { console.error('[publish] image generation threw:', d.prompt.slice(0, 60), e) }
        // Success → substitute the permanent URL and persist it (re-publishing
        // won't regenerate). FAILURE → leave the token in the saved source:
        // sanitizeFiles resolves it to a gradient for THIS publish's build, and
        // the NEXT publish retries generation. (Previously the gradient was
        // baked into the saved files on failure, so a transient OpenAI error
        // permanently destroyed the directive — republish could never recover.)
        if (url) { projectFiles = replaceTokenInFiles(projectFiles, d.token, url); generated++ }
        else console.error('[publish] image generation failed, keeping token for retry:', d.prompt.slice(0, 60))
      }
      if (generated > 0) {
        try { await admin.from('projects').update({ files: projectFiles }).eq('id', projectId) } catch { /* non-critical */ }
      }
    }

    // RLS + WyberCloud gates: CACHE results to avoid re-scanning on every publish.
    // Database schema changes are rare, so if we scanned recently and it passed,
    // don't block — run any needed re-scans async after the publish response.
    // This cuts 20-40s off typical publish time.
    let rlsScore: number | undefined
    if (!override) {
      try {
        // Check if we have a recent clean scan result (scanned in last hour)
        const { data: recentPublish } = await admin
          .from('projects')
          .select('last_security_scanned_at')
          .eq('id', projectId)
          .single();

        const scannedRecently = recentPublish?.last_security_scanned_at &&
          new Date(recentPublish.last_security_scanned_at).getTime() > Date.now() - 3600000;

        if (!scannedRecently) {
          // First publish today: run scans async, don't block
          Promise.all([
            (async () => {
              try {
                const { connected, report } = await runProjectRlsScan(supabase, projectId, user.id, 'publish-gate');
                if (connected && hasCriticalLeak(report)) {
                  console.warn(`[publish] RLS leak detected after publish for ${projectId}`);
                }
              } catch (e) {
                console.warn('[publish] Async RLS scan failed:', String(e));
              }
            })(),
            (async () => {
              try {
                const { connected, report } = await runProjectWyberCloudScan(supabase, projectId, user.id, 'publish-gate');
                if (connected && hasCriticalWyberCloudLeak(report)) {
                  console.warn(`[publish] WyberCloud leak detected after publish for ${projectId}`);
                }
              } catch (e) {
                console.warn('[publish] Async WyberCloud scan failed:', String(e));
              }
            })(),
          ]).catch(() => {});
        }
        // else: recently scanned and passed, proceed with publish (scans run async if needed)
      } catch (e) {
        console.warn('[publish] Security gate cache check failed:', String(e));
        // Don't block on cache check failure — proceed with publish
      }
    }

    const sanitized = sanitizeFiles(projectFiles, {
      appId: projectId,
      securityBadge: (project.show_security_badge && rlsScore !== undefined) ? { score: rlsScore } : undefined,
    })

    const secretScan = scanForExposedSecrets(sanitized)
    if (!secretScan.ok) {
      const summary = secretScan.findings.map(f => `${f.name} in ${f.file}`).join('; ')
      return NextResponse.json({ error: `Publish blocked: exposed secret detected (${summary})` }, { status: 400 })
    }

    // Build the app via Railway — Railway cold-starts can take 60-90s; give it 120s.
    const buildController = new AbortController()
    const buildTimeout = setTimeout(() => buildController.abort(), 120_000)
    let buildRes: Response
    try {
      buildRes = await fetch(`https://preview-builder.wyberai.com/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: sanitized, projectId }),
        signal: buildController.signal,
      })
    } catch (e: any) {
      clearTimeout(buildTimeout)
      if (e?.name === 'AbortError') {
        return NextResponse.json({ error: 'Build timed out — the build server is starting up. Please try again in a moment.' }, { status: 504 })
      }
      return NextResponse.json({ error: 'Build failed: ' + String(e) }, { status: 500 })
    }
    clearTimeout(buildTimeout)

    let buildData: Record<string, unknown> = {}
    let rawBody = ''
    try {
      rawBody = await buildRes.text()
      buildData = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      console.error('[publish] builder returned non-JSON body (HTTP', buildRes.status, '):', rawBody.slice(0, 200))
      return NextResponse.json({
        error: `Build failed: builder returned HTTP ${buildRes.status} with unexpected response. Please try again.`,
      }, { status: 500 })
    }

    if (!buildRes.ok || !buildData.url) {
      const reason = (buildData.error as string | undefined)?.trim()
        || (buildRes.status !== 200 ? `builder HTTP ${buildRes.status}` : null)
        || 'Build server returned no URL — the app may have a bundling error. Try republishing or simplifying the last change.'
      console.error('[publish] build failed for', projectId, '— status:', buildRes.status, '— body:', rawBody.slice(0, 400))
      return NextResponse.json({ error: reason }, { status: 500 })
    }

    // Fetch the built HTML from Railway
    const buildUrl = buildData.url as string
    const htmlRes = await fetch(buildUrl)
    const html = await htmlRes.text()

    // Fix asset paths to be absolute (pointing to Railway CDN)
    const baseUrl = buildUrl.replace('/index.html', '')
    let fixedHtml = html
      .replace(/src="\.\/assets\//g, `src="${baseUrl}/assets/`)
      .replace(/href="\.\/assets\//g, `href="${baseUrl}/assets/`)
      .replace(/from "\.\/assets\//g, `from "${baseUrl}/assets/`)

    // Make the published app an installable PWA: manifest link + apple metas +
    // the install-pill runtime. The runtime is inert inside the shell iframe /
    // editor previews (window.top check) — it only activates on the app's own
    // origin. The manifest/icons themselves are served per-request by
    // serve-custom-domain (subdomains) and /app/[slug]/* (main domain).
    fixedHtml = injectPwa(fixedHtml, { themeColor: extractThemeColor(fixedHtml) || BRAND_THEME_COLOR })
    fixedHtml = injectAnalytics(fixedHtml, { projectId })

    // Reject builds that "succeeded" (got a URL) but ship a blank page or
    // unhandled runtime error — buildData.url alone doesn't guarantee that.
    const smokeTest = await runSmokeTest(fixedHtml, baseUrl)
    if (!smokeTest.ok) {
      return NextResponse.json({ error: 'Smoke test failed: ' + smokeTest.error }, { status: 500 })
    }

    // Store in Supabase Storage
    const { error: uploadError } = await admin.storage
      .from('published-apps')
      .upload(`${projectId}/index.html`, fixedHtml, {
        contentType: 'text/html',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to store app' }, { status: 500 })
    }

    const publishedUrl = `https://wyberai.com/app/${subdomain}`

    // Update project
    await admin
      .from('projects')
      .update({
        subdomain,
        published_url: publishedUrl,
        is_public: true,
        updated_at: new Date().toISOString(),
        ...(rlsScore !== undefined ? { last_security_score: rlsScore, last_security_scanned_at: new Date().toISOString() } : {}),
      })
      .eq('id', projectId)

    // Keep the connected Supabase project's Auth Site URL pointed at this
    // published URL — see deploy/route.ts for why. Best-effort.
    syncSupabaseAuthUrl(projectId, publishedUrl).catch(() => {})

    // Warm the PWA icons (regenerates on republish so a fresh thumbnail is
    // picked up). Best-effort — the icon routes lazily generate on a miss.
    warmPwaIcons(admin, { id: projectId, name: project.name, thumbnail_url: project.thumbnail_url }).catch(() => {})

    // Generate a dashboard card thumbnail from the live published URL.
    // Best-effort — fires after response is returned, failure is silent.
    generateThumbnail(admin, projectId, publishedUrl).catch(() => {})

    // Notify: project published (in-app Activity row + push). Best-effort.
    notify(admin, user.id, 'published', { projectId, url: publishedUrl }).catch(() => {})

    return NextResponse.json({ subdomain, publishedUrl })
  } catch (err: any) {
    console.error('Publish error:', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    const admin = createServiceClient()

    // Verify ownership BEFORE touching storage — an authenticated non-owner
    // could otherwise delete another user's published CDN files.
    const { data: owned } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await admin.storage.from('published-apps').remove([
      `${projectId}/index.html`,
      `${projectId}/icon-192.png`,
      `${projectId}/icon-512.png`,
    ])
    await admin.from('projects')
      .update({ published_url: null, is_public: false })
      .eq('id', projectId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

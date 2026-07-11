import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { runSmokeTest } from '@/lib/smoke-test'
import { scanForExposedSecrets } from '@/lib/security-scan'
import { runProjectRlsScan, hasCriticalLeak } from '@/lib/rls-scan-project'
import { extractImageDirectives, replaceTokenInFiles } from '@/lib/image-directives'
import { generateAndPersistImage } from '@/lib/generate-image-persist'
import { syncSupabaseAuthUrl } from '@/lib/sync-supabase-auth-url'
import { rateLimit } from '@/lib/rate-limit'
import { injectPwa } from '@/lib/pwa/install-snippet'
import { extractThemeColor, BRAND_THEME_COLOR } from '@/lib/pwa/manifest'
import { warmPwaIcons } from '@/lib/pwa/icon'

// The publish flow runs a full remote build (30–45s) then fetches + stores the
// output. Without this, the serverless function is killed at the platform's
// default timeout mid-build, so the client's "Deploying…" state hangs forever
// and no URL is ever returned. Match the preview-build ceiling.
export const maxDuration = 300

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
    // Internal callers (the MCP `publish_project` tool) have no browser session —
    // they authenticate with X-Scheduler-Secret + X-Scheduler-User-Id, the same
    // internal-bypass convention used by /api/agents/run and /api/generate.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === process.env.CRON_SECRET

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
      let generated = 0
      for (const d of directives) {
        let url: string | null = null
        try { url = await generateAndPersistImage(admin, d.prompt, d.ratio, projectId) } catch (e) { console.error('[publish] image generation threw:', d.prompt.slice(0, 60), e) }
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

    const sanitized = sanitizeFiles(projectFiles, { appId: projectId })

    const secretScan = scanForExposedSecrets(sanitized)
    if (!secretScan.ok) {
      const summary = secretScan.findings.map(f => `${f.name} in ${f.file}`).join('; ')
      return NextResponse.json({ error: `Publish blocked: exposed secret detected (${summary})` }, { status: 400 })
    }

    // RLS gate: if the connected database leaks private data to the public anon
    // key (the CVE-2025-48757 failure mode), block on CRITICAL findings unless
    // the user explicitly chose to publish anyway. Never block on scanner errors
    // (fail-open — the gate is a safety net, not a wall).
    if (!override) {
      try {
        const { connected, report } = await runProjectRlsScan(supabase, projectId, user.id, 'publish-gate')
        if (connected && hasCriticalLeak(report)) {
          return NextResponse.json({
            blocked: true,
            kind: 'rls',
            message: 'Publish blocked: your database is leaking private data to anyone with your public key. Fix the row-level security issues, or publish anyway.',
            report,
          }, { status: 409 })
        }
      } catch (e) {
        console.warn('[publish] RLS gate skipped (scan failed):', String(e))
      }
    }

    // Build the app via Railway
    const buildRes = await fetch(`https://preview-builder.wyberai.com/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: sanitized, projectId }),
    })

    const buildData = await buildRes.json()

    if (!buildData.url) {
      return NextResponse.json({ error: 'Build failed: ' + (buildData.error || 'Unknown') }, { status: 500 })
    }

    // Fetch the built HTML from Railway
    const htmlRes = await fetch(buildData.url)
    const html = await htmlRes.text()

    // Fix asset paths to be absolute (pointing to Railway CDN)
    const baseUrl = buildData.url.replace('/index.html', '')
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
      })
      .eq('id', projectId)

    // Keep the connected Supabase project's Auth Site URL pointed at this
    // published URL — see deploy/route.ts for why. Best-effort.
    syncSupabaseAuthUrl(projectId, publishedUrl).catch(() => {})

    // Warm the PWA icons (regenerates on republish so a fresh thumbnail is
    // picked up). Best-effort — the icon routes lazily generate on a miss.
    warmPwaIcons(admin, { id: projectId, name: project.name, thumbnail_url: project.thumbnail_url }).catch(() => {})

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

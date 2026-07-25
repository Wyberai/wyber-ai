import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { randomBytes } from 'crypto'
import { replaceTokenInFiles } from '@/lib/image-directives'
import { SECURITY_COCKPIT_FILES } from '@/lib/templates/gtm/security-cockpit'
import { ITSERVICES_COCKPIT_FILES } from '@/lib/templates/gtm/itservices-cockpit'

const COCKPIT_TEMPLATES: Record<string, Record<string, string>> = {
  security: SECURITY_COCKPIT_FILES,
  itservices: ITSERVICES_COCKPIT_FILES,
}

// Publishing runs a full remote build per company (~30–45s). A single
// invocation publishes a small batch and returns what's left; the caller
// re-invokes every ~10 min. This ceiling matches the publish route's.
export const maxDuration = 300

/**
 * GTM personalized-demo stamper.
 *
 * Two phases, both idempotent:
 *   1. CREATE — for each { firstName, company, targetEmail } clone the dev-shop
 *      template, replace the personalization tokens, and insert a project row
 *      owned by the outreach account with is_demo=true + target_email. The
 *      project NAME is the company name, which is what the publish route turns
 *      into the slug (wyberai.com/app/<company>). Skips a company that already
 *      has an unclaimed demo (dedupe on target_email+name).
 *   2. PUBLISH — publish up to `limit` (default 5) not-yet-published demos,
 *      sequentially. The publish route rate-limits 10 per account per 10 min,
 *      and all demos share the outreach account, so keep the batch small and
 *      re-invoke on an interval. Stops early and reports `rateLimited` on a 429.
 *
 * Auth: an allowlisted admin session, OR the internal scheduler secret
 * (X-Scheduler-Secret === CRON_SECRET) so a scheduled task can drive it.
 */
export async function POST(req: NextRequest) {
  const schedulerSecret = req.headers.get('x-scheduler-secret')
  const isInternalCall = !!schedulerSecret && schedulerSecret === process.env.CRON_SECRET

  if (!isInternalCall) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const outreachUserId = process.env.GTM_OUTREACH_USER_ID
  if (!outreachUserId) {
    return NextResponse.json(
      { error: 'GTM_OUTREACH_USER_ID is not configured (the account that owns campaign demos).' },
      { status: 500 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const companies: Array<{ firstName?: string; company?: string; brandInitial?: string; targetEmail?: string }> =
    Array.isArray(body.companies) ? body.companies : []
  const doPublish: boolean = body.publish !== false
  const limit: number = Math.max(1, Math.min(Number(body.limit) || 5, 8))
  const template: string = typeof body.template === 'string' && COCKPIT_TEMPLATES[body.template] ? body.template : 'security'

  const admin = createServiceClient()
  const created: Array<{ company: string; projectId: string }> = []
  const skipped: Array<{ company: string; reason: string }> = []

  // ── Phase 1: create demo rows ────────────────────────────────────────────
  for (const c of companies) {
    const company = (c.company || '').trim()
    const firstName = (c.firstName || '').trim() || 'there'
    const targetEmail = (c.targetEmail || '').trim().toLowerCase()
    if (!company) { skipped.push({ company: '(missing)', reason: 'no company name' }); continue }
    const brandInitial = (c.brandInitial || company).trim().charAt(0).toUpperCase() || 'W'

    // Idempotent: don't re-stamp a company that already has an unclaimed demo.
    const { data: existing } = await admin
      .from('projects')
      .select('id')
      .eq('is_demo', true)
      .eq('name', company)
      .maybeSingle()
    if (existing) { skipped.push({ company, reason: 'demo already exists' }); continue }

    const claimToken = randomBytes(16).toString('hex')
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    const claimUrl = `${origin}/api/gtm/start-claim?token=${claimToken}`

    let files: Record<string, string> = { ...COCKPIT_TEMPLATES[template] }
    files = replaceTokenInFiles(files, '{{COMPANY_NAME}}', company)
    files = replaceTokenInFiles(files, '{{FIRST_NAME}}', firstName)
    files = replaceTokenInFiles(files, '{{BRAND_INITIAL}}', brandInitial)
    files = replaceTokenInFiles(files, '{{CLAIM_URL}}', claimUrl)

    const { data, error } = await admin
      .from('projects')
      .insert({
        name: company,
        framework: 'react-vite',
        files,
        user_id: outreachUserId,
        is_demo: true,
        target_email: targetEmail || null,
        claim_token: claimToken,
      })
      .select('id')
      .single()
    if (error) { skipped.push({ company, reason: error.message }); continue }
    created.push({ company, projectId: data!.id })
  }

  // ── Phase 2: publish a paced batch of unpublished demos ───────────────────
  const published: Array<{ company: string; url: string }> = []
  const publishFailed: Array<{ company: string; error: string }> = []
  let rateLimited = false
  let pendingRemaining = 0

  if (doPublish) {
    const { data: pending } = await admin
      .from('projects')
      .select('id, name')
      .eq('user_id', outreachUserId)
      .eq('is_demo', true)
      .is('published_url', null)
      .order('created_at', { ascending: true })
    pendingRemaining = pending?.length ?? 0

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    let done = 0
    for (const p of pending ?? []) {
      if (done >= limit) break
      const res = await fetch(`${origin}/api/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scheduler-User-Id': outreachUserId,
          'X-Scheduler-Secret': process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ projectId: p.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 429) { rateLimited = true; break }
      if (!res.ok) { publishFailed.push({ company: p.name, error: data.error || `publish ${res.status}` }); done++; continue }
      published.push({ company: p.name, url: data.url || data.published_url || '' })
      pendingRemaining--
      done++
    }
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    createdProjects: created,
    skipped,
    published,
    publishFailed,
    rateLimited,
    pendingRemaining,
    note: rateLimited
      ? 'Publish rate limit hit — re-invoke in ~10 minutes to continue.'
      : pendingRemaining > 0
        ? `Re-invoke to publish the remaining ${pendingRemaining} demo(s).`
        : 'All demos published.',
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { notifyPush } from '@/lib/push'

// Live-app error alerts.
//
// POST — public beacon from the snippet injected into every published app
// (src/lib/analytics/track-snippet.ts): a real visitor hit an uncaught JS
// error. Stored as an `app_error` row in `notifications` (no new table): one
// row per distinct error per project per 24h, with a running count. The
// first new error of the day also emails the owner and pushes to the mobile
// app; repeats only bump the count.
//
// GET ?projectId= — the owner's unread alerts for one project, read by the
// editor's LiveErrorsBanner, whose "Fix it" runs the normal (free) self-heal.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_ALERTS_PER_PROJECT_PER_DAY = 10
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Errors the app's owner can't act on: cross-origin scripts (no details),
// browser-extension code, and benign browser noise.
function isNoise(message: string, stack: string, source: string): boolean {
  if (!message || message === 'Script error.' || message === 'Script error') return true
  if (/ResizeObserver loop/i.test(message)) return true
  if (/Non-Error promise rejection captured/i.test(message)) return true
  return /(chrome|moz|safari|safari-web)-extension:\/\//.test(`${stack} ${source}`)
}

function fingerprint(message: string): string {
  const norm = message.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 200)
  let h = 5381
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  // Always 204: a beacon must never surface errors or invite retries.
  const done = () => new NextResponse(null, { status: 204, headers: CORS })
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`app-errors:${ip}`, 20, 60_000).allowed) return done()

    const body = await req.json().catch(() => null)
    const projectId = String(body?.projectId ?? '')
    // Browsers prefix window.onerror messages with "Uncaught " (and
    // "(in promise)"); strip it so the same error always fingerprints the
    // same and "Script error." noise is recognised.
    const message = String(body?.message ?? '').replace(/^Uncaught\s+(\(in promise\)\s+)?/i, '').slice(0, 500).trim()
    const stack = String(body?.stack ?? '').slice(0, 2000)
    const source = String(body?.source ?? '').slice(0, 300)
    const path = String(body?.path ?? '/').slice(0, 300)
    if (!UUID.test(projectId) || isNoise(message, stack, source)) return done()
    if (!rateLimit(`app-errors:project:${projectId}`, 120, 60_000).allowed) return done()

    const admin = await createAdminClient()
    const { data: project } = await admin
      .from('projects')
      .select('id, name, user_id, subdomain, is_public')
      .eq('id', projectId)
      .single()
    if (!project?.is_public || !project.user_id) return done()

    const fp = fingerprint(message)
    const since = new Date(Date.now() - DAY_MS).toISOString()
    const { data: recent } = await admin
      .from('notifications')
      .select('id, payload')
      .eq('user_id', project.user_id)
      .eq('type', 'app_error')
      .gte('created_at', since)
      .filter('payload->>projectId', 'eq', projectId)
      .limit(MAX_ALERTS_PER_PROJECT_PER_DAY + 1)

    const now = new Date().toISOString()
    const existing = recent?.find(r => (r.payload as Record<string, unknown> | null)?.fingerprint === fp)
    if (existing) {
      const payload = existing.payload as Record<string, unknown>
      await admin.from('notifications')
        .update({ payload: { ...payload, count: Number(payload.count ?? 1) + 1, lastSeen: now } })
        .eq('id', existing.id)
      return done()
    }
    if ((recent?.length ?? 0) >= MAX_ALERTS_PER_PROJECT_PER_DAY) return done()

    const liveUrl = `https://wyberai.com/app/${project.subdomain}`
    const payload = {
      projectId, projectName: project.name, message, stack: stack.slice(0, 1200), source, path,
      fingerprint: fp, count: 1, firstSeen: now, lastSeen: now, liveUrl,
    }
    const { data: inserted } = await admin.from('notifications')
      .insert({ user_id: project.user_id, type: 'app_error', payload })
      .select('id')
      .single()
    if (!inserted) return done()

    // Same race for duplicates: several visitors hitting the same error at
    // once each see "not recorded yet" and insert. Keep only the earliest row
    // for this fingerprint and fold the others into its count.
    const { data: firstSame } = await admin
      .from('notifications')
      .select('id, payload')
      .eq('user_id', project.user_id)
      .eq('type', 'app_error')
      .gte('created_at', since)
      .filter('payload->>projectId', 'eq', projectId)
      .filter('payload->>fingerprint', 'eq', fp)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1)
      .single()
    if (firstSame && firstSame.id !== inserted.id) {
      await admin.from('notifications').delete().eq('id', inserted.id)
      const p = firstSame.payload as Record<string, unknown>
      await admin.from('notifications')
        .update({ payload: { ...p, count: Number(p.count ?? 1) + 1, lastSeen: now } })
        .eq('id', firstSame.id)
      return done()
    }
    await notifyPush(admin, project.user_id, 'app_error', payload)

    // Email once per project per day. Several visitors' errors often arrive
    // in the same instant, so "were there zero alerts when I looked?" would
    // let each of them email. Instead, only the request whose row is the
    // earliest of the day sends — exactly one, whatever the timing.
    const { data: first } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', project.user_id)
      .eq('type', 'app_error')
      .gte('created_at', since)
      .filter('payload->>projectId', 'eq', projectId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1)
      .single()
    if (first?.id === inserted.id) {
      try {
        const { data: owner } = await admin.from('profiles').select('email, email_opt_out').eq('id', project.user_id).single()
        if (owner?.email && !owner.email_opt_out) {
          const { sendLiveAppErrorEmail } = await import('@/lib/email')
          const { unsubscribeUrl } = await import('@/lib/email/unsubscribe')
          await sendLiveAppErrorEmail(owner.email, project.name, projectId, liveUrl, message, unsubscribeUrl(owner.email))
        }
      } catch { /* email is best-effort */ }
    }
    return done()
  } catch {
    return done()
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const projectId = req.nextUrl.searchParams.get('projectId') ?? ''
  if (!UUID.test(projectId)) return NextResponse.json({ errors: [] })

  const admin = await createAdminClient()
  const { data } = await admin
    .from('notifications')
    .select('id, payload, created_at')
    .eq('user_id', user.id)
    .eq('type', 'app_error')
    .eq('read', false)
    .filter('payload->>projectId', 'eq', projectId)
    .order('created_at', { ascending: false })
    .limit(MAX_ALERTS_PER_PROJECT_PER_DAY)
  return NextResponse.json({ errors: data ?? [] })
}

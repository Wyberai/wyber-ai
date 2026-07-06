import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCreditsExhaustedEmail, sendGettingStartedNudgeEmail, sendPublishNudgeEmail } from '@/lib/email'
import { unsubscribeUrl } from '@/lib/email/unsubscribe'
import { userCurrency } from '@/lib/user-currency'

export const maxDuration = 120

// Daily lifecycle drip (vercel.json cron). Three campaigns, all tracked in
// email_events so a "daily" cron never means "daily email":
//   credits-drip     — free-plan users at zero balance: every 3 days, max 4
//   getting-started  — signed up 2+ days ago, never generated an app: once
//   publish-nudge    — built an app 3+ days ago, never published anything: once
// All campaigns skip email_opt_out users. Transactional email is unaffected.
const DRIP_INTERVAL_DAYS = 3
const DRIP_MAX_SENDS = 4
const BATCH = 50 // per campaign per run — spreads big backlogs over days

type EventRow = { user_id: string; kind: string; sent_count: number; last_sent_at: string | null }

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const now = Date.now()
  const dueBefore = new Date(now - DRIP_INTERVAL_DAYS * 24 * 3600_000).toISOString()
  const results = { creditsDrip: 0, gettingStarted: 0, publishNudge: 0, errors: 0 }

  // Load prior sends once; keyed lookups below. If the tracking table doesn't
  // exist yet (migration 20260703110000 pending), bail — a drip with no send
  // tracking would mean daily emails to everyone matching the filters.
  const { data: eventRows, error: evErr } = await admin.from('email_events').select('user_id, kind, sent_count, last_sent_at')
  if (evErr) {
    console.error('[email-drip] email_events unavailable — apply migration 20260703110000 first:', evErr.message)
    return NextResponse.json({ skipped: true, reason: 'email_events table unavailable' }, { status: 200 })
  }
  const events = new Map<string, EventRow>()
  for (const r of (eventRows ?? []) as EventRow[]) events.set(`${r.user_id}:${r.kind}`, r)

  const markSent = async (userId: string, kind: string) => {
    const prev = events.get(`${userId}:${kind}`)
    await admin.from('email_events').upsert({
      user_id: userId, kind,
      sent_count: (prev?.sent_count ?? 0) + 1,
      last_sent_at: new Date().toISOString(),
    })
  }

  try {
    // ── 1. Out-of-credits drip (free plan, zero balance) ──────────────────
    const { data: broke } = await admin
      .from('profiles')
      .select('id, email, credits, plan, email_opt_out')
      .eq('plan', 'free')
      .lte('credits', 0)
      .eq('email_opt_out', false)
      .limit(500)
    for (const u of broke ?? []) {
      if (results.creditsDrip >= BATCH) break
      if (!u.email) continue
      const ev = events.get(`${u.id}:credits-drip`)
      if (ev && ev.sent_count >= DRIP_MAX_SENDS) continue
      if (ev?.last_sent_at && ev.last_sent_at > dueBefore) continue
      try {
        await sendCreditsExhaustedEmail(u.email, (ev?.sent_count ?? 0) + 1, unsubscribeUrl(u.email), await userCurrency(admin, u.id))
        await markSent(u.id, 'credits-drip')
        results.creditsDrip++
      } catch { results.errors++ }
    }

    // ── 2. Getting-started nudge (2–14 days old, never generated an app) ──
    const twoDaysAgo = new Date(now - 2 * 24 * 3600_000).toISOString()
    const twoWeeksAgo = new Date(now - 14 * 24 * 3600_000).toISOString()
    const { data: fresh } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at')
      .lt('created_at', twoDaysAgo)
      .gt('created_at', twoWeeksAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of fresh ?? []) {
      if (results.gettingStarted >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:getting-started`)) continue // once, ever
      const { count } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', u.id)
      if ((count ?? 0) > 0) continue
      try {
        await sendGettingStartedNudgeEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], unsubscribeUrl(u.email))
        await markSent(u.id, 'getting-started')
        results.gettingStarted++
      } catch { results.errors++ }
    }

    // ── 3. Publish nudge (has a 3+ day-old project, nothing published) ─────
    const threeDaysAgo = new Date(now - 3 * 24 * 3600_000).toISOString()
    const { data: unpublished } = await admin
      .from('projects')
      .select('id, name, user_id, updated_at, is_public')
      .eq('is_public', false)
      .lt('updated_at', threeDaysAgo)
      .not('files', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(300)
    const seenOwner = new Set<string>()
    for (const proj of unpublished ?? []) {
      if (results.publishNudge >= BATCH) break
      if (seenOwner.has(proj.user_id)) continue
      seenOwner.add(proj.user_id)
      if (events.get(`${proj.user_id}:publish-nudge`)) continue // once, ever
      // Skip owners who already have ANY live app — they know how to publish.
      const { count: liveCount } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', proj.user_id)
        .eq('is_public', true)
      if ((liveCount ?? 0) > 0) continue
      const { data: owner } = await admin
        .from('profiles')
        .select('email, email_opt_out')
        .eq('id', proj.user_id)
        .single()
      if (!owner?.email || owner.email_opt_out) continue
      try {
        await sendPublishNudgeEmail(owner.email, proj.name || 'Your app', proj.id, unsubscribeUrl(owner.email))
        await markSent(proj.user_id, 'publish-nudge')
        results.publishNudge++
      } catch { results.errors++ }
    }
  } catch (err) {
    console.error('[email-drip] run failed:', String(err))
    return NextResponse.json({ ...results, error: String(err) }, { status: 500 })
  }

  console.log('[email-drip]', JSON.stringify(results))
  return NextResponse.json(results)
}

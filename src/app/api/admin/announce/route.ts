import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { sendEmail } from '@/lib/email/transport'
import { buildWyberCodeAnnouncement } from '@/lib/email'
import { unsubscribeUrl } from '@/lib/email/unsubscribe'
import { loadAudienceInput } from '@/lib/announce/load'
import { ANNOUNCEMENT_KIND, AUDIENCES, isTestAddressAllowed, maskEmail, planAudiences, type Audience } from '@/lib/announce/audiences'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * The WyberCode 1.0 announcement, with brakes. Admin only. Three actions:
 *   plan  counts per audience, who is excluded and why, a masked sample. Sends nothing.
 *   test  ONE email, to an address on a domain the founder owns, marked [TEST]. Not recorded as sent.
 *   send  the next small batch for ONE audience. Needs ANNOUNCE_ENABLED=true in the environment (off by default), a
 *         confirmed total that matches the live count, and skips anyone already sent. The page calls it repeatedly.
 * ANNOUNCE_DISABLED=true stops sending at once. Each success is recorded in email_events so nobody gets it twice.
 */
const FROM = 'WyberAi <hello@wyberai.com>'
const MAX_BATCH = 8
const TIME_BUDGET_MS = 40_000
const STOP_AFTER_FAILURES = 3

const isAudience = (v: unknown): v is Audience => typeof v === 'string' && (AUDIENCES as string[]).includes(v)

export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }

  let input
  try { input = await loadAudienceInput(admin) } catch (e) { return NextResponse.json({ error: `Could not read the audience: ${e instanceof Error ? e.message : 'error'}` }, { status: 500 }) }
  const plan = planAudiences(input)

  if (body.action === 'plan') {
    const summary = Object.fromEntries(AUDIENCES.map(a => [a, {
      total: plan.audiences[a].total, alreadySent: plan.audiences[a].sent, remaining: plan.audiences[a].remaining.length,
      sample: plan.audiences[a].remaining.slice(0, 3).map(r => maskEmail(r.email)),
    }]))
    return NextResponse.json({
      ok: true, accounts: plan.total, eligible: plan.eligible, excluded: plan.excluded, heldBack: plan.heldBack, alreadySent: plan.alreadySent, audiences: summary,
      sendEnabled: process.env.ANNOUNCE_ENABLED === 'true' && process.env.ANNOUNCE_DISABLED !== 'true',
    })
  }

  if (!isAudience(body.audience)) return NextResponse.json({ error: 'Unknown audience' }, { status: 400 })
  const audience = body.audience
  const extraCreditsAdded = body.extraCreditsAdded === true

  if (body.action === 'test') {
    const to = String(body.to ?? '').trim()
    if (!isTestAddressAllowed(to)) return NextResponse.json({ error: 'Test emails can only go to addresses on wyberai.com, continuumapi.com or signalpulsehq.com' }, { status: 400 })
    const mail = buildWyberCodeAnnouncement(audience, to, { name: 'Sumeet', extraCreditsAdded })
    try {
      await sendEmail({ from: FROM, to, subject: `[TEST] ${mail.subject}`, html: mail.html, text: mail.text, replyTo: 'hello@wyberai.com' })
    } catch (e) { return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'send failed' }, { status: 502 }) }
    return NextResponse.json({ ok: true, sentTo: maskEmail(to), audience })
  }

  if (body.action === 'send') {
    if (process.env.ANNOUNCE_DISABLED === 'true') return NextResponse.json({ error: 'Sending is switched off (ANNOUNCE_DISABLED)' }, { status: 423 })
    if (process.env.ANNOUNCE_ENABLED !== 'true') return NextResponse.json({ error: 'Sending is not enabled. Set ANNOUNCE_ENABLED=true in the environment when you are ready.' }, { status: 423 })
    const a = plan.audiences[audience]
    if (body.confirmTotal !== a.total) return NextResponse.json({ error: `The confirmed total (${String(body.confirmTotal)}) does not match the live total (${a.total}). Run the plan again.` }, { status: 409 })
    const limit = Math.max(1, Math.min(MAX_BATCH, Number(body.limit) || MAX_BATCH))
    const batch = a.remaining.slice(0, limit)
    const started = Date.now()
    let sent = 0, failed = 0, consecutive = 0
    let stopped: string | null = null
    for (const r of batch) {
      if (Date.now() - started > TIME_BUDGET_MS) { stopped = 'time budget for this batch used; call again'; break }
      const mail = buildWyberCodeAnnouncement(audience, r.email, { name: r.firstName, extraCreditsAdded })
      try {
        await sendEmail({
          from: FROM, to: r.email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: 'hello@wyberai.com',
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl(r.email)}>` },
        })
        const { error } = await admin.from('email_events').upsert({ user_id: r.id, kind: ANNOUNCEMENT_KIND, sent_count: 1, last_sent_at: new Date().toISOString() })
        if (error) { stopped = `sent to ${maskEmail(r.email)} but could not record it (${error.message}); stopped so nobody is emailed twice`; sent++; break }
        sent++; consecutive = 0
      } catch (e) {
        failed++; consecutive++
        console.error('[announce] send failed for', maskEmail(r.email), e instanceof Error ? e.message : e)
        if (consecutive >= STOP_AFTER_FAILURES) { stopped = `${STOP_AFTER_FAILURES} failures in a row; stopped`; break }
      }
    }
    return NextResponse.json({ ok: !stopped || sent > 0, audience, sent, failed, remainingAfter: Math.max(0, a.remaining.length - sent), stopped })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

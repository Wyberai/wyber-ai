import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AWARD_CREDITS, AWARD_LABEL, type AwardPlace } from '@/lib/challenge'
import { sendChallengeWinnerEmail } from '@/lib/email'

// Same allowlist as /admin so whoever runs the command center can judge.
const ADMIN_EMAILS = ['hello@wyberai.com', 'sumit@reconsignal.com', 'sumit.sutar259@gmail.com', 'admin@reconsignal.com']

// Award (or revoke) a weekly prize with one click. Awarding grants the prize
// credits to the entrant atomically via adjust_credits; revoking takes them
// back. All server-side + admin-gated so credits can never be self-granted.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { entryId, place, action } = await req.json().catch(() => ({})) as {
    entryId?: string; place?: AwardPlace; action?: 'award' | 'revoke'
  }
  if (!entryId || !place || !AWARD_CREDITS[place]) {
    return NextResponse.json({ error: 'entryId and a valid place are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: entry } = await db
    .from('challenge_entries')
    .select('id, user_id, week, title, award, awarded_credits')
    .eq('id', entryId)
    .single()
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  // ── Revoke ──────────────────────────────────────────────────────────────────
  if (action === 'revoke') {
    if (!entry.award) return NextResponse.json({ error: 'This entry has no award to revoke.' }, { status: 400 })
    const refund = entry.awarded_credits ?? AWARD_CREDITS[entry.award as AwardPlace]
    await db.rpc('adjust_credits', { p_user_id: entry.user_id, p_delta: -refund })
    const { error } = await db.from('challenge_entries')
      .update({ award: null, awarded_credits: null, awarded_at: null })
      .eq('id', entryId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, award: null })
  }

  // ── Award ───────────────────────────────────────────────────────────────────
  if (entry.award) {
    return NextResponse.json({ error: `Already awarded "${AWARD_LABEL[entry.award as AwardPlace]}". Revoke it first to change.` }, { status: 400 })
  }
  // One winner per place per week (also enforced by a unique index).
  const { data: taken } = await db
    .from('challenge_entries')
    .select('id, title')
    .eq('week', entry.week)
    .eq('award', place)
    .neq('id', entryId)
    .limit(1)
  if (taken?.length) {
    return NextResponse.json({ error: `${AWARD_LABEL[place]} is already assigned to "${taken[0].title}" this week. Revoke it first.` }, { status: 400 })
  }

  const credits = AWARD_CREDITS[place]
  const { data: newBalance, error: rpcErr } = await db.rpc('adjust_credits', { p_user_id: entry.user_id, p_delta: credits })
  if (rpcErr) return NextResponse.json({ error: `Credit grant failed: ${rpcErr.message}` }, { status: 500 })

  const { error } = await db.from('challenge_entries')
    .update({ award: place, awarded_credits: credits, awarded_at: new Date().toISOString() })
    .eq('id', entryId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort winner email.
  try {
    const { data: profile } = await db.from('profiles').select('email').eq('id', entry.user_id).single()
    if (profile?.email) {
      await sendChallengeWinnerEmail(profile.email, AWARD_LABEL[place], credits, typeof newBalance === 'number' ? newBalance : undefined)
    }
  } catch { /* email is non-critical */ }

  return NextResponse.json({ ok: true, award: place, credits })
}

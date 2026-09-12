import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PRIZE_USD, AWARD_LABEL, type AwardPlace } from '@/lib/challenge'
import { sendChallengeWinnerEmail } from '@/lib/email'
import { isAdminEmail } from '@/lib/admin'

// Award (or revoke) a monthly Wyber Premier League prize with one click.
// Prizes are real cash ($5k/$3k/$2k) — awarding records the amount and emails
// the winner to arrange payout (bank transfer/PayPal); it does NOT grant
// in-app credits (unlike the old Weekly Build Challenge this replaced). All
// server-side + admin-gated so a win can never be self-granted.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { entryId, place, action } = await req.json().catch(() => ({})) as {
    entryId?: string; place?: AwardPlace; action?: 'award' | 'revoke'
  }
  if (!entryId || !place || !PRIZE_USD[place]) {
    return NextResponse.json({ error: 'entryId and a valid place are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: entry } = await db
    .from('challenge_entries')
    .select('id, user_id, period, title, award, awarded_usd')
    .eq('id', entryId)
    .single()
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  // ── Revoke ──────────────────────────────────────────────────────────────────
  if (action === 'revoke') {
    if (!entry.award) return NextResponse.json({ error: 'This entry has no award to revoke.' }, { status: 400 })
    const { error } = await db.from('challenge_entries')
      .update({ award: null, awarded_usd: null, awarded_at: null })
      .eq('id', entryId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, award: null })
  }

  // ── Award ───────────────────────────────────────────────────────────────────
  if (entry.award) {
    return NextResponse.json({ error: `Already awarded "${AWARD_LABEL[entry.award as AwardPlace]}". Revoke it first to change.` }, { status: 400 })
  }
  // One winner per place per month (also enforced by a unique index).
  const { data: taken } = await db
    .from('challenge_entries')
    .select('id, title')
    .eq('period', entry.period)
    .eq('award', place)
    .neq('id', entryId)
    .limit(1)
  if (taken?.length) {
    return NextResponse.json({ error: `${AWARD_LABEL[place]} is already assigned to "${taken[0].title}" this month. Revoke it first.` }, { status: 400 })
  }
  // One win per person per month — entries are unlimited, so the same user
  // could otherwise occupy more than one of the 3 slots with different builds.
  const { data: alreadyWon } = await db
    .from('challenge_entries')
    .select('id, title, award')
    .eq('period', entry.period)
    .eq('user_id', entry.user_id)
    .not('award', 'is', null)
    .neq('id', entryId)
    .limit(1)
  if (alreadyWon?.length) {
    return NextResponse.json({ error: `This builder already won ${AWARD_LABEL[alreadyWon[0].award as AwardPlace]} this month with "${alreadyWon[0].title}" — one win per person per month.` }, { status: 400 })
  }

  const usd = PRIZE_USD[place]
  const { error } = await db.from('challenge_entries')
    .update({ award: place, awarded_usd: usd, awarded_at: new Date().toISOString() })
    .eq('id', entryId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort winner email.
  try {
    const { data: profile } = await db.from('profiles').select('email').eq('id', entry.user_id).single()
    if (profile?.email) {
      await sendChallengeWinnerEmail(profile.email, AWARD_LABEL[place], usd)
    }
  } catch { /* email is non-critical */ }

  return NextResponse.json({ ok: true, award: place, usd })
}

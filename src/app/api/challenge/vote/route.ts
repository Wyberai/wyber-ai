import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { VOTER_COOKIE } from '@/lib/challenge'

// Toggle a community upvote — OPEN, no login required, so shared social links
// convert. A vote is keyed to the signed-in user when there is one, otherwise
// to an anonymous per-browser cookie token (set here on first vote). One vote
// per voter per entry (enforced by a unique constraint). All writes go through
// the service role so vote_count (kept correct by a DB trigger) can't be forged.
export async function POST(req: NextRequest) {
  const { entryId } = await req.json().catch(() => ({})) as { entryId?: string }
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 })

  // Identity: prefer the logged-in user; fall back to (or mint) a cookie token.
  let userId: string | null = null
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    userId = user?.id ?? null
  } catch { /* anonymous */ }

  let token = req.cookies.get(VOTER_COOKIE)?.value ?? null
  let mintCookie = false
  if (!token) { token = crypto.randomUUID(); mintCookie = true }
  const voterKey = userId ? `u:${userId}` : `c:${token}`

  const db = createServiceClient()

  const { data: existing } = await db
    .from('challenge_votes')
    .select('id')
    .eq('entry_id', entryId)
    .eq('voter_key', voterKey)
    .limit(1)

  let voted: boolean
  if (existing?.length) {
    await db.from('challenge_votes').delete().eq('id', existing[0].id)
    voted = false
  } else {
    const { error } = await db.from('challenge_votes').insert({ entry_id: entryId, voter_key: voterKey, user_id: userId })
    // A duplicate (race) just means the vote already exists — treat as voted.
    if (error && !/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    voted = true
  }

  const { data: entry } = await db
    .from('challenge_entries')
    .select('vote_count')
    .eq('id', entryId)
    .single()

  const res = NextResponse.json({ ok: true, voted, count: entry?.vote_count ?? 0 })
  if (mintCookie) {
    res.cookies.set(VOTER_COOKIE, token, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax', path: '/' })
  }
  return res
}

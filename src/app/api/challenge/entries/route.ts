import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentChallengeWeek, VOTER_COOKIE } from '@/lib/challenge'

// Public: this week's approved gallery entries, ranked by upvotes. If the user
// is signed in, each entry is tagged with whether they've voted (for the UI
// toggle). Degrades gracefully to an empty list if the tables don't exist yet
// (i.e. before the migration is applied on prod) so the live page never breaks.
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week') || currentChallengeWeek()
  const db = createServiceClient()

  const { data: entries, error } = await db
    .from('challenge_entries')
    .select('id, title, description, handle, live_url, thumbnail_url, vote_count, created_at')
    .eq('week', week)
    .eq('status', 'approved')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    // Table missing (pre-migration) or transient DB issue — show an empty
    // gallery rather than 500-ing the challenge page.
    return NextResponse.json({ entries: [], week, votedIds: [] })
  }

  // Which of these has the current viewer already upvoted? Match the same
  // identity the vote route uses: signed-in user id, else the cookie token.
  let votedIds: string[] = []
  try {
    let userId: string | null = null
    try {
      const auth = await createClient()
      const { data: { user } } = await auth.auth.getUser()
      userId = user?.id ?? null
    } catch { /* anonymous */ }
    const token = req.cookies.get(VOTER_COOKIE)?.value ?? null
    const voterKey = userId ? `u:${userId}` : token ? `c:${token}` : null
    if (voterKey && entries?.length) {
      const { data: votes } = await db
        .from('challenge_votes')
        .select('entry_id')
        .eq('voter_key', voterKey)
        .in('entry_id', entries.map(e => e.id))
      votedIds = (votes ?? []).map(v => v.entry_id)
    }
  } catch { /* no identity yet */ }

  return NextResponse.json({ entries: entries ?? [], week, votedIds })
}

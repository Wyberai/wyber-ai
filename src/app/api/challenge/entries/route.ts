import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentChallengeWeek } from '@/lib/challenge'

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

  // Which of these has the current viewer already upvoted?
  let votedIds: string[] = []
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (user && entries?.length) {
      const { data: votes } = await db
        .from('challenge_votes')
        .select('entry_id')
        .eq('user_id', user.id)
        .in('entry_id', entries.map(e => e.id))
      votedIds = (votes ?? []).map(v => v.entry_id)
    }
  } catch { /* anonymous viewer */ }

  return NextResponse.json({ entries: entries ?? [], week, votedIds })
}

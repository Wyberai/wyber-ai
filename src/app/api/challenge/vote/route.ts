import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Toggle a community upvote. One vote per user per entry (enforced by a unique
// constraint); calling again removes the vote. All writes go through here with
// the service role so vote_count (kept correct by a DB trigger) can't be forged.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to upvote.' }, { status: 401 })

  const { entryId } = await req.json().catch(() => ({})) as { entryId?: string }
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 })

  const db = createServiceClient()

  const { data: existing } = await db
    .from('challenge_votes')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .limit(1)

  let voted: boolean
  if (existing?.length) {
    await db.from('challenge_votes').delete().eq('id', existing[0].id)
    voted = false
  } else {
    const { error } = await db.from('challenge_votes').insert({ entry_id: entryId, user_id: user.id })
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

  return NextResponse.json({ ok: true, voted, count: entry?.vote_count ?? 0 })
}

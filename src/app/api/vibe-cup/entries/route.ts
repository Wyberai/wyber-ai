import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

const VOTER_COOKIE = 'vc_voter'

export async function GET(req: NextRequest) {
  const db = createServiceClient()

  const { data: entries, error } = await db
    .from('vibe_cup_entries')
    .select('id, name, app_name, description, demo_url, vote_count, award, created_at')
    .eq('is_approved', true)
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[vibe-cup/entries] fetch error:', error)
    return NextResponse.json({ error: 'Failed to load entries.' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const voterToken = cookieStore.get(VOTER_COOKIE)?.value
  let votedIds: string[] = []

  if (voterToken) {
    const { data: votes } = await db
      .from('vibe_cup_votes')
      .select('entry_id')
      .eq('voter_key', `c:${voterToken}`)

    votedIds = (votes ?? []).map(v => v.entry_id as string)
  }

  return NextResponse.json({ entries: entries ?? [], votedIds })
}

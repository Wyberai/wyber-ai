import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

const VOTER_COOKIE = 'vc_voter'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function randomToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function POST(req: NextRequest) {
  const { entry_id } = await req.json().catch(() => ({})) as { entry_id?: string }
  if (!entry_id) return NextResponse.json({ error: 'entry_id required' }, { status: 400 })

  const cookieStore = await cookies()
  let voterToken = cookieStore.get(VOTER_COOKIE)?.value
  if (!voterToken) voterToken = randomToken()

  const voterKey = `c:${voterToken}`
  const db = createServiceClient()

  // Check if already voted
  const { data: existing } = await db
    .from('vibe_cup_votes')
    .select('id')
    .eq('entry_id', entry_id)
    .eq('voter_key', voterKey)
    .maybeSingle()

  let voted: boolean
  if (existing) {
    // Toggle off
    await db.from('vibe_cup_votes').delete().eq('id', existing.id)
    voted = false
  } else {
    // Toggle on
    await db.from('vibe_cup_votes').insert({ entry_id, voter_key: voterKey })
    voted = true
  }

  const { data: entry } = await db
    .from('vibe_cup_entries')
    .select('vote_count')
    .eq('id', entry_id)
    .single()

  const res = NextResponse.json({ ok: true, voted, count: entry?.vote_count ?? 0 })
  res.cookies.set(VOTER_COOKIE, voterToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
  return res
}

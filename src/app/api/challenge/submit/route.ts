import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentChallengeWeek } from '@/lib/challenge'
import { sendChallengeEntryAlert } from '@/lib/email'

// Submit an opt-in build to this week's challenge. Entering IS the consent:
// nothing about a user's app is exposed until they call this route.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    projectId?: string
    title?: string
    description?: string
    handle?: string
    liveUrl?: string
    showLive?: boolean // include a live demo link (default true when a project has one)
  }

  const title = (body.title ?? '').trim()
  const description = (body.description ?? '').trim()
  if (!title || title.length > 80) return NextResponse.json({ error: 'Title is required (max 80 chars).' }, { status: 400 })
  if (!description || description.length > 200) return NextResponse.json({ error: 'A one-line description is required (max 200 chars).' }, { status: 400 })

  const db = createServiceClient()
  const week = currentChallengeWeek()

  // One active entry per user per week.
  const { data: existing } = await db
    .from('challenge_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('week', week)
    .neq('status', 'hidden')
    .limit(1)
  if (existing?.length) {
    return NextResponse.json({ error: "You've already entered this week. Winners are picked Sunday — check back then." }, { status: 400 })
  }

  // If they attached one of their projects, verify ownership and pull its live
  // URL + thumbnail. Sharing the live link is opt-in (showLive); when they opt
  // in we flip the project public so /p/[id] resolves — never otherwise.
  let liveUrl: string | null = (body.liveUrl ?? '').trim() || null
  let thumbnailUrl: string | null = null
  const showLive = body.showLive !== false

  if (body.projectId) {
    const { data: project } = await db
      .from('projects')
      .select('id, user_id, deployed_url, published_url, thumbnail_url')
      .eq('id', body.projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

    thumbnailUrl = project.thumbnail_url ?? null
    if (showLive) {
      liveUrl = liveUrl || project.deployed_url || project.published_url || null
      if (liveUrl) await db.from('projects').update({ is_public: true }).eq('id', project.id)
    }
  }

  const { data: entry, error } = await db
    .from('challenge_entries')
    .insert({
      user_id: user.id,
      project_id: body.projectId ?? null,
      week,
      title,
      description,
      handle: (body.handle ?? '').trim() || null,
      live_url: liveUrl,
      thumbnail_url: thumbnailUrl,
      status: 'approved',
    })
    .select('id, title, description, handle, live_url, thumbnail_url, vote_count, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort owner notification — never fail the submission on email trouble.
  try { await sendChallengeEntryAlert({ userEmail: user.email ?? 'unknown', title, description, handle: entry.handle, liveUrl, week }) } catch {}

  return NextResponse.json({ ok: true, entry })
}

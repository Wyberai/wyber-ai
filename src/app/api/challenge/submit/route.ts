import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { currentWplMonth } from '@/lib/challenge'
import { sendChallengeEntryAlert, sendWplEntryConfirmation } from '@/lib/email'

const URL_RE = /^https?:\/\/.+/

// Submit an opt-in build to this month's Wyber Premier League. Entering IS the
// consent: nothing about a user's app is exposed until they call this route.
// Entries are unlimited per user per month by design — the more builds, the
// better (see src/lib/challenge.ts header).
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
    videoUrl?: string
  }

  const title = (body.title ?? '').trim()
  const description = (body.description ?? '').trim()
  if (!title || title.length > 80) return NextResponse.json({ error: 'Title is required (max 80 chars).' }, { status: 400 })
  if (!description || description.length > 200) return NextResponse.json({ error: 'A one-line description is required (max 200 chars).' }, { status: 400 })

  const db = createServiceClient()
  const period = currentWplMonth()

  // Project/live URL is required — real cash prizes need a working link to
  // judge and to vote on. Optionally attach one of their own projects (verified
  // ownership below) to auto-pull its live URL + thumbnail.
  let liveUrl: string | null = (body.liveUrl ?? '').trim() || null
  let thumbnailUrl: string | null = null

  if (body.projectId) {
    const { data: project } = await db
      .from('projects')
      .select('id, user_id, deployed_url, published_url, thumbnail_url')
      .eq('id', body.projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

    thumbnailUrl = project.thumbnail_url ?? null
    liveUrl = liveUrl || project.deployed_url || project.published_url || null
    if (liveUrl) await db.from('projects').update({ is_public: true }).eq('id', project.id)
  }

  if (!liveUrl || !URL_RE.test(liveUrl)) {
    return NextResponse.json({ error: 'A project URL (http:// or https://) is required.' }, { status: 400 })
  }

  const videoUrl = (body.videoUrl ?? '').trim() || null
  if (videoUrl && !URL_RE.test(videoUrl)) {
    return NextResponse.json({ error: 'Demo video link must start with http:// or https://' }, { status: 400 })
  }

  const { data: entry, error } = await db
    .from('challenge_entries')
    .insert({
      user_id: user.id,
      project_id: body.projectId ?? null,
      period,
      title,
      description,
      handle: (body.handle ?? '').trim() || null,
      live_url: liveUrl,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      status: 'approved',
    })
    .select('id, title, description, handle, live_url, video_url, thumbnail_url, vote_count, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort notifications — never fail the submission on email trouble.
  try { await sendChallengeEntryAlert({ userEmail: user.email ?? 'unknown', title, description, handle: entry.handle, liveUrl, videoUrl, period }) } catch {}
  if (user.email) { try { await sendWplEntryConfirmation(user.email, title, period, entry.id) } catch {} }

  return NextResponse.json({ ok: true, entry })
}

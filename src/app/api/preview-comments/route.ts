import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/cloud/rate-limit'
import { notify } from '@/lib/push'

// Feedback-mode comment pins (see comment-snippet.ts). The POST here is a
// public, unauthenticated write called from an anonymous reviewer's browser
// on a published app's own origin — same trust model as /api/analytics/track
// and /api/public/cloud-insert. GET/PATCH/DELETE are owner-only.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MAX_BODY_LENGTH = 500
const MAX_NAME_LENGTH = 80

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const projectId = body?.projectId
    const commentBody = typeof body?.body === 'string' ? body.body.trim() : ''
    const pagePath = typeof body?.pagePath === 'string' ? body.pagePath.slice(0, 200) : '/'
    const xPct = Number(body?.xPct)
    const yPct = Number(body?.yPct)
    const authorName = typeof body?.authorName === 'string' ? body.authorName.trim().slice(0, MAX_NAME_LENGTH) : null

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!commentBody || commentBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ success: false, error: `body must be 1-${MAX_BODY_LENGTH} characters` }, { status: 400, headers: CORS_HEADERS })
    }
    if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) {
      return NextResponse.json({ success: false, error: 'xPct/yPct must be numbers' }, { status: 400, headers: CORS_HEADERS })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit({ route: '/api/preview-comments', userId: `${projectId}:${ip}`, limit: 20, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests — please try again shortly.' }, { status: 429, headers: CORS_HEADERS })
    }

    const admin = await createAdminClient()

    // Only projects that opted into Feedback Mode accept pins — an
    // arbitrary published app never grows a write target just by existing.
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id, feedback_mode_enabled, name')
      .eq('id', projectId)
      .maybeSingle()
    if (!project || !project.feedback_mode_enabled) {
      return NextResponse.json({ success: false, error: 'Feedback mode is not enabled for this project' }, { status: 404, headers: CORS_HEADERS })
    }

    const { error } = await admin.from('preview_comments').insert({
      project_id: projectId,
      page_path: pagePath,
      x_pct: xPct,
      y_pct: yPct,
      body: commentBody,
      author_name: authorName,
    })
    if (error) {
      console.error('[preview-comments] insert failed:', error)
      return NextResponse.json({ success: false, error: 'Could not save feedback' }, { status: 500, headers: CORS_HEADERS })
    }

    notify(admin, project.user_id, 'preview_comment', {
      projectName: project.name,
      message: authorName ? `${authorName} left feedback on ${project.name || 'your project'}` : `New feedback on ${project.name || 'your project'}`,
    }).catch(() => {})

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('[preview-comments] Error:', err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: project } = await admin.from('projects').select('id, feedback_mode_enabled').eq('id', projectId).eq('user_id', user.id).maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data, error } = await admin
    .from('preview_comments')
    .select('id, page_path, x_pct, y_pct, body, author_name, resolved, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [], feedbackModeEnabled: !!project.feedback_mode_enabled })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, resolved } = await req.json().catch(() => ({}))
  if (!id || typeof resolved !== 'boolean') return NextResponse.json({ error: 'Missing id or resolved' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: comment } = await admin.from('preview_comments').select('id, project_id').eq('id', id).maybeSingle()
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: project } = await admin.from('projects').select('id').eq('id', comment.project_id).eq('user_id', user.id).maybeSingle()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.from('preview_comments').update({ resolved }).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: comment } = await admin.from('preview_comments').select('id, project_id').eq('id', id).maybeSingle()
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: project } = await admin.from('projects').select('id').eq('id', comment.project_id).eq('user_id', user.id).maybeSingle()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.from('preview_comments').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

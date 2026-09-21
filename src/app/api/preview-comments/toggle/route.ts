import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Flips projects.feedback_mode_enabled — the switch that controls whether
// comment-snippet.ts's widget gets injected on the next publish. Separate
// route from the comments CRUD in ../route.ts since it operates on the
// project, not a comment.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, enabled } = await req.json().catch(() => ({}))
  if (!projectId || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing projectId or enabled' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: project } = await admin.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await admin.from('projects').update({ feedback_mode_enabled: enabled }).eq('id', projectId)
  return NextResponse.json({ success: true, enabled })
}

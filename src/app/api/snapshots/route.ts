import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Internal callers (the MCP save_snapshot/list_snapshots tools) have no
// browser session — they authenticate with X-Scheduler-Secret +
// X-Scheduler-User-Id, the same internal-bypass convention used by
// /api/publish and /api/generate.
async function resolveUser(req: NextRequest): Promise<{ id: string } | null> {
  const schedulerSecret = req.headers.get('x-scheduler-secret')
  const schedulerUserId = req.headers.get('x-scheduler-user-id')
  if (schedulerUserId && schedulerSecret === internalSecret()) {
    return { id: schedulerUserId }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? { id: user.id } : null
}

// GET /api/snapshots?project_id=xxx  — list snapshots for a project
export async function GET(req: NextRequest) {
  const user = await resolveUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceClient()

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('project_snapshots')
    .select('id, label, created_at')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ snapshots: data })
}

// POST /api/snapshots  — save a snapshot
export async function POST(req: NextRequest) {
  const user = await resolveUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceClient()

  const body = await req.json()
  const { project_id, label, files } = body as { project_id: string; label?: string; files: Record<string, unknown> }
  if (!project_id || !files) return NextResponse.json({ error: 'project_id and files required' }, { status: 400 })

  const { data, error } = await supabase
    .from('project_snapshots')
    .insert({ project_id, user_id: user.id, label: label || '', files })
    .select('id, label, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ snapshot: data })
}

// DELETE /api/snapshots?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('project_snapshots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/snapshots/[id] — fetch full snapshot files for restore
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Internal callers (the MCP restore_snapshot tool) have no browser session —
  // same X-Scheduler-Secret/X-Scheduler-User-Id bypass as /api/publish.
  const schedulerSecret = req.headers.get('x-scheduler-secret')
  const schedulerUserId = req.headers.get('x-scheduler-user-id')
  const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

  let userId: string
  let supabase: ReturnType<typeof createServiceClient>
  if (isInternalCall) {
    userId = schedulerUserId!
    supabase = createServiceClient()
  } else {
    const cookieClient = await createClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
    supabase = createServiceClient()
  }

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { id } = await params
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('id, label, files, created_at')
    .eq('id', id)
    .eq('project_id', projectId) // prevents a snapshot from one project silently restoring onto another
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ snapshot: data })
}

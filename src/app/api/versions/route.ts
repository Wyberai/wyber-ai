import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Internal callers (build-runner.ts auto-checkpointing before an MCP
    // build) have no browser session — same X-Scheduler-Secret/
    // X-Scheduler-User-Id bypass as /api/publish.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

    let userId: string
    if (isInternalCall) {
      userId = schedulerUserId!
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      userId = user.id
    }

    const { projectId, files, label } = await req.json()
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    const { data, error } = await db.from('project_versions').insert({
      project_id: projectId, user_id: userId, files,
      label: label || new Date().toLocaleString(),
    }).select('id, label, created_at').single()
    if (error) throw error
    return NextResponse.json({ version: data })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const projectId = req.nextUrl.searchParams.get('projectId')
    const { data, error } = await supabase.from('project_versions')
      .select('id, label, created_at, files')
      .eq('project_id', projectId!).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
    if (error) throw error
    return NextResponse.json({ versions: data })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess, canAttachProject } from '@/lib/agency/access'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const projectId = body.projectId
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  const admin = await createAdminClient()

  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  // Must be the caller's own project, or one in the client's workspace — otherwise anyone could attach a
  // stranger's project as if they'd built it for this client.
  if (!(await canAttachProject(admin, user.id, projectId, access.client))) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data: existing } = await admin.from('client_deliverables').select('sort_order').eq('client_id', clientId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const nextSort = (existing?.sort_order ?? -1) + 1

  const { data, error } = await admin.from('client_deliverables').insert({
    client_id: clientId,
    project_id: projectId,
    headline: body.headline || null,
    description: body.description || null,
    sort_order: nextSort,
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'This project is already attached to this client' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ deliverable: data }, { status: 201 })
}

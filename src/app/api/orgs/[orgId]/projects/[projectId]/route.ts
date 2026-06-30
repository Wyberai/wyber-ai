import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'

type Params = { params: Promise<{ orgId: string; projectId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.update')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json() as { name?: string; description?: string }
  const updates: Record<string, string | null> = {}
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.description === 'string') updates.description = body.description

  const db = createServiceClient()
  const { data: before } = await db.from('projects').select('*').eq('id', projectId).eq('org_id', orgId).single()
  const { data, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('org_id', orgId)
    .select('id, name, description')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'project.updated', resourceType: 'project', resourceId: projectId,
    before, after: data, req,
  }).catch(() => {})

  return NextResponse.json({ project: data })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { orgId, projectId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.delete')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data: before } = await db.from('projects').select('id, name').eq('id', projectId).eq('org_id', orgId).single()
  const { error } = await db.from('projects').delete().eq('id', projectId).eq('org_id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'project.deleted', resourceType: 'project', resourceId: projectId,
    before, req,
  }).catch(() => {})

  return NextResponse.json({ deleted: true })
}

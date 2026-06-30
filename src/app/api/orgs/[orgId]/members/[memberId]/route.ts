import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability, type OrgRole } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'

type Params = { params: Promise<{ orgId: string; memberId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { orgId, memberId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.change_member_role')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json() as { role?: OrgRole }
  if (!body.role || !['owner', 'admin', 'member', 'viewer'].includes(body.role)) {
    return NextResponse.json({ error: 'Valid role required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: before } = await db.from('organization_members').select('role').eq('id', memberId).eq('org_id', orgId).single()
  const { data, error } = await db
    .from('organization_members')
    .update({ role: body.role })
    .eq('id', memberId)
    .eq('org_id', orgId)
    .select('id, role')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'org.member_role_changed', resourceType: 'organization_member', resourceId: memberId,
    before, after: data, req,
  }).catch(() => {})

  return NextResponse.json({ member: data })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { orgId, memberId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.remove_members')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data: before } = await db.from('organization_members').select('*').eq('id', memberId).eq('org_id', orgId).single()
  const { error } = await db.from('organization_members').delete().eq('id', memberId).eq('org_id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'org.member_removed', resourceType: 'organization_member', resourceId: memberId,
    before, req,
  }).catch(() => {})

  return NextResponse.json({ removed: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, id, 'org.manage_settings')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json()
  const allowed = ['name', 'website', 'industry', 'company_size', 'description', 'logo_url', 'custom_domain']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) { if (body[k] !== undefined) updates[k] = body[k] }

  const db = createServiceClient()
  const { data: before } = await db.from('organizations').select('*').eq('id', id).single()
  const { data, error } = await db
    .from('organizations').update(updates)
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logAuditEvent({
    orgId: id, userId: user!.id, action: 'org.settings_updated', resourceType: 'organization', resourceId: id,
    before, after: data, req,
  }).catch(() => {})

  return NextResponse.json({ organization: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, id, 'org.delete')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { error } = await db.from('organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

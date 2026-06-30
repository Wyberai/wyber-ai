import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'

type Params = { params: Promise<{ orgId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.view')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data, error } = await db.from('organizations').select('*').eq('id', orgId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organization: data, role: check.role })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.manage_settings')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json() as { name?: string; logo_url?: string; website?: string; industry?: string; company_size?: string }
  const updates: Record<string, string> = {}
  for (const key of ['name', 'logo_url', 'website', 'industry', 'company_size'] as const) {
    if (typeof body[key] === 'string') updates[key] = body[key] as string
  }

  const db = createServiceClient()
  const { data: before } = await db.from('organizations').select('*').eq('id', orgId).single()
  const { data, error } = await db.from('organizations').update(updates).eq('id', orgId).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'org.settings_updated', resourceType: 'organization', resourceId: orgId,
    before, after: data, req,
  }).catch(() => {})

  return NextResponse.json({ organization: data })
}

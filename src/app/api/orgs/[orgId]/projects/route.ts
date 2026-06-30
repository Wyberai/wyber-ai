import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'

type Params = { params: Promise<{ orgId: string }> }

// GET — list projects scoped to this org (relies on the additive RLS policy + explicit filter)
export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.view')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data, error } = await db
    .from('projects')
    .select('id, name, description, framework, deployed_url, thumbnail_url, updated_at, user_id')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

// POST — create a project attributed to the caller, scoped to this org
export async function POST(req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.create')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json().catch(() => ({})) as { name?: string; description?: string }

  const db = createServiceClient()
  const { data, error } = await db
    .from('projects')
    .insert({
      user_id: user!.id,
      org_id: orgId,
      name: body.name?.trim() || 'Untitled App',
      description: body.description ?? null,
    })
    .select('id, name, org_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'project.created', resourceType: 'project', resourceId: data.id,
    after: data, req,
  }).catch(() => {})

  return NextResponse.json({ project: data })
}

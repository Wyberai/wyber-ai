import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { orgHasFeature } from '@/lib/orgs/entitlements'
import { logAuditEvent } from '@/lib/orgs/audit'

type Params = { params: Promise<{ orgId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.manage_sso')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data } = await db
    .from('org_sso_connections')
    .select('workos_org_id, domain, status, created_at')
    .eq('org_id', orgId)
    .maybeSingle()

  return NextResponse.json({ connection: data ?? null })
}

// Registers (or re-registers) a WorkOS organization for SSO. Actual IdP connection setup
// happens in the WorkOS dashboard/Admin Portal; this just stores the mapping so our
// SSO login/callback routes know which org an incoming WorkOS login belongs to.
export async function POST(req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.manage_sso')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const hasFeature = await orgHasFeature(orgId, 'sso')
  if (!hasFeature) return NextResponse.json({ error: 'SSO requires an Enterprise plan' }, { status: 403 })

  const body = await req.json() as { workosOrgId?: string; domain?: string }
  if (!body.workosOrgId) return NextResponse.json({ error: 'workosOrgId required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('org_sso_connections')
    .upsert(
      { org_id: orgId, workos_org_id: body.workosOrgId, domain: body.domain ?? null, status: 'pending' },
      { onConflict: 'org_id' }
    )
    .select('workos_org_id, domain, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'org.sso_connected', resourceType: 'org_sso_connection', resourceId: orgId,
    after: data, req,
  }).catch(() => {})

  return NextResponse.json({ connection: data })
}

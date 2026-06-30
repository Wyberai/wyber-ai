import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability } from '@/lib/orgs/rbac'
import { orgHasFeature } from '@/lib/orgs/entitlements'

type Params = { params: Promise<{ orgId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.view_audit_logs')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const hasFeature = await orgHasFeature(orgId, 'audit_logs')
  if (!hasFeature) return NextResponse.json({ error: 'Audit logs require an Enterprise plan' }, { status: 403 })

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const offset = Number(url.searchParams.get('offset') ?? 0)

  const db = createServiceClient()
  const { data, error } = await db
    .from('audit_logs')
    .select('id, user_id, action, resource_type, resource_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

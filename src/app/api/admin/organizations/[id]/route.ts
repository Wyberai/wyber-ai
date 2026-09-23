import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { logAuditEvent } from '@/lib/orgs/audit'

const PLANS = ['free', 'pro', 'enterprise']

// Platform-staff plan changes (e.g. after an enterprise deal closes) — the only
// other way to set organizations.plan is a raw SQL script against prod. Every
// change is written to the org's own audit_logs so the customer can see it too.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { plan?: string }
  if (!body.plan || !PLANS.includes(body.plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const admin = createAdminClient()
  const { data: before } = await admin.from('organizations').select('*').eq('id', id).single()
  if (!before) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const { data, error } = await admin.from('organizations').update({ plan: body.plan, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId: id, userId: user.id, action: 'org.plan_changed_by_admin', resourceType: 'organization', resourceId: id,
    before: { plan: before.plan }, after: { plan: data.plan }, req,
  }).catch(() => {})

  return NextResponse.json({ organization: data })
}

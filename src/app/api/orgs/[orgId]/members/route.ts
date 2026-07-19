import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireOrgCapability, type OrgRole } from '@/lib/orgs/rbac'
import { logAuditEvent } from '@/lib/orgs/audit'
import { sendTeamInviteEmail } from '@/lib/email'

type Params = { params: Promise<{ orgId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'project.view')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const db = createServiceClient()
  const { data, error } = await db
    .from('organization_members')
    .select('id, user_id, role, invited_via, created_at, profiles(email)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { orgId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  const check = await requireOrgCapability(user?.id, orgId, 'org.invite_members')
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status })

  const body = await req.json() as { email?: string; role?: OrgRole }
  const email = (body.email ?? '').trim().toLowerCase()
  const role: OrgRole = body.role && ['admin', 'member', 'viewer'].includes(body.role) ? body.role : 'member'
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const db = createServiceClient()
  const { data: existingUser } = await db.from('profiles').select('id, email').eq('email', email).maybeSingle()
  const { data: org } = await db.from('organizations').select('name').eq('id', orgId).single()

  if (!existingUser) {
    // No account yet — record nothing server-side beyond the invite email; they'll join via SSO/signup later.
    sendTeamInviteEmail(email, user!.email ?? 'A teammate', org?.name ?? 'your team', `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'}/dashboard`).catch(() => {})
    return NextResponse.json({ invited: true, pending: true })
  }

  const { data: inserted, error } = await db
    .from('organization_members')
    .upsert({ org_id: orgId, user_id: existingUser.id, role, invited_via: 'manual' }, { onConflict: 'org_id,user_id' })
    .select('id, role')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAuditEvent({
    orgId, userId: user!.id, action: 'org.member_invited', resourceType: 'organization_member', resourceId: inserted.id,
    after: { email, role }, req,
  }).catch(() => {})

  sendTeamInviteEmail(email, user!.email ?? 'A teammate', org?.name ?? 'your team', `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'}/dashboard`).catch(() => {})

  return NextResponse.json({ member: inserted, invited: true })
}

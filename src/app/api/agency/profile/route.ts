import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { myWorkspaces } from '@/lib/agency/access'
import { PROFILE_COLUMNS, validateProfile } from '@/lib/agency/profile'

// The business profile for one tenant: yours, or a workspace you belong to (?orgId=). Anyone in the workspace can read
// it; only its owners and admins can change it. There is no way to read or write someone else's.
async function who(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse }
  const admin = await createAdminClient()
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) return { admin, user, orgId: null as string | null, canWrite: true }
  const space = (await myWorkspaces(admin, user.id)).find(s => s.id === orgId)
  if (!space) return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }) as NextResponse }
  return { admin, user, orgId, canWrite: space.role === 'owner' || space.role === 'admin' }
}

export async function GET(req: NextRequest) {
  const w = await who(req)
  if (!w.admin) return w.res
  const q = w.orgId ? w.admin.from('agency_profiles').select(PROFILE_COLUMNS).eq('org_id', w.orgId) : w.admin.from('agency_profiles').select(PROFILE_COLUMNS).eq('owner_id', w.user.id)
  const { data } = await q.maybeSingle()
  return NextResponse.json({ profile: data ?? null, canWrite: w.canWrite })
}

export async function PUT(req: NextRequest) {
  const w = await who(req)
  if (!w.admin) return w.res
  if (!w.canWrite) return NextResponse.json({ error: 'Only the workspace owner or an admin can change the business profile' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const v = validateProfile(body.profile ?? body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const key = w.orgId ? { org_id: w.orgId } : { owner_id: w.user.id }
  const existing = await (w.orgId ? w.admin.from('agency_profiles').select('id').eq('org_id', w.orgId) : w.admin.from('agency_profiles').select('id').eq('owner_id', w.user.id)).maybeSingle()
  const row = { ...v.profile, updated_at: new Date().toISOString() }
  const { data, error } = existing.data
    ? await w.admin.from('agency_profiles').update(row).eq('id', existing.data.id).select(PROFILE_COLUMNS).maybeSingle()
    : await w.admin.from('agency_profiles').insert({ ...key, ...row }).select(PROFILE_COLUMNS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

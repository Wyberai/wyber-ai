import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // PostgREST's .in.() takes a literal value list, not a subquery — the old
  // inline "id.in.(select org_id …)" was sent verbatim as a uuid and 500'd.
  // Resolve the user's member orgs first, then filter by owner OR membership.
  const { data: memberships } = await db
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
  const memberOrgIds = (memberships ?? []).map(m => m.org_id).filter(Boolean)

  const orFilter = memberOrgIds.length
    ? `owner_id.eq.${user.id},id.in.(${memberOrgIds.join(',')})`
    : `owner_id.eq.${user.id}`

  const { data, error } = await db
    .from('organizations')
    .select('*, organization_members(user_id, role)')
    .or(orFilter)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organizations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, website, industry, company_size, description } = body

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Check slug uniqueness
  const { data: existing } = await db.from('organizations').select('id').eq('slug', slug.trim()).single()
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  const { data, error } = await db.from('organizations').insert({
    name: name.trim(),
    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    owner_id: user.id,
    website, industry, company_size, description,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organization: data }, { status: 201 })
}

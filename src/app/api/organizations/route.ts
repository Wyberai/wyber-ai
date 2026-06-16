import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('organizations')
    .select('*, organization_members(user_id, role)')
    .or(`owner_id.eq.${user.id},id.in.(select org_id from organization_members where user_id = '${user.id}')`)
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

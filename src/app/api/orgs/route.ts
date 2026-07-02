import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET — list orgs the caller belongs to
export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: memberships, error } = await db
    .from('organization_members')
    .select('role, organizations(id, name, slug, plan, logo_url)')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organizations: memberships ?? [] })
}

// POST — create a new org; caller becomes owner
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string; slug?: string }
  const name = (body.name ?? '').trim()
  const slug = (body.slug ?? '').trim().toLowerCase()
  if (!name || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'name and a lowercase, alphanumeric/hyphen slug are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: org, error } = await db
    .from('organizations')
    .insert({ name, slug, owner_id: user.id })
    .select('id, name, slug, plan')
    .single()

  if (error) {
    // 23505 = unique_violation — the slug is taken, a user mistake not a server fault.
    if (error.code === '23505') {
      return NextResponse.json({ error: `The URL slug "${slug}" is already taken — pick another.` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: memberError } = await db
    .from('organization_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'owner', invited_via: 'manual' })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  return NextResponse.json({ organization: org })
}

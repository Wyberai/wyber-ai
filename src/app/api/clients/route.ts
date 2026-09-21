import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .select('*, client_deliverables(id)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const admin = await createAdminClient()

  // Non-guessable slug (no auth gate on the public /client/[slug] page, so
  // this is the only thing standing between "the client I sent this to" and
  // "anyone who guesses a URL") — a readable prefix plus a random suffix.
  const slug = `${slugify(name) || 'client'}-${nanoid(8)}`

  const { data, error } = await admin.from('clients').insert({
    owner_id: user.id,
    name,
    slug,
    company_name: body.companyName || null,
    contact_email: body.contactEmail || null,
    contact_name: body.contactName || null,
    logo_url: body.logoUrl || null,
    brand_color: body.brandColor || '#0EA5E9',
    intro_text: body.introText || null,
    notes: body.notes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { visibleClients, myWorkspaces } from '@/lib/agency/access'
import { clientForOwner, CLIENT_LIST_SELECT } from '@/lib/agency/shape'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

// Your own clients, plus every client in the agency workspaces you belong to.
export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const rows = await visibleClients(admin, user.id, CLIENT_LIST_SELECT)
  return NextResponse.json({ clients: rows.map(clientForOwner) })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const admin = await createAdminClient()

  // A client can live in an agency workspace so teammates share it. The caller must be able to edit in that workspace.
  let orgId: string | null = null
  if (body.orgId) {
    const space = (await myWorkspaces(admin, user.id)).find(s => s.id === body.orgId)
    if (!space || space.role === 'viewer') return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    orgId = space.id
  }

  // Non-guessable slug (no auth gate on the public /client/[slug] page, so
  // this is the only thing standing between "the client I sent this to" and
  // "anyone who guesses a URL") — a readable prefix plus a random suffix.
  const slug = `${slugify(name) || 'client'}-${nanoid(12)}`

  const { data, error } = await admin.from('clients').insert({
    owner_id: user.id,
    org_id: orgId,
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
  return NextResponse.json({ client: clientForOwner(data) }, { status: 201 })
}

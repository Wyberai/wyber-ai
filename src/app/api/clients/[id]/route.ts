import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const PATCHABLE = ['name', 'companyName', 'contactEmail', 'contactName', 'logoUrl', 'brandColor', 'introText', 'status', 'notes'] as const
const COLUMN_FOR: Record<(typeof PATCHABLE)[number], string> = {
  name: 'name', companyName: 'company_name', contactEmail: 'contact_email', contactName: 'contact_name',
  logoUrl: 'logo_url', brandColor: 'brand_color', introText: 'intro_text', status: 'status', notes: 'notes',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCHABLE) {
    if (body[key] !== undefined) updates[COLUMN_FOR[key]] = body[key]
  }
  if (updates.status !== undefined && !['lead', 'active', 'paused', 'archived'].includes(updates.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('clients').update(updates)
    .eq('id', id).eq('owner_id', user.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ client: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { error, count } = await admin.from('clients').delete({ count: 'exact' }).eq('id', id).eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

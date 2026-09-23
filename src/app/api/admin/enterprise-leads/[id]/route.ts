import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

const STATUSES = ['new', 'contacted', 'demo_scheduled', 'design_partner', 'won', 'lost']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { status?: string; notes?: string; org_id?: string }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = body.status
  }
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.org_id !== undefined) updates.org_id = body.org_id || null

  const admin = createAdminClient()
  const { data, error } = await admin.from('enterprise_leads').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

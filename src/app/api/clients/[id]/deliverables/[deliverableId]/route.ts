import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id: clientId, deliverableId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Two-step ownership check (avoids relying on an embedded-filter join
  // behaving a particular way — see preview-comments/route.ts's PATCH for
  // the same reasoning).
  const { data: deliverable } = await admin.from('client_deliverables').select('id, client_id').eq('id', deliverableId).eq('client_id', clientId).maybeSingle()
  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: client } = await admin.from('clients').select('id').eq('id', clientId).eq('owner_id', user.id).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (body.headline !== undefined) updates.headline = body.headline
  if (body.description !== undefined) updates.description = body.description
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  if (body.isVisible !== undefined) updates.is_visible = body.isVisible

  const { data, error } = await admin.from('client_deliverables').update(updates).eq('id', deliverableId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deliverable: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id: clientId, deliverableId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: deliverable } = await admin.from('client_deliverables').select('id').eq('id', deliverableId).eq('client_id', clientId).maybeSingle()
  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: client } = await admin.from('clients').select('id').eq('id', clientId).eq('owner_id', user.id).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.from('client_deliverables').delete().eq('id', deliverableId)
  return NextResponse.json({ success: true })
}

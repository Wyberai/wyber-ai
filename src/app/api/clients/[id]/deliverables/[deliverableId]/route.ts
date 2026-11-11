import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { emailClient } from '@/lib/agency/notify'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id: clientId, deliverableId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })
  const { data: deliverable } = await admin.from('client_deliverables').select('id, client_id').eq('id', deliverableId).eq('client_id', clientId).maybeSingle()
  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (body.headline !== undefined) updates.headline = body.headline
  if (body.description !== undefined) updates.description = body.description
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  if (body.isVisible !== undefined) updates.is_visible = body.isVisible
  // "Ask for review again" after you have made the changes they asked for. Only a reset is allowed here: approval is the client's to give.
  if (body.reviewStatus === 'pending') { updates.review_status = 'pending'; updates.reviewed_at = null }
  // Handover: mark it delivered (or take that back), with a note for the client: repo, domain, logins, how to edit.
  if (typeof body.delivered === 'boolean') updates.delivered_at = body.delivered ? new Date().toISOString() : null
  if (body.handoverNote !== undefined) updates.handover_note = typeof body.handoverNote === 'string' ? body.handoverNote.trim().slice(0, 2000) || null : null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const { data, error } = await admin.from('client_deliverables').update(updates).eq('id', deliverableId).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const mail = body.delivered === true && body.emailClient ? await emailClient(admin, access.client as never, { kind: 'delivered', message: data.handover_note }) : null
  return NextResponse.json({ deliverable: data, email: mail })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id: clientId, deliverableId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })
  const { data: deliverable } = await admin.from('client_deliverables').select('id').eq('id', deliverableId).eq('client_id', clientId).maybeSingle()
  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.from('client_deliverables').delete().eq('id', deliverableId)
  return NextResponse.json({ success: true })
}

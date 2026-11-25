import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id: clientId, updateId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  const { data: row } = await admin.from('client_updates').select('id').eq('id', updateId).eq('client_id', clientId).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await admin.from('client_updates').delete().eq('id', updateId)
  return NextResponse.json({ success: true })
}

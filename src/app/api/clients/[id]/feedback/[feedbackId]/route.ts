import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'

// "Mark done" on a client's change request once you have made the change, so they can see it is handled.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; feedbackId: string }> }) {
  const { id: clientId, feedbackId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.resolved !== 'boolean') return NextResponse.json({ error: 'resolved must be true or false' }, { status: 400 })

  const { data, error } = await admin.from('client_feedback')
    .update({ resolved: body.resolved, resolved_at: body.resolved ? new Date().toISOString() : null })
    .eq('id', feedbackId).eq('client_id', clientId).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ feedback: data })
}

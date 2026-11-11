import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { newBriefToken } from '@/lib/agency/brief'

// The intake link: a separate, shareable address where the client answers a few questions before any project exists.
// POST makes (or replaces) the link; DELETE turns it off. A replaced or removed link stops working at once.
async function guard(id: string) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, id)
  if (!access) return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!access.canEdit) return { res: NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 }) }
  return { admin }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (!g.admin) return g.res
  const token = newBriefToken(() => randomBytes(18).toString('base64url'))
  const { error } = await g.admin.from('clients').update({ brief_token: token, brief: null, brief_submitted_at: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ brief_token: token })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (!g.admin) return g.res
  const { error } = await g.admin.from('clients').update({ brief_token: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

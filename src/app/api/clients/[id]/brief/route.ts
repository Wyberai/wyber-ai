import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { newBriefToken } from '@/lib/agency/brief'
import { auditClient } from '@/lib/agency/audit'
import { emailClient } from '@/lib/agency/notify'

// The intake link: a separate, shareable address where the client answers a few questions before any project exists.
// POST makes (or replaces) the link, and can email it; { resend: true } emails the current link without changing it.
// DELETE turns it off. A replaced or removed link stops working at once.
async function guard(id: string) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, id)
  if (!access) return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!access.canEdit) return { res: NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 }) }
  return { admin, access, userId: user.id }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (!g.admin) return g.res
  const body = await req.json().catch(() => ({}))
  const c = g.access.client as unknown as { id: string; owner_id: string; org_id: string | null; name: string; slug: string; contact_email: string | null; status: string; brief_token: string | null }

  let token = c.brief_token
  if (body.resend === true) {
    if (!token) return NextResponse.json({ error: 'Make the intake link first' }, { status: 409 })
  } else {
    token = newBriefToken(() => randomBytes(18).toString('base64url'))
    const { error } = await g.admin.from('clients').update({ brief_token: token, brief: null, brief_submitted_at: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    auditClient(g.access, g.userId, 'intake_link_created', undefined, req)
  }

  let mail: Awaited<ReturnType<typeof emailClient>> | null = null
  if (body.emailClient === true || body.resend === true) {
    // An intake link is usually sent to a lead, so only an archived client is refused. emailClient wants an active
    // client, so it is told so for this one send.
    mail = c.status === 'archived'
      ? { sent: false, reason: 'inactive' }
      : await emailClient(g.admin, { ...c, status: 'active' }, { kind: 'brief', link: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'}/brief/${token}` })
  }
  return NextResponse.json({ brief_token: token, email: mail })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (!g.admin) return g.res
  const { error } = await g.admin.from('clients').update({ brief_token: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

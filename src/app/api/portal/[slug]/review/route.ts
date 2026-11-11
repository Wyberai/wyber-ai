import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hit, LIMITS } from '@/lib/agency/limits'
import { loadActivePortalClient, portalAllowed, requestIp } from '@/lib/agency/portal'
import { sendClientFeedbackAlert } from '@/lib/email'

const KINDS = ['approved', 'changes_requested', 'comment'] as const
type Kind = (typeof KINDS)[number]
const MAX_NOTE = 1500
const MAX_NAME = 80

// A client reviewing a deliverable on their page: approve it, ask for changes (a note is required), or just comment.
// No account is needed; the link, and the passcode if one is set, is the access.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!(await hit(`portal-review:${requestIp(req)}:${slug}`, LIMITS.reviewPerIp.max, LIMITS.reviewPerIp.windowMs))) {
    return NextResponse.json({ error: 'Too many messages. Try again in a few minutes.' }, { status: 429 })
  }

  const admin = await createAdminClient()
  const client = await loadActivePortalClient(admin, slug)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!portalAllowed(client, req)) return NextResponse.json({ error: 'Enter the passcode first' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const kind = body.kind as Kind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Choose approve, request changes or comment' }, { status: 400 })
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE) : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : ''
  if (kind !== 'approved' && !note) return NextResponse.json({ error: 'Tell them what to change' }, { status: 400 })

  const { data: deliverable } = await admin
    .from('client_deliverables').select('id, headline, is_visible, projects(name)')
    .eq('id', typeof body.deliverableId === 'string' ? body.deliverableId : '').eq('client_id', client.id).maybeSingle()
  if (!deliverable || !deliverable.is_visible) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin.from('client_feedback').insert({
    client_id: client.id, deliverable_id: deliverable.id, kind, author_name: name || null, body: note || null,
  })
  if (error) return NextResponse.json({ error: 'Could not save that. Try again.' }, { status: 500 })

  // A comment adds to the thread without changing where the deliverable stands.
  let reviewStatus: string | null = null
  if (kind !== 'comment') {
    reviewStatus = kind
    await admin.from('client_deliverables').update({ review_status: kind, reviewed_at: new Date().toISOString() }).eq('id', deliverable.id)
  }

  // Best effort: tell the agency, at most once every ten minutes per client (the link is public, so a flood of
  // reviews must not become a flood of emails). A failed email never fails the client's review.
  try {
    if (!(await hit(`review-alert:${client.id}`, LIMITS.reviewAlert.max, LIMITS.reviewAlert.windowMs))) return NextResponse.json({ ok: true, reviewStatus })
    const { data: owner } = await admin.from('profiles').select('email').eq('id', client.owner_id).maybeSingle()
    const proj = deliverable.projects as { name?: string } | Array<{ name?: string }> | null
    const projectName = Array.isArray(proj) ? proj[0]?.name : proj?.name
    if (owner?.email) {
      await sendClientFeedbackAlert({ to: owner.email, clientName: client.name, deliverable: deliverable.headline || projectName || 'a deliverable', kind, author: name || null, note: note || null })
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true, reviewStatus })
}

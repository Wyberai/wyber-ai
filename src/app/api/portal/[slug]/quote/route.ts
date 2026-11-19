import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hit, LIMITS } from '@/lib/agency/limits'
import { loadActivePortalClient, portalAllowed, requestIp } from '@/lib/agency/portal'
import { clientCanRespond, formatMoney, type QuoteStatus } from '@/lib/agency/quote'
import { sendClientEventAlert } from '@/lib/email'

// The client answers a quote on their page: accept it (with their name, which is the record) or decline it.
// Only a quote that was sent and is still waiting can be answered, once.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!(await hit(`portal-quote:${requestIp(req)}:${slug}`, LIMITS.quotePerIp.max, LIMITS.quotePerIp.windowMs))) {
    return NextResponse.json({ error: 'Too many tries. Wait a few minutes.' }, { status: 429 })
  }
  const admin = await createAdminClient()
  const client = await loadActivePortalClient(admin, slug)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!portalAllowed(client, req)) return NextResponse.json({ error: 'Enter the passcode first' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body.action
  if (action !== 'accept' && action !== 'decline') return NextResponse.json({ error: 'Choose accept or decline' }, { status: 400 })
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  if (action === 'accept' && name.length < 2) return NextResponse.json({ error: 'Type your name to accept' }, { status: 400 })
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  const { data: quote } = await admin.from('client_quotes').select('*').eq('id', typeof body.quoteId === 'string' ? body.quoteId : '').eq('client_id', client.id).maybeSingle()
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!clientCanRespond(quote.status as QuoteStatus)) return NextResponse.json({ error: 'This quote has already been answered' }, { status: 409 })

  const status = action === 'accept' ? 'accepted' : 'declined'
  const { data: updated, error } = await admin.from('client_quotes')
    .update({ status, responded_at: new Date().toISOString(), responded_by: name || null, decline_reason: action === 'decline' ? reason || null : null })
    .eq('id', quote.id).eq('status', 'sent').select().maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not save that. Try again.' }, { status: 500 })
  if (!updated) return NextResponse.json({ error: 'This quote has already been answered' }, { status: 409 })

  try {
    const { data: owner } = await admin.from('profiles').select('email').eq('id', client.owner_id).maybeSingle()
    if (owner?.email) await sendClientEventAlert({ to: owner.email, clientName: client.name, event: action === 'accept' ? 'quote_accepted' : 'quote_declined', detail: `${quote.number} ${quote.title}, ${formatMoney(Number(quote.total), quote.currency)}${name ? `, by ${name}` : ''}${reason ? `. Reason: ${reason}` : ''}` })
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true, status })
}

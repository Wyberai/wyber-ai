import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { validateItems, validatePaymentUrl, isCurrency, ownerCan, formatMoney, type QuoteStatus } from '@/lib/agency/quote'
import { emailClient } from '@/lib/agency/notify'

type P = { params: Promise<{ id: string; quoteId: string }> }

async function load(clientId: string, quoteId: string) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!access.canEdit) return { res: NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 }) }
  const { data: quote } = await admin.from('client_quotes').select('*').eq('id', quoteId).eq('client_id', clientId).maybeSingle()
  if (!quote) return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { admin, access, quote }
}

// Edit a draft, or move a quote along: { action: 'send' | 'withdraw' | 'markPaid' }.
export async function PATCH(req: NextRequest, { params }: P) {
  const { id: clientId, quoteId } = await params
  const g = await load(clientId, quoteId)
  if (!g.admin) return g.res
  const { admin, access, quote } = g
  const can = ownerCan(quote.status as QuoteStatus)
  const body = await req.json().catch(() => ({}))

  if (body.action === 'send') {
    if (!can.send) return NextResponse.json({ error: 'Only a draft can be sent' }, { status: 409 })
    const { data, error } = await admin.from('client_quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quoteId).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const mail = body.emailClient ? await emailClient(admin, access.client as never, { kind: 'quote', quoteTitle: `${quote.number} ${quote.title}`, quoteTotal: formatMoney(Number(quote.total), quote.currency) }) : null
    return NextResponse.json({ quote: data, email: mail })
  }
  if (body.action === 'withdraw') {
    if (!can.withdraw) return NextResponse.json({ error: 'Only a quote that is waiting for an answer can be withdrawn' }, { status: 409 })
    const { data } = await admin.from('client_quotes').update({ status: 'draft', sent_at: null }).eq('id', quoteId).select().maybeSingle()
    return NextResponse.json({ quote: data })
  }
  if (body.action === 'markPaid') {
    if (!can.markPaid) return NextResponse.json({ error: 'Only an accepted quote can be marked paid' }, { status: 409 })
    const { data } = await admin.from('client_quotes').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', quoteId).select().maybeSingle()
    return NextResponse.json({ quote: data })
  }

  // Otherwise: edit. Only while it is still a draft, so a client never sees numbers change under them.
  if (!can.edit) return NextResponse.json({ error: 'A sent quote cannot be edited. Withdraw it first.' }, { status: 409 })
  const updates: Record<string, unknown> = {}
  if (body.items !== undefined) {
    const items = validateItems(body.items)
    if (!items.ok) return NextResponse.json({ error: items.error }, { status: 400 })
    updates.items = items.items; updates.total = items.total
  }
  if (body.paymentUrl !== undefined) {
    const url = validatePaymentUrl(body.paymentUrl)
    if (!url.ok) return NextResponse.json({ error: 'The payment link must start with https://' }, { status: 400 })
    updates.payment_url = url.url
  }
  if (body.currency !== undefined) { if (!isCurrency(body.currency)) return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 }); updates.currency = body.currency }
  if (typeof body.title === 'string') updates.title = body.title.trim().slice(0, 120) || 'Quote'
  if (body.note !== undefined) updates.note = typeof body.note === 'string' ? body.note.trim().slice(0, 1500) || null : null
  if (body.paymentInstructions !== undefined) updates.payment_instructions = typeof body.paymentInstructions === 'string' ? body.paymentInstructions.trim().slice(0, 1000) || null : null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
  const { data, error } = await admin.from('client_quotes').update(updates).eq('id', quoteId).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quote: data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id: clientId, quoteId } = await params
  const g = await load(clientId, quoteId)
  if (!g.admin) return g.res
  if (!ownerCan(g.quote.status as QuoteStatus).remove) return NextResponse.json({ error: 'A quote the client has accepted or is still considering cannot be deleted' }, { status: 409 })
  await g.admin.from('client_quotes').delete().eq('id', quoteId)
  return NextResponse.json({ success: true })
}

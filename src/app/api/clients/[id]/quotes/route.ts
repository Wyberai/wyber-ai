import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { validateItems, validatePaymentUrl, isCurrency, isRecurrence, nextQuoteNumber } from '@/lib/agency/quote'

// A new draft quote for a client. Nothing is shown to the client until you send it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const items = validateItems(body.items)
  if (!items.ok) return NextResponse.json({ error: items.error }, { status: 400 })
  const url = validatePaymentUrl(body.paymentUrl)
  if (!url.ok) return NextResponse.json({ error: 'The payment link must start with https://' }, { status: 400 })
  const currency = isCurrency(body.currency) ? body.currency : 'USD'
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : 'Quote'

  const { data: existing } = await admin.from('client_quotes').select('number').eq('client_id', clientId)
  const number = nextQuoteNumber(((existing ?? []) as Array<{ number: string }>).map(r => r.number))

  const { data, error } = await admin.from('client_quotes').insert({
    client_id: clientId, number, title, currency, items: items.items, total: items.total,
    note: typeof body.note === 'string' ? body.note.trim().slice(0, 1500) || null : null,
    payment_instructions: typeof body.paymentInstructions === 'string' ? body.paymentInstructions.trim().slice(0, 1000) || null : null,
    payment_url: url.url, status: 'draft',
    terms: typeof body.terms === 'string' ? body.terms.trim().slice(0, 2000) || null : null,
    recurrence: isRecurrence(body.recurrence) ? body.recurrence : 'one_time',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quote: data }, { status: 201 })
}

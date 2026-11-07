import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { computeTotal, shareMessage, toUsd, validateQuoteInput, DEFAULT_INR_PER_USD, type QuoteRow } from '@/lib/quotes/quote'

const BASE = () => (process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com').replace(/\/$/, '')
const PRE_PROPOSAL = ['new', 'contacted', 'replied', 'meeting_booked', 'met']

// Edit a DRAFT, send it, or withdraw it. A sent quote is never edited in place
// (the client may be reading it): withdraw it and make a new one.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })

  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  const action = typeof b?.action === 'string' ? b.action : ''
  const { data: q, error: loadErr } = await admin.from('crm_quotes').select('*').eq('id', id).maybeSingle()
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const quote = q as QuoteRow
  const now = new Date().toISOString()

  if (action === 'update') {
    if (quote.status !== 'draft') return NextResponse.json({ error: 'A sent quote cannot be edited. Withdraw it and make a new one.' }, { status: 409 })
    const v = validateQuoteInput(b!)
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
    const { data, error } = await admin.from('crm_quotes').update({ ...v.value, total: computeTotal(v.value.items), updated_at: now }).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quote: data })
  }

  if (action === 'send') {
    if (quote.status !== 'draft') return NextResponse.json({ error: `This quote is already ${quote.status}` }, { status: 409 })
    const { data, error } = await admin.from('crm_quotes').update({ status: 'sent', sent_at: now, updated_at: now }).eq('id', id).eq('status', 'draft').select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Keep the CRM truthful: the deal is now at "proposal" with this value and a follow-up.
    let contactName: string | undefined
    if (quote.contact_id) {
      const inr = Number(process.env.CRM_INR_PER_USD) || DEFAULT_INR_PER_USD
      const { data: c } = await admin.from('crm_contacts').select('id, name, stage').eq('id', quote.contact_id).maybeSingle()
      if (c) {
        contactName = (c as { name: string }).name
        const patch: Record<string, unknown> = {
          value_usd: toUsd(quote.total, quote.currency, inr), last_touch_at: now, updated_at: now,
          next_action: 'Follow up on the quote', next_action_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
        }
        if (PRE_PROPOSAL.includes((c as { stage: string }).stage)) patch.stage = 'proposal'
        await admin.from('crm_contacts').update(patch).eq('id', quote.contact_id)
        await admin.from('crm_activities').insert({ contact_id: quote.contact_id, kind: 'system', summary: `Quote sent: ${quote.title} (${quote.currency} ${quote.total})`, by: 'admin' })
      }
    }
    const url = `${BASE()}/quote/${quote.token}`
    return NextResponse.json({ quote: data, url, message: shareMessage(quote, url, contactName) })
  }

  // Record that the client has paid. This stops the collections agent reminding them.
  if (action === 'mark_paid') {
    if (quote.status !== 'accepted') return NextResponse.json({ error: 'Only an accepted quote can be marked paid' }, { status: 409 })
    const { data, error } = await admin.from('crm_quotes').update({ paid_at: now, updated_at: now }).eq('id', id).is('paid_at', null).select('*').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Already marked as paid' }, { status: 409 })
    if (quote.contact_id) await admin.from('crm_activities').insert({ contact_id: quote.contact_id, kind: 'system', summary: `Payment received: ${quote.title}`, by: 'admin' })
    return NextResponse.json({ quote: data })
  }

  if (action === 'withdraw') {
    if (quote.status === 'accepted') return NextResponse.json({ error: 'An accepted quote cannot be withdrawn' }, { status: 409 })
    const { data, error } = await admin.from('crm_quotes').update({ status: 'expired', updated_at: now }).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quote: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

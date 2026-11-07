import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { canAccept, formatMoney, isToken, toUsd, validateAcceptName, DEFAULT_INR_PER_USD, type QuoteRow } from '@/lib/quotes/quote'
import { sendQuoteAcceptedAlert } from '@/lib/email'

// PUBLIC: a client accepts a quote from its private link. Anyone on the internet
// can reach this, so: unguessable token, rate limit, the quote must really be
// acceptable, a typed name is required, and the update is conditional so two
// clicks cannot both succeed. Always answers with the same shape.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`quote-accept:${ip}`, 10, 60 * 60_000).allowed) return NextResponse.json({ ok: false, error: 'Too many attempts. Please try again later.' }, { status: 429 })

  const { token } = await params
  if (!isToken(token)) return NextResponse.json({ ok: false, error: 'This link is not valid.' }, { status: 404 })

  const b = await req.json().catch(() => null) as { name?: unknown; agree?: unknown } | null
  const name = validateAcceptName(b?.name)
  if (!name.ok) return NextResponse.json({ ok: false, error: name.error }, { status: 400 })
  if (b?.agree !== true) return NextResponse.json({ ok: false, error: 'Please tick the box to confirm.' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin.from('crm_quotes').select('*').eq('token', token).maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, error: 'This link is not valid.' }, { status: 404 })
  const quote = data as QuoteRow

  const can = canAccept(quote)
  if (!can.ok) return NextResponse.json({ ok: false, error: can.reason }, { status: 409 })

  const now = new Date().toISOString()
  // Conditional update: only one request can move it from sent/viewed to accepted.
  const upd = await admin.from('crm_quotes').update({ status: 'accepted', accepted_at: now, accepted_by: name.name, updated_at: now }).eq('id', quote.id).in('status', ['sent', 'viewed']).select('id')
  if (upd.error) return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  if (!upd.data || upd.data.length === 0) return NextResponse.json({ ok: false, error: 'This quote has already been accepted.' }, { status: 409 })

  // The rest is best-effort: the acceptance is already recorded.
  const totalLabel = formatMoney(quote.total, quote.currency)
  let contactName: string | null = null
  try {
    if (quote.contact_id) {
      const inr = Number(process.env.CRM_INR_PER_USD) || DEFAULT_INR_PER_USD
      const c = await admin.from('crm_contacts').select('name').eq('id', quote.contact_id).maybeSingle()
      contactName = (c.data as { name: string } | null)?.name ?? null
      await admin.from('crm_contacts').update({
        stage: 'won', closed_at: now, last_touch_at: now, updated_at: now, lost_reason: null,
        value_usd: toUsd(quote.total, quote.currency, inr), next_action: 'Confirm payment and delivery details in writing', next_action_at: now,
      }).eq('id', quote.contact_id)
      await admin.from('crm_activities').insert({
        contact_id: quote.contact_id, kind: 'system', by: 'client',
        summary: `Quote accepted by ${name.name}: ${quote.title}, ${totalLabel}${quote.currency === 'INR' ? ` (counted in the pipeline at ${inr} INR per USD)` : ''}`,
      })
    }
  } catch (e) { console.error('[quote-accept] crm update failed:', e instanceof Error ? e.message : e) }
  try { await sendQuoteAcceptedAlert({ title: quote.title, totalLabel, acceptedBy: name.name, contactName }) } catch (e) { console.error('[quote-accept] alert failed:', e instanceof Error ? e.message : e) }

  return NextResponse.json({ ok: true })
}

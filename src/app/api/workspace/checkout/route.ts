import { NextRequest, NextResponse } from 'next/server'
import { QuoteChangedError } from '@/lib/domains/orders'
import { createWorkspaceOrder, startDodoCheckout } from '@/lib/domains/checkout'
import { parseContact } from '@/lib/domains/contact'
import { isSandbox } from '@/lib/domains'
import { workspaceEnabled } from '@/lib/domains/config'
import { splitDomain } from '@/lib/domains/pricing'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// POST /api/workspace/checkout: seats and a domain the person owns (bought here, or their own). Same confirmation rules as domains.
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!workspaceEnabled(process.env, user.email)) return NextResponse.json({ error: 'Google Workspace is not available yet' }, { status: 503 })
  const ctx = await context()
  if (!ctx) return notConfigured()
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const contact = parseContact(b.contact)
  if (!contact.ok) return NextResponse.json({ error: contact.error }, { status: 400 })
  const domain = String(b.domain ?? '').trim().toLowerCase()
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) return NextResponse.json({ error: 'Enter the domain you want email on, like example.com' }, { status: 400 })
  try {
    const order = await createWorkspaceOrder({ provider: ctx.provider, store: ctx.store, inrPerUsd: ctx.inr }, {
      userId: user.id, domain, seats: Number(b.seats), months: Number(b.months ?? 12), contact: contact.contact,
      confirmedTotalCents: Number(b.confirmedTotalCents), acknowledged: b.acknowledged === true,
    })
    if (isSandbox(ctx.provider)) return NextResponse.json({ orderId: order.id, sandbox: true, url: null })
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
    const { url, checkoutId } = await startDodoCheckout(order, user, origin, `/dashboard/domains?order=${order.id}`)
    if (checkoutId) await ctx.store.patchOrder(order.id, { dodo_checkout_id: checkoutId })
    return NextResponse.json({ orderId: order.id, url, ownDomain: !splitDomain(domain) ? true : undefined })
  } catch (e) {
    if (e instanceof QuoteChangedError) return NextResponse.json({ error: e.message, totalCents: e.totalCents }, { status: 409 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout failed' }, { status: 400 })
  }
}

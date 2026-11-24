import { NextRequest, NextResponse } from 'next/server'
import { createDomainOrder, QuoteChangedError } from '@/lib/domains/orders'
import { startDodoCheckout } from '@/lib/domains/checkout'
import { parseContact } from '@/lib/domains/contact'
import { isSandbox } from '@/lib/domains'
import { canEditProject } from '@/lib/project-access'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// POST /api/domains/checkout. Money step: needs acknowledged=true and the exact total the person confirmed on screen.
// The server re-prices and re-checks availability, creates the order, and returns the payment page URL.
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const contact = parseContact(b.contact)
  if (!contact.ok) return NextResponse.json({ error: contact.error }, { status: 400 })
  const projectId = typeof b.projectId === 'string' && b.projectId ? b.projectId : null
  if (projectId && !(await canEditProject(ctx.admin, user.id, projectId))) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  try {
    const order = await createDomainOrder({ provider: ctx.provider, store: ctx.store, inrPerUsd: ctx.inr }, {
      userId: user.id, domain: String(b.domain ?? '').toLowerCase(), years: Number(b.years ?? 1), projectId,
      contact: contact.contact, confirmedTotalCents: Number(b.confirmedTotalCents), acknowledged: b.acknowledged === true,
    })
    if (isSandbox(ctx.provider)) return NextResponse.json({ orderId: order.id, sandbox: true, url: null })
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
    const { url, checkoutId } = await startDodoCheckout(order, user, origin, `/dashboard/domains?order=${order.id}`).catch(async e => {
      // No payment page, nothing taken: close the order so it does not sit waiting for a payment that cannot happen.
      await ctx.store.patchOrder(order.id, { status: 'cancelled', error: e instanceof Error ? e.message : String(e) })
      throw e
    })
    if (checkoutId) await ctx.store.patchOrder(order.id, { dodo_checkout_id: checkoutId })
    return NextResponse.json({ orderId: order.id, url })
  } catch (e) {
    if (e instanceof QuoteChangedError) return NextResponse.json({ error: e.message, totalCents: e.totalCents }, { status: 409 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout failed' }, { status: 400 })
  }
}

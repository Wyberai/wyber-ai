import { NextRequest, NextResponse } from 'next/server'
import { createRenewalOrder, QuoteChangedError, renewalPreview } from '@/lib/domains/orders'
import { startDodoCheckout } from '@/lib/domains/checkout'
import { renewalPolicyLines } from '@/lib/domains/policy'
import { workspaceMarginCents } from '@/lib/domains/config'
import { isSandbox } from '@/lib/domains'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// GET  /api/domains/renew?kind=domain|workspace&domain=x.com&years=1  : the price and new end date to show before paying.
// POST /api/domains/renew { kind, domain, years|months, confirmedTotalCents, acknowledged } : money step, same rules as a
// purchase (the server re-prices; the total the person saw must still be the real total).
const kindOf = (v: unknown): 'domain' | 'workspace' | null => (v === 'domain' || v === 'workspace' ? v : null)

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  const p = req.nextUrl.searchParams
  const kind = kindOf(p.get('kind'))
  if (!kind) return NextResponse.json({ error: 'Choose a domain or a Workspace order' }, { status: 400 })
  try {
    const preview = await renewalPreview({ provider: ctx.provider, store: ctx.store, inrPerUsd: ctx.inr }, { userId: user.id, kind, domain: p.get('domain') ?? '', years: Number(p.get('years') ?? 1), months: Number(p.get('months') ?? 12) })
    return NextResponse.json({ preview, policy: renewalPolicyLines(kind, workspaceMarginCents()), sandbox: isSandbox(ctx.provider) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not price this renewal' }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const kind = kindOf(b.kind)
  if (!kind) return NextResponse.json({ error: 'Choose a domain or a Workspace order' }, { status: 400 })
  try {
    const order = await createRenewalOrder({ provider: ctx.provider, store: ctx.store, inrPerUsd: ctx.inr }, {
      userId: user.id, kind, domain: String(b.domain ?? ''), years: Number(b.years ?? 1), months: Number(b.months ?? 12),
      confirmedTotalCents: Number(b.confirmedTotalCents), acknowledged: b.acknowledged === true,
    })
    if (isSandbox(ctx.provider)) return NextResponse.json({ orderId: order.id, sandbox: true, url: null })
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
    const { url, checkoutId } = await startDodoCheckout(order, user, origin, `/dashboard/domains?order=${order.id}`)
    if (checkoutId) await ctx.store.patchOrder(order.id, { dodo_checkout_id: checkoutId })
    return NextResponse.json({ orderId: order.id, url })
  } catch (e) {
    if (e instanceof QuoteChangedError) return NextResponse.json({ error: e.message, totalCents: e.totalCents }, { status: 409 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Renewal failed' }, { status: 400 })
  }
}

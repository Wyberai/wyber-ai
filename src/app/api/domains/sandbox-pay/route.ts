import { NextRequest, NextResponse } from 'next/server'
import { fulfilOrder } from '@/lib/domains/orders'
import { isSandbox } from '@/lib/domains'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// Sandbox only (DOMAINS_PROVIDER=fake, never on production): marks an order paid and runs the same fulfilment the
// payment webhook runs, so the whole flow can be walked through without taking money.
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  if (!isSandbox(ctx.provider)) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string }
  const order = orderId ? await ctx.store.getOrder(orderId) : null
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const r = await fulfilOrder({ provider: ctx.provider, store: ctx.store }, order.id)
  return NextResponse.json(r)
}

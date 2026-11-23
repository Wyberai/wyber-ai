import { workspaceMarginCents, workspaceRegionFor, WORKSPACE_MAX_SEATS, WORKSPACE_MONTH_OPTIONS } from './config'
import { POLICY_VERSION } from './policy'
import { workspaceQuoteFor } from './search'
import { QuoteChangedError, type Order, type OrderStore } from './orders'
import type { ContactDetails, DomainsProvider } from './types'

export async function createWorkspaceOrder(
  deps: { provider: DomainsProvider; store: OrderStore; inrPerUsd?: number; env?: Record<string, string | undefined> },
  input: { userId: string; domain: string; seats: number; months: number; contact: ContactDetails; confirmedTotalCents: number; acknowledged: boolean },
): Promise<Order> {
  if (!input.acknowledged) throw new Error('Please confirm the item, price and policy before paying')
  if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > WORKSPACE_MAX_SEATS) throw new Error(`Choose between 1 and ${WORKSPACE_MAX_SEATS} seats`)
  if (!(WORKSPACE_MONTH_OPTIONS as readonly number[]).includes(input.months)) throw new Error('Workspace is sold for 12 months')
  const region = workspaceRegionFor(input.contact.country)
  const q = await workspaceQuoteFor(deps.provider, region, input.seats, input.months, deps.inrPerUsd, deps.env)
  if (!q) throw new Error('Workspace pricing is not available yet')
  if (q.totalCents !== input.confirmedTotalCents) throw new QuoteChangedError(q.totalCents)
  return deps.store.insertOrder({
    user_id: input.userId, kind: 'workspace', domain: input.domain.toLowerCase(), project_id: null, years: null, months: input.months, seats: input.seats, region,
    registry_cents: q.registryCents, margin_cents: q.marginCents, total_cents: q.totalCents, contact: input.contact, policy_version: POLICY_VERSION,
  })
}

export { workspaceMarginCents }

/** Starts the platform's existing Dodo checkout (pay-what-you-want product, amount set per order) and returns its URL. */
export async function startDodoCheckout(order: Order, user: { id: string; email?: string }, origin: string, returnPath: string, env: Record<string, string | undefined> = process.env): Promise<{ url: string; checkoutId: string | null }> {
  const productId = env.DODO_PRODUCT_DOMAIN
  const apiKey = env.DODO_PAYMENTS_API_KEY
  if (!productId) throw new Error('Checkout is not configured: DODO_PRODUCT_DOMAIN is not set')
  if (!apiKey) throw new Error('Checkout is not configured: DODO_PAYMENTS_API_KEY is not set')
  const res = await fetch('https://live.dodopayments.com/checkouts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1, amount: order.total_cents }],
      customer: { email: user.email || order.contact.email, name: order.contact.name },
      return_url: `${origin}${returnPath}`,
      metadata: { user_id: user.id, purchase_type: 'commerce_order', commerce_order_id: order.id, kind: order.kind, domain: order.domain },
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { checkout_url?: string; url?: string; payment_link?: string; id?: string }
  const url = data.checkout_url || data.url || data.payment_link
  if (!res.ok || !url) throw new Error('The payment page could not be started. You have not been charged.')
  return { url, checkoutId: data.id ?? null }
}

// ── Employee pricing (fixed, simple) ──────────────────────────────────────────
// One monthly price per role. Payment is handled via Dodo Payments: each role is
// a Dodo product; on approval the customer is emailed that product's checkout
// link. No dynamic/surge pricing.

export interface RolePrice {
  priceCents: number
  priceLabel: string
  checkoutUrl: string | null
}

// Monthly price (USD cents) per role slug.
const PRICE_CENTS: Record<string, number> = {
  'marketing-manager': 42400, // $424/mo
}
const DEFAULT_PRICE_CENTS = 39900

export function priceCentsFor(roleSlug: string): number {
  return PRICE_CENTS[roleSlug] ?? DEFAULT_PRICE_CENTS
}

// Dodo product checkout link per role. Set once you create the product in Dodo:
//   env  DODO_CHECKOUT_MARKETING_MANAGER=https://checkout.dodopayments.com/...
// Falls back to a generic DODO_CHECKOUT_URL if a role-specific one isn't set.
export function checkoutUrlFor(roleSlug: string): string | null {
  const key = `DODO_CHECKOUT_${roleSlug.toUpperCase().replace(/-/g, '_')}`
  return process.env[key] ?? process.env.DODO_CHECKOUT_URL ?? null
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function getRolePrice(roleSlug: string): RolePrice {
  const priceCents = priceCentsFor(roleSlug)
  return { priceCents, priceLabel: `${formatPrice(priceCents)}/mo`, checkoutUrl: checkoutUrlFor(roleSlug) }
}

// ── Demand-based ("IRCTC-style") pricing for AI employees ─────────────────────
// One global, floating monthly price per role that rises with demand and offers
// a founding discount while adoption is low. The runtime computes it from live
// signals (active hires + recent hires); base prices are config below.

export interface PriceSignals {
  activeHires: number   // total currently-active employees of this role (all customers)
  recentHires: number   // hires of this role in the last 30 days
}

export interface DynamicPrice {
  priceCents: number
  basePriceCents: number
  surgePct: number      // +/- vs base, e.g. 0.12 = +12%, -0.15 = founding discount
  label: string         // human framing of the current market
  hot: boolean
}

// Monthly base price (USD cents) per role slug. Tune freely.
const BASE_PRICE_CENTS: Record<string, number> = {
  'marketing-manager': 49900, // $499/mo
}
const DEFAULT_BASE_CENTS = 39900

// Surge knobs.
const PER_ACTIVE_HIRE = 0.02   // +2% per currently-active hire of this role
const PER_RECENT_HIRE = 0.015  // +1.5% per hire in the last 30 days (momentum)
const SURGE_CEILING    = 0.60  // never more than +60% over base
const FOUNDING_THRESHOLD = 5   // under this many active hires → founding discount
const FOUNDING_DISCOUNT  = 0.15 // -15% while founding

export function basePriceCents(roleSlug: string): number {
  return BASE_PRICE_CENTS[roleSlug] ?? DEFAULT_BASE_CENTS
}

export function computeDynamicPrice(roleSlug: string, signals: PriceSignals): DynamicPrice {
  const base = basePriceCents(roleSlug)
  const { activeHires, recentHires } = signals

  let surge = activeHires * PER_ACTIVE_HIRE + recentHires * PER_RECENT_HIRE
  surge = Math.min(surge, SURGE_CEILING)

  // Founding discount only applies while there's genuinely little adoption AND
  // no surge has kicked in yet.
  const founding = activeHires < FOUNDING_THRESHOLD
  if (founding) surge = -FOUNDING_DISCOUNT

  const priceCents = Math.round((base * (1 + surge)) / 100) * 100 // round to whole dollar
  const hot = surge >= 0.15

  const label = founding
    ? 'Founding price — lock in a lower rate while he\'s new. It rises as more teams hire him.'
    : hot
      ? `🔥 In demand — ${recentHires} team${recentHires === 1 ? '' : 's'} hired him recently. Price is rising.`
      : 'Market price — adjusts with demand.'

  return { priceCents, basePriceCents: base, surgePct: surge, label, hot }
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

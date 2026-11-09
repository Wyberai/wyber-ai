// SINGLE SOURCE OF TRUTH for plan facts (names, prices, monthly credits).
// 2026-11-09: paid-plan credits tripled at unchanged prices (Spark 50->150, Starter 150->450, Builder 500->1,500,
// Pro 1,500->4,500). The free plan stays at 30. The daily drip (src/lib/plan-grants.ts) is unchanged.
// The wrong-credits bug on the dashboard's Starter upsell happened
// because these numbers were copy-pasted across ~6 files and drifted. Any UI
// that states a plan's price or credits must read from here — never inline
// the number. (Longer marketing copy — feature bullets, taglines — may stay
// local to the page, but the FACTS come from here.)

export interface PlanFacts {
  id: 'free' | 'spark' | 'starter' | 'builder' | 'pro'
  name: string
  /** USD per month, monthly billing. null = not purchasable (free). */
  monthlyPrice: number | null
  /** USD per month when billed annually. */
  annualPrice: number | null
  monthlyPriceINR: number | null
  annualPriceINR: number | null
  /** Credits granted per month. */
  credits: number
  /** Brand accent used for this plan across the UI. */
  color: string
  /** INR/UPI-only India entry plan — hidden on USD storefront. */
  inrOnly?: boolean
  /** Hide this plan for India/INR users only. */
  hideForINR?: boolean
}

export const PLAN_FACTS: Record<PlanFacts['id'], PlanFacts> = {
  free: {
    id: 'free', name: 'Free',
    monthlyPrice: null, annualPrice: null, monthlyPriceINR: null, annualPriceINR: null,
    credits: 30, color: '#52525b',
    hideForINR: true, // India users must start with Spark (150 credits/month for ₹499)
  },
  spark: {
    id: 'spark', name: 'Spark', inrOnly: true,
    monthlyPrice: 6, annualPrice: 5, monthlyPriceINR: 499, annualPriceINR: 399,
    credits: 150, color: '#f59e0b', // was 50 (the old 100 here was an unfinished offer the webhook never granted)
  },
  starter: {
    id: 'starter', name: 'Starter',
    monthlyPrice: 29, annualPrice: 23, monthlyPriceINR: 1499, annualPriceINR: 1199,
    credits: 450, color: '#22c55e',
  },
  builder: {
    id: 'builder', name: 'Builder',
    monthlyPrice: 79, annualPrice: 63, monthlyPriceINR: 3999, annualPriceINR: 3199,
    credits: 1500, color: '#0EA5E9',
  },
  pro: {
    id: 'pro', name: 'Pro',
    monthlyPrice: 199, annualPrice: 159, monthlyPriceINR: 9999, annualPriceINR: 7999,
    credits: 4500, color: '#8b5cf6',
  },
}

/** "450 credits/month" — the string every upsell/plan card should use. */
export function creditsLine(id: PlanFacts['id']): string {
  return `${PLAN_FACTS[id].credits.toLocaleString('en-US')} credits/month`
}

/**
 * One-time top-up packs: same prices as before, 3x the credits. Tripling them with the plans keeps the top-up rate at the
 * same multiple of the plan rate as before, and keeps India's Spark and its pack at the same rupees per credit (the
 * parity the Dodo webhook comment explains). Keyed by the existing product ids, which are NOT renamed.
 */
export const TOPUP_PACKS = [
  { key: 'topup_200', credits: 120, price: 19, priceINR: 399 },
  { key: 'topup_600', credits: 300, price: 49, priceINR: 999 },
  { key: 'topup_2000', credits: 600, price: 99, priceINR: 1999 },
] as const

/**
 * The two larger tiers sold through checkout but not shown on the pricing page. Tripled with the others
 * (4,000 -> 12,000 and 10,000 -> 30,000) so the ladder still makes sense: after Pro rose to 4,500 for $199, a
 * Growth plan of 4,000 for $399 would have been strictly worse than the plan below it.
 */
export const LARGE_PLAN_CREDITS = { growth: 12000, scale: 30000 } as const

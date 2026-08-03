// SINGLE SOURCE OF TRUTH for plan facts (names, prices, monthly credits).
// The "500 credits/month" bug on the dashboard's Starter upsell happened
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
    credits: 50, color: '#52525b',
    hideForINR: true, // India users must start with Spark (100 credits/month for ₹499)
  },
  spark: {
    id: 'spark', name: 'Spark', inrOnly: true,
    monthlyPrice: 6, annualPrice: 5, monthlyPriceINR: 499, annualPriceINR: 399,
    credits: 100, color: '#f59e0b', // Limited-time offer: 100 credits (was 50)
  },
  starter: {
    id: 'starter', name: 'Starter',
    monthlyPrice: 29, annualPrice: 23, monthlyPriceINR: 1499, annualPriceINR: 1199,
    credits: 150, color: '#22c55e',
  },
  builder: {
    id: 'builder', name: 'Builder',
    monthlyPrice: 79, annualPrice: 63, monthlyPriceINR: 3999, annualPriceINR: 3199,
    credits: 500, color: '#0EA5E9',
  },
  pro: {
    id: 'pro', name: 'Pro',
    monthlyPrice: 199, annualPrice: 159, monthlyPriceINR: 9999, annualPriceINR: 7999,
    credits: 1500, color: '#8b5cf6',
  },
}

/** "150 credits/month" — the string every upsell/plan card should use. */
export function creditsLine(id: PlanFacts['id']): string {
  return `${PLAN_FACTS[id].credits.toLocaleString('en-US')} credits/month`
}

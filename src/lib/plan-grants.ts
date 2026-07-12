// Subscription grant facts — the credits + daily-drip a paid plan hands out when
// it activates. Credits come straight from PLAN_FACTS (the single source of
// truth) so they can never drift; only the per-tier daily-credit drip lives
// here (PLAN_FACTS doesn't carry it). This mirrors the inline configs in the
// Dodo webhook (see api/dodo/webhook) so web and mobile grant IDENTICALLY —
// same tier, same credits, same daily drip — regardless of which store the user
// paid through.

import { PLAN_FACTS } from './plans'

export type SubPlanId = 'spark' | 'starter' | 'builder' | 'pro'

// Daily free-drip per tier, matched to the Dodo webhook's PlanConfig.dailyCredits.
const DAILY_CREDITS: Record<SubPlanId, number> = {
  spark: 2,
  starter: 6,
  builder: 20,
  pro: 60,
}

export interface SubGrant {
  plan: SubPlanId
  /** Monthly credit allotment (from PLAN_FACTS — never inline this number). */
  credits: number
  /** Per-day drip while the plan is active (add_daily_credits cron). */
  dailyCredits: number
  /** Display name, e.g. for confirmation emails. */
  label: string
}

export function subGrant(plan: SubPlanId): SubGrant {
  return {
    plan,
    credits: PLAN_FACTS[plan].credits,
    dailyCredits: DAILY_CREDITS[plan],
    label: PLAN_FACTS[plan].name,
  }
}

// Google Play / App Store subscription **product id** → plan tier. We own these
// ids (created in the stores), so an explicit map is safe and drift-proof. A
// Google subscription's RevenueCat product identifier is `<subscriptionId>:<basePlanId>`
// (e.g. `wyber_pro:annual`) — match on the subscriptionId before the colon so
// monthly and annual base plans both resolve to the same tier.
const SUBSCRIPTION_IDS: Record<string, SubPlanId> = {
  wyber_spark: 'spark',
  wyber_starter: 'starter',
  wyber_builder: 'builder',
  wyber_pro: 'pro',
}

export function subPlanForProduct(productId: string): SubPlanId | null {
  if (!productId) return null
  const subscriptionId = productId.split(':')[0]
  return SUBSCRIPTION_IDS[subscriptionId] ?? null
}

// Free-tier reset applied when a subscription lapses/cancels. Mirrors the Dodo
// cancellation branch: drop the plan + daily drip, but KEEP the credit balance
// (the user paid for what's left; top-ups never expire).
export const FREE_ON_CANCEL = {
  plan: 'free' as const,
  daily_credits: 3,
  subscription_status: 'cancelled' as const,
}

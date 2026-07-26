import { describe, it, expect } from 'vitest'
import { PLAN_RANK, MODEL_META, tierAllowedForPlan, creditCost, estimateCost, type ModelTier, type PlanId } from './credits'

const TIERS: ModelTier[] = ['fast', 'default', 'premium', 'fable']
const PLANS: PlanId[] = ['free', 'spark', 'starter', 'builder', 'pro', 'growth', 'scale']

describe('tierAllowedForPlan', () => {
  it('gives every tier at least one real, live Dodo plan that can reach it', () => {
    // This is the direct regression guard for the bug where premium/fable were
    // unreachable by any real paying customer: the old PlanId ('free'|'pro'|
    // 'business') didn't match the live Dodo plan set, so every plan except
    // 'pro' fell through to rank 0.
    for (const tier of TIERS) {
      const reachable = PLANS.some(plan => tierAllowedForPlan(tier, plan))
      expect(reachable, `no real plan can reach tier "${tier}"`).toBe(true)
    }
  })

  it('scale (the top real plan) can reach every tier', () => {
    for (const tier of TIERS) {
      expect(tierAllowedForPlan(tier, 'scale')).toBe(true)
    }
  })

  it('free cannot reach premium or fable', () => {
    expect(tierAllowedForPlan('premium', 'free')).toBe(false)
    expect(tierAllowedForPlan('fable', 'free')).toBe(false)
  })

  it('falls back to rank 0 (not a crash) for an unrecognized plan string', () => {
    expect(tierAllowedForPlan('fast', 'not-a-real-plan')).toBe(true)
    expect(tierAllowedForPlan('fable', 'not-a-real-plan')).toBe(false)
  })

  it('PLAN_RANK is exhaustive over every plan referenced elsewhere in the codebase', () => {
    // dodo webhook writes: free, spark, starter, builder, pro, growth, scale.
    for (const plan of PLANS) {
      expect(PLAN_RANK[plan]).toBeTypeOf('number')
    }
  })

  it("MODEL_META.minPlan values are internally consistent with the rank gate", () => {
    for (const tier of TIERS) {
      const minPlan = MODEL_META[tier].minPlan
      expect(tierAllowedForPlan(tier, minPlan)).toBe(true)
    }
  })
})

describe('creditCost / estimateCost sanity (unaffected by the plan-gating fix)', () => {
  it('never returns less than 1 credit', () => {
    expect(creditCost('web-build', 'fast')).toBeGreaterThanOrEqual(1)
    expect(creditCost('ai-helper', 'fast')).toBeGreaterThanOrEqual(1)
  })

  it('estimateCost matches creditCost for the same action', () => {
    expect(estimateCost('default', 'build')).toBe(creditCost('web-build', 'default'))
  })
})

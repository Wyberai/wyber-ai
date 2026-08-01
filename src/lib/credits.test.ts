import { describe, it, expect } from 'vitest'
import { PLAN_RANK, MODEL_META, MODEL_MULTIPLIERS, tierAllowedForPlan, creditCost, estimateCost, resolveBuildTier, computeOverageCharge, type ModelTier, type PlanId, type BuildSizeTier } from './credits'

const TIERS: ModelTier[] = ['fast', 'default', 'premium', 'fable', 'gpt']
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

  it('gpt is visible to every plan, including free', () => {
    // Deliberately free+ (credits.ts MODEL_META.gpt comment) — the point of a
    // second provider is a real try-it-now choice, not another paywalled tier.
    for (const plan of PLANS) {
      expect(tierAllowedForPlan('gpt', plan)).toBe(true)
    }
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

describe('resolveBuildTier', () => {
  it('buckets by real planned file count, ignoring isComplex when a count is given', () => {
    expect(resolveBuildTier({ totalPlannedFiles: 1 })).toBe('small')
    expect(resolveBuildTier({ totalPlannedFiles: 4 })).toBe('small')
    expect(resolveBuildTier({ totalPlannedFiles: 5 })).toBe('medium')
    expect(resolveBuildTier({ totalPlannedFiles: 10 })).toBe('medium')
    expect(resolveBuildTier({ totalPlannedFiles: 11 })).toBe('large')
    expect(resolveBuildTier({ totalPlannedFiles: 20 })).toBe('large')
    expect(resolveBuildTier({ totalPlannedFiles: 21 })).toBe('xl')
    expect(resolveBuildTier({ totalPlannedFiles: 32 })).toBe('xl') // the real $17-COGS build that started this
  })

  it('a HIGH-complexity build with a real file count still buckets by count, not complexity', () => {
    expect(resolveBuildTier({ totalPlannedFiles: 2, isComplex: true })).toBe('small')
  })

  it('falls back to the complexity classifier when no plan file count exists (one-shot/screenshot builds)', () => {
    expect(resolveBuildTier({ isComplex: false })).toBe('small')
    expect(resolveBuildTier({ isComplex: true })).toBe('large')
    expect(resolveBuildTier({})).toBe('small')
  })

  it('a zero or negative file count is treated as "no count" rather than always-small', () => {
    expect(resolveBuildTier({ totalPlannedFiles: 0, isComplex: true })).toBe('large')
  })
})

describe('creditCost with buildTier (tiered build pricing)', () => {
  const BUILD_ACTIONS = ['web-build', 'mobile-build', 'website-build', 'saas-build'] as const
  const EXPECTED: Record<BuildSizeTier, { fast: number; default: number }> = {
    small: { fast: 15, default: 25 },
    medium: { fast: 25, default: 45 },
    large: { fast: 40, default: 80 },
    xl: { fast: 60, default: 130 },
  }

  it('matches the documented tier price for every build action and tier', () => {
    for (const action of BUILD_ACTIONS) {
      for (const buildTier of Object.keys(EXPECTED) as BuildSizeTier[]) {
        expect(creditCost(action, 'fast', buildTier)).toBe(EXPECTED[buildTier].fast)
        expect(creditCost(action, 'default', buildTier)).toBe(EXPECTED[buildTier].default)
      }
    }
  })

  it('collapses premium/fable into the default bucket, same as small-edit already does', () => {
    expect(creditCost('web-build', 'premium', 'large')).toBe(EXPECTED.large.default)
    expect(creditCost('web-build', 'fable', 'large')).toBe(EXPECTED.large.default)
  })

  it('larger tiers always cost at least as much as smaller ones, for both model tiers', () => {
    const order: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']
    for (let i = 1; i < order.length; i++) {
      expect(creditCost('web-build', 'fast', order[i])).toBeGreaterThan(creditCost('web-build', 'fast', order[i - 1]))
      expect(creditCost('web-build', 'default', order[i])).toBeGreaterThan(creditCost('web-build', 'default', order[i - 1]))
    }
  })

  it('omitting buildTier falls back to the old flat BASE_COSTS x MODEL_MULTIPLIERS price (no hard cutover)', () => {
    expect(creditCost('web-build', 'fast')).toBe(15) // round(30 * 0.5) — unchanged old behavior
    expect(creditCost('web-build', 'default')).toBe(75) // round(30 * 2.5) — old flat path picks up the recalibrated multiplier too
  })

  it('a non-build action ignores an accidentally-passed buildTier', () => {
    // 'component' isn't in BUILD_ACTIONS, so buildTier must never redirect it
    // into BUILD_TIER_COSTS — it should look identical with or without one.
    expect(creditCost('component', 'default', 'xl')).toBe(creditCost('component', 'default'))
  })
})

describe('MODEL_MULTIPLIERS recalibration', () => {
  it('default/premium reflect the current ~2.5x Opus:Sonnet ratio, not the old 2x', () => {
    expect(MODEL_MULTIPLIERS.default).toBe(2.5)
    expect(MODEL_MULTIPLIERS.premium).toBe(2.5)
  })

  it('fast stays untouched at the existing Sonnet discount', () => {
    expect(MODEL_MULTIPLIERS.fast).toBe(0.5)
  })
})

describe('computeOverageCharge', () => {
  it('charges nothing when usage is within the tier\'s assumed budget', () => {
    expect(computeOverageCharge({ buildTier: 'small', modelTier: 'default', actualOutputTokens: 10_000 })).toBe(0)
    expect(computeOverageCharge({ buildTier: 'large', modelTier: 'default', actualOutputTokens: 160_000 })).toBe(0)
  })

  it('charges nothing right at the threshold multiplier, but does just past it', () => {
    // small budget = 20_000, threshold = 1.75x = 35_000
    expect(computeOverageCharge({ buildTier: 'small', modelTier: 'default', actualOutputTokens: 35_000 })).toBe(0)
    expect(computeOverageCharge({ buildTier: 'small', modelTier: 'default', actualOutputTokens: 35_001 })).toBeGreaterThan(0)
  })

  it('caps the top-up at the jump to the next tier\'s price', () => {
    // small(25) -> medium(45) on default tier: cap should be exactly 20
    expect(computeOverageCharge({ buildTier: 'small', modelTier: 'default', actualOutputTokens: 1_000_000 })).toBe(20)
    // small(15) -> medium(25) on fast tier: cap should be exactly 10
    expect(computeOverageCharge({ buildTier: 'small', modelTier: 'fast', actualOutputTokens: 1_000_000 })).toBe(10)
  })

  it('xl has no tier above it to borrow a cap from, so it reuses the large->xl increment', () => {
    // large(80) -> xl(130) on default tier: cap should be exactly 50, even at extreme usage
    expect(computeOverageCharge({ buildTier: 'xl', modelTier: 'default', actualOutputTokens: 50_000_000 })).toBe(50)
  })

  it('never returns a negative or zero charge once triggered', () => {
    for (const buildTier of ['small', 'medium', 'large', 'xl'] as BuildSizeTier[]) {
      const charge = computeOverageCharge({ buildTier, modelTier: 'default', actualOutputTokens: 10_000_000 })
      expect(charge).toBeGreaterThanOrEqual(1)
    }
  })
})

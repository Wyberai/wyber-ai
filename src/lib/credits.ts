/**
 * Central credit metering — single source of truth for all credit costs.
 * Keep all cost logic here; routes import from here, never hardcode elsewhere.
 */

export type ModelTier = 'fast' | 'default' | 'premium' | 'fable'
/** DB plan values: 'free' | 'pro' (Builder) | 'business' (Team) */
export type PlanId = 'free' | 'pro' | 'business'
export type ActionType =
  | 'small-edit'
  | 'component'
  | 'web-build'
  | 'mobile-build'
  | 'agent-create'
  | 'workflow-create'
  | 'ai-helper'
  | 'image-gen'
  | 'execution' // per AI node per canvas run

/** Anthropic model IDs for each tier */
export const MODEL_IDS: Record<ModelTier, string> = {
  fast:    'claude-haiku-4-5-20251001',
  default: 'claude-sonnet-4-6',
  premium: 'claude-opus-4-8',
  fable:   'claude-fable-5',
}

/** Cost multiplier relative to sonnet (= 1.0) */
export const MODEL_MULTIPLIERS: Record<ModelTier, number> = {
  fast:    0.3,
  default: 1.0,
  premium: 2.5,
  fable:   4.0,
}

/** Human-readable model info for UI */
export const MODEL_META: Record<ModelTier, {
  label: string
  tagline: string
  minPlan: PlanId
}> = {
  fast:    { label: 'Fast',    tagline: 'Quick edits & simple changes',         minPlan: 'free' },
  default: { label: 'Standard', tagline: 'Best for most apps',                  minPlan: 'free' },
  premium: { label: 'Premium', tagline: 'Complex apps & detailed UI',           minPlan: 'pro' },
  fable:   { label: 'Fable',   tagline: 'Most powerful — best for large apps',  minPlan: 'business' },
}

/**
 * Base credit costs at sonnet multiplier (1.0).
 * Multiply by MODEL_MULTIPLIERS[tier] and round.
 */
const BASE_COSTS: Record<ActionType, number> = {
  'small-edit':      2,
  'component':       4,
  'web-build':      10,
  'mobile-build':   10,
  'agent-create':    6,
  'workflow-create': 6,
  'ai-helper':       1,
  'image-gen':       3,
  'execution':       2,
}

/**
 * Compute the credit cost for an action + model tier.
 * Always at least 1 credit.
 */
export function creditCost(action: ActionType, tier: ModelTier = 'default'): number {
  const base = BASE_COSTS[action]
  const multiplier = MODEL_MULTIPLIERS[tier]
  return Math.max(1, Math.round(base * multiplier))
}

/**
 * UI-facing cost estimate — same logic, just renamed for clarity.
 * Pass sizeHint 'small' | 'medium' | 'large' to pick the right action bucket.
 */
export function estimateCost(
  tier: ModelTier,
  sizeHint: 'edit' | 'component' | 'build' | 'mobile' | 'agent' | 'workflow' | 'image' | 'run' = 'build',
): number {
  const actionMap: Record<typeof sizeHint, ActionType> = {
    edit:      'small-edit',
    component: 'component',
    build:     'web-build',
    mobile:    'mobile-build',
    agent:     'agent-create',
    workflow:  'workflow-create',
    image:     'image-gen',
    run:       'execution',
  }
  return creditCost(actionMap[sizeHint], tier)
}

/** Plans that may use a given model tier */
export function tierAllowedForPlan(tier: ModelTier, plan: string): boolean {
  const planRank: Record<string, number> = { free: 0, pro: 1, business: 2 }
  const minPlanRank: Record<ModelTier, number> = { fast: 0, default: 0, premium: 1, fable: 2 }
  return (planRank[plan] ?? 0) >= minPlanRank[tier]
}

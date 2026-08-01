/**
 * Central credit metering — single source of truth for all credit costs.
 * Keep all cost logic here; routes import from here, never hardcode elsewhere.
 */

export type ModelTier = 'fast' | 'default' | 'premium' | 'fable' | 'gpt' | 'wybercode'
export type ModelProvider = 'anthropic' | 'openai' | 'wybercode'
/**
 * Real DB plan values written to profiles.plan by the Dodo webhook
 * (src/app/api/dodo/webhook/route.ts) and the free/cancellation reset
 * (src/lib/plan-grants.ts FREE_ON_CANCEL). 'business' never existed on Dodo —
 * it was a leftover from the pre-Dodo Stripe integration and is kept out of
 * this union on purpose so it can't silently resurface.
 */
export type PlanId = 'free' | 'spark' | 'starter' | 'builder' | 'pro' | 'growth' | 'scale'
export type ActionType =
  | 'small-edit'
  | 'component'
  | 'web-build'
  | 'mobile-build'
  | 'website-build'
  | 'saas-build'
  | 'plan'
  | 'security-scan'
  | 'agent-create'
  | 'agent-run'
  | 'workflow-create'
  | 'workflow-run'
  | 'ai-helper'
  | 'image-gen'
  | 'hero-image-gen'
  | 'audio-gen'
  | 'execution'
  | 'employee-run'
  | 'gtm-icp-sequence'
  | 'gtm-lead-enrich'
  | 'preview-access'

/**
 * Anthropic model IDs for each tier. Bumped from claude-sonnet-4-6/opus-4-8 to
 * the current Sonnet 5 / Opus 5 generation — same-or-cheaper pricing, better
 * agentic-coding performance. Scoped to ONLY this builder tier system; other
 * subsystems (AI Employees, Agent Canvas, GTM flows) hardcode their own model
 * strings independently and are a separate, out-of-scope cleanup.
 */
export const MODEL_IDS: Record<ModelTier, string> = {
  fast:    'claude-sonnet-5',
  default: 'claude-opus-5',
  premium: 'claude-opus-5',
  fable:   'claude-fable-5',
  // GPT-5.6 Sol — OpenAI's current flagship for complex reasoning/coding with
  // Functions tool support, confirmed against OpenAI's live model catalog
  // (developers.openai.com/api/docs/models, checked 2026-07-26). Still an
  // env-var override, not hardcoded, so it can be swapped without a deploy
  // once this tier sees real usage.
  gpt:     process.env.OPENAI_CODING_MODEL_ID || 'gpt-5.6-sol',
  // Placeholder label — wybercode.ts actually calls two separate self-hosted
  // model ids (WYBERCODE_PATCH_MODEL_ID / WYBERCODE_FULLGEN_MODEL_ID)
  // depending on whether a page is a template patch or a full generation.
  // This entry exists so MODEL_IDS stays exhaustive over ModelTier.
  wybercode: 'wybercode (self-hosted, two-tier)',
}

/** Which provider actually serves a given tier — a thin, additive lookup so
 * MODEL_IDS keeps its existing string-value shape (plan/route.ts and others
 * already consume MODEL_IDS.<tier> as a bare string) instead of changing that
 * contract for every existing caller just to add one new provider. */
export const MODEL_PROVIDERS: Record<ModelTier, ModelProvider> = {
  fast: 'anthropic', default: 'anthropic', premium: 'anthropic', fable: 'anthropic',
  gpt: 'openai',
  wybercode: 'wybercode',
}

/**
 * Cost multiplier relative to fast/Sonnet (1.0 there would mean "same price
 * as Sonnet" — despite the name, these are relative to BASE_COSTS, which is
 * itself calibrated at the Sonnet rate; see creditCost()). Only governs the
 * actions that still use flat BASE_COSTS × multiplier pricing — builds
 * (web-build/mobile-build/website-build/saas-build) moved to tiered pricing
 * (BUILD_TIER_COSTS above) and no longer read this at all; small-edit never
 * did. Remaining consumers: component, security-scan, agent-create/run,
 * workflow-create/run, ai-helper, execution, employee-run, gtm-icp-sequence,
 * gtm-lead-enrich.
 *
 * default/premium (Opus) bumped 1.0 → 2.5: checked against Anthropic's
 * published per-token pricing 2026-08-01 — Sonnet $2/$10, Opus $5/$25 per
 * MTok, a ~2.5× ratio, not the old 1.0x-vs-0.5x (2×) this table implied.
 * TODO: Sonnet's $2/$10 is intro pricing through 2026-08-31; it reverts to
 * $3/$15 after, dropping the real ratio to ~1.67×. Recalibrate this constant
 * then (or make it env/date-gated) rather than let it go stale silently.
 *
 * fable left at 2.0 for now even though Fable's real ratio to Sonnet at
 * current pricing ($10/$50 vs $2/$10) is closer to ~5× on output tokens —
 * lower priority than the Opus fix (Fable is a smaller, Pro-only surface);
 * flagged here rather than silently left wrong.
 *
 * `gpt`'s multiplier is a placeholder equal to `default` — it should be
 * recalibrated once real OpenAI coding-model pricing is confirmed (this
 * tier's actual per-token cost is not the same as Anthropic's).
 *
 * `wybercode`'s multiplier is a placeholder too, and for a structurally
 * different reason: self-hosted GPUs are a FIXED cost regardless of usage,
 * not a per-token API bill, so "COGS per build" only becomes measurable once
 * real GKE/vLLM throughput numbers exist (see the plan's Phase 7 — amortized
 * $/hour ÷ real tokens/sec ÷ real shadow-run token counts). Deliberately set
 * low here (below fast/Sonnet) rather than at 1.0 like gpt/premium's
 * placeholders: driving volume onto owned infra is the entire point of this
 * tier, and pricing it at parity with an Anthropic-billed tier would work
 * against that before real COGS data even exists to justify a higher number.
 * Recalibrate with calibrateWyberCodeMultiplier() below once Phase 3/4 have
 * real measurements — do not ship this 0.25 to a real rollout unexamined.
 */
export const MODEL_MULTIPLIERS: Record<ModelTier, number> = {
  fast:    0.5,
  default: 2.5,
  premium: 2.5,
  fable:   2.0,
  gpt:     2.5,
  wybercode: 0.25,
}

/** Human-readable model info for UI */
export const MODEL_META: Record<ModelTier, {
  label: string
  tagline: string
  minPlan: PlanId
  provider: ModelProvider
}> = {
  // minPlan values matched to the pricing page's own feature bullets (present
  // in all 5 locales), which are the clearest evidence of actual intent: the
  // Builder plan advertises "Priority build queue" (= premium's priority
  // queue), and the Pro plan advertises "Fable model access (most powerful)".
  fast:    { label: 'Sonnet', tagline: 'Fast & smart — great for most apps',     minPlan: 'free',    provider: 'anthropic' },
  default: { label: 'Opus',   tagline: 'Higher quality for complex apps',       minPlan: 'starter', provider: 'anthropic' },
  premium: { label: 'Opus (priority)', tagline: 'Same power, priority queue',   minPlan: 'builder', provider: 'anthropic' },
  fable:   { label: 'Fable', tagline: 'Most powerful — best for large apps',    minPlan: 'pro',     provider: 'anthropic' },
  // Visible to everyone (free+) — the point of adding a second provider is for
  // it to be a real, try-it-now choice, not another paywalled tier.
  gpt:     { label: 'GPT',     tagline: 'OpenAI — an alternative engine for the same build', minPlan: 'free', provider: 'openai' },
  // Free-tier visible on purpose (mirrors gpt) — also reachable via automatic
  // rollout (see wybercode.ts shouldAutoRouteToWyberCode), independent of
  // this manual dropdown entry. Kill-switched off by default in production
  // until the Phase 3 GKE/vLLM infra actually exists (WYBERCODE_ENABLED).
  wybercode: { label: 'WyberCode', tagline: 'Our own coding engine — fast & free while in beta', minPlan: 'free', provider: 'wybercode' },
}

/**
 * Base credit costs at sonnet multiplier (1.0).
 * Multiply by MODEL_MULTIPLIERS[tier] and round.
 */
const BASE_COSTS: Record<ActionType, number> = {
  'small-edit':         2,
  'component':          8,
  'web-build':         30,
  'mobile-build':      30,
  'website-build':     30,
  'saas-build':        30,
  'plan':               5,
  'security-scan':     10,
  'agent-create':       5,
  'agent-run':          5,
  'workflow-create':    2,
  'workflow-run':       2,
  'ai-helper':          1,
  'image-gen':          3,
  // High-quality gpt-image-2 regenerate (ImagesPanel's hero-quality toggle).
  // Real COGS ~$0.19/image at 'high' quality; 20cr is a flat, tier-agnostic
  // price (image-gen calls OpenAI, not an Anthropic model, so the usual
  // MODEL_MULTIPLIERS tier scaling doesn't apply — always cost this at the
  // 'default' tier regardless of the user's selected Claude model).
  'hero-image-gen':    20,
  // Voiceover/narration generation (ElevenLabs primary, OpenAI TTS fallback —
  // src/lib/audio-gen.ts). Flat, tier-agnostic price like hero-image-gen,
  // same reasoning: this calls a TTS provider, not an Anthropic model, so the
  // usual MODEL_MULTIPLIERS tier scaling doesn't apply. 5cr is an initial
  // estimate (ElevenLabs runs meaningfully more per-character than OpenAI TTS
  // — real COGS should be confirmed against actual per-request text length
  // once this sees real usage, same as hero-image-gen's $0.19/image figure
  // was measured from production).
  'audio-gen':          5,
  'execution':          5,
  'employee-run':       5,
  'gtm-icp-sequence':   3,
  'gtm-lead-enrich':    1,
  // Charged to the project OWNER (not the viewer) once per viewer per project
  // per calendar day when someone opens a QR/mobile preview — see
  // /api/preview-access. Flat, tier-agnostic like hero-image-gen/audio-gen:
  // this isn't a model call at all, it's a bundling/hosting cost.
  'preview-access':     2,
}

// Game previews cost more than app previews (heavier bundle, audio-unlock,
// landscape lock) — a second flat price, not a MODEL_MULTIPLIERS tier, so it
// lives beside BASE_COSTS rather than inside creditCost()'s tier logic.
export const PREVIEW_ACCESS_GAME_COST = 5

export type BuildSizeTier = 'small' | 'medium' | 'large' | 'xl'
const BUILD_ACTIONS: ActionType[] = ['web-build', 'mobile-build', 'website-build', 'saas-build']

/**
 * Tiered build pricing — replaces the old flat 30cr-per-build price
 * (BASE_COSTS × MODEL_MULTIPLIERS) with a price keyed on real build size,
 * mirroring the pattern 'small-edit' already uses above: hardcoded by
 * (action-is-a-build, size, tier), bypassing MODEL_MULTIPLIERS entirely. The
 * flat price meant a 2-file landing page and a 32-file platform cost the
 * same 30cr, and Opus's 1.0× multiplier (vs Sonnet's 0.5×) implied only a 2×
 * cost ratio when real Anthropic pricing runs ~2.5× (Sonnet $2/$10, Opus
 * $5/$25 per MTok, checked 2026-08-01, intro pricing through 2026-08-31) —
 * together these meant a large Opus build could cost real dollars far above
 * what it was charged (confirmed: a 32-file Opus build measured ~$17 COGS,
 * charged only 30cr).
 *
 * Calibration (estimate — recalibrate once generation_usage_log has real
 * data, same caveat as calibrateWyberCodeMultiplier below): anchored to the
 * SAME measured data point 'small-edit' already uses — $0.52 Opus COGS for a
 * complex edit implies ~21K output tokens at current pricing ($25/MTok), and
 * that edit is priced at 5cr, i.e. ~9.6cr per dollar of Opus COGS. Applying
 * that same rate to representative total-output-token budgets per size tier
 * (covering the WHOLE staged build a scaffold pass buys — the charged
 * scaffold pass plus every free fill batch it authorizes, not just the
 * first call): small ≈20K tokens (≈$0.50 Opus COGS), medium ≈60K (≈$1.50),
 * large ≈160K (≈$4), xl ≈400K (≈$10) — then rounded to clean numbers. XL at
 * 130cr (≈$25 revenue at the Starter rate) still comfortably covers the
 * measured $17 outlier above, unlike the old flat 30cr (≈$5.80). Sonnet
 * ('fast') prices scale down from Opus by roughly its real ~2.5× cheaper
 * per-token rate, not the old flat 0.5×.
 */
const BUILD_TIER_COSTS: Record<BuildSizeTier, { fast: number; default: number }> = {
  small:  { fast: 15, default: 25 },
  medium: { fast: 25, default: 45 },
  large:  { fast: 40, default: 80 },
  xl:     { fast: 60, default: 130 },
}

/**
 * Buckets a build into a BuildSizeTier from signals already computed BEFORE
 * generation starts — never from actual token usage, so the price stays
 * fixed and known upfront (no credit-hold / true-up flow). Prefers the real
 * planned file count from the Atlas staged-plan pass when one exists (a
 * concrete signal); falls back to the isComplexBuild HIGH/LOW Haiku
 * classifier for one-shot builds with no plan (a screenshot build, or one
 * whose plan pass failed/came back too small to stage).
 */
export function resolveBuildTier(opts: { totalPlannedFiles?: number; isComplex?: boolean }): BuildSizeTier {
  const { totalPlannedFiles, isComplex } = opts
  if (typeof totalPlannedFiles === 'number' && totalPlannedFiles > 0) {
    if (totalPlannedFiles > 20) return 'xl'
    if (totalPlannedFiles > 10) return 'large'
    if (totalPlannedFiles > 4) return 'medium'
    return 'small'
  }
  return isComplex ? 'large' : 'small'
}

const BUILD_TIER_ORDER: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

/**
 * Representative total output-token budget each tier's fixed price above is
 * calibrated against (see the BUILD_TIER_COSTS comment) — used ONLY to
 * detect a build that ran well outside what its tier assumed, never to set
 * the sticker price itself (that stays fixed and known before generation,
 * per the tiered-not-metered decision). A single fixed number per tier can
 * never fully cover the real spread within that tier — a "Large" build
 * scaled from the measured $17-COGS/32-file data point down to ~18 files
 * still lands close to the 80cr sticker price at only ~1.5x margin, so nudge
 * this budget down before the multiplier below if real data shows Large/XL
 * running hot more often than not.
 */
const BUILD_TIER_TOKEN_BUDGET: Record<BuildSizeTier, number> = {
  small: 20_000,
  medium: 60_000,
  large: 160_000,
  xl: 400_000,
}

// A build running more than this multiple of its tier's assumed token budget
// gets a capped top-up on top of the fixed sticker price. This is the one
// thing a fixed-tier price structurally cannot do alone: protect against a
// build that lands well outside what its tier assumed — the measured
// $17-COGS-for-30cr case that motivated moving off flat pricing in the first
// place. Below this line, price stays exactly the fixed number shown
// upfront, no exceptions — this is a safety valve for the tail, not a
// reintroduction of usage metering for the common case.
const OVERAGE_THRESHOLD_MULTIPLIER = 1.75

function tierPrice(t: BuildSizeTier, modelTier: ModelTier): number {
  const costs = BUILD_TIER_COSTS[t]
  return modelTier === 'fast' ? costs.fast : costs.default
}

/**
 * Capped top-up credit charge for a build whose REAL output-token usage
 * (summed across the whole staged build — the charged scaffold pass plus
 * every free fill batch it authorized, not just the first call) ran
 * significantly hotter than its tier assumed. Returns 0 when usage is within
 * OVERAGE_THRESHOLD_MULTIPLIER of the tier's assumed budget — the fixed
 * sticker price already shown to the user is the final price for the
 * overwhelming majority of builds.
 *
 * The top-up is capped at the jump to the next tier's price (or, for xl,
 * the same large→xl increment, since there's no tier above it to borrow
 * from) so a single build can never be charged an unbounded amount — this
 * is deliberately a bounded safety valve, not open-ended metering.
 */
export function computeOverageCharge(opts: {
  buildTier: BuildSizeTier
  modelTier: ModelTier
  actualOutputTokens: number
}): number {
  const { buildTier, modelTier, actualOutputTokens } = opts
  const budget = BUILD_TIER_TOKEN_BUDGET[buildTier]
  if (actualOutputTokens <= budget * OVERAGE_THRESHOLD_MULTIPLIER) return 0
  const isTop = buildTier === 'xl'
  const capFrom = isTop ? 'large' : buildTier
  const capToIndex = isTop ? BUILD_TIER_ORDER.length - 1 : BUILD_TIER_ORDER.indexOf(buildTier) + 1
  const capTo = BUILD_TIER_ORDER[capToIndex]
  const cap = tierPrice(capTo, modelTier) - tierPrice(capFrom, modelTier)
  return Math.max(1, cap)
}

/**
 * Compute the credit cost for an action + model tier.
 * Always at least 1 credit.
 */
export function creditCost(action: ActionType, tier: ModelTier = 'default', buildTier?: BuildSizeTier): number {
  // Edits are priced explicitly, not by multiplier. The 0.5× fast discount made
  // simple edits 1cr (below Sonnet COGS), while complexity-escalated edits ran
  // Opus (~$0.52 COGS, measured Jul 3) for the same price as a tweak. Simple
  // Sonnet edit = the public 2cr price; Opus-escalated complex edit = 5cr.
  if (action === 'small-edit') return tier === 'fast' ? 2 : 5
  // Tiered build pricing (see BUILD_TIER_COSTS above) — only applies when the
  // caller actually resolved a size tier; omitting buildTier (an older client,
  // or a call site not yet updated) falls through to the flat price below so
  // this ships without a hard cutover.
  if (buildTier && BUILD_ACTIONS.includes(action)) {
    const costs = BUILD_TIER_COSTS[buildTier]
    return tier === 'fast' ? costs.fast : costs.default
  }
  // hero-image-gen/audio-gen call an image/TTS provider, never an Anthropic
  // or OpenAI coding model — MODEL_MULTIPLIERS tier scaling doesn't apply to
  // them (see BASE_COSTS comments). Forced to 1× here, not just by omitting
  // the tier argument at call sites, so a future caller that DOES pass a
  // tier (e.g. 'fable', 2×) can't silently break the documented flat price.
  if (action === 'hero-image-gen' || action === 'audio-gen' || action === 'preview-access') return BASE_COSTS[action]
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

// Exhaustive over PlanId — adding a plan id to the PlanId union without adding
// it here is a COMPILE ERROR, not a silent runtime fallback to rank 0. This is
// the direct fix for the bug where every live Dodo plan except the
// coincidentally-named 'pro' fell through an old free|pro|business lookup to
// rank 0 (same as a free user), making `premium`/`fable` unreachable by any
// real paying customer. Ranks below are ordered by the plan's real monthly
// credit allotment (src/lib/plans.ts PLAN_FACTS / dodo webhook PlanConfig).
export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  spark: 0,
  starter: 1,
  builder: 2,
  pro: 3,
  growth: 4,
  scale: 5,
}

// Sonnet (fast) = free; Opus (default) = Starter+; premium = Builder+; Fable = Pro+.
const MIN_TIER_RANK: Record<ModelTier, number> = { fast: 0, default: 1, premium: 2, fable: 3, gpt: 0, wybercode: 0 }

/** Plans that may use a given model tier */
export function tierAllowedForPlan(tier: ModelTier, plan: string): boolean {
  // `plan` comes from the DB as a raw string, not the PlanId type, so an
  // unrecognized value (a bad row, a future plan not yet added to PLAN_RANK)
  // still needs a safe runtime fallback — but PLAN_RANK itself being exhaustive
  // over PlanId means that fallback can only ever trigger for genuinely
  // invalid data, not for a real plan someone forgot to wire up.
  const rank = PLAN_RANK[plan as PlanId] ?? 0
  return rank >= MIN_TIER_RANK[tier]
}

/**
 * Derive a real wybercode multiplier from measured GPU-hour COGS, replacing
 * the MODEL_MULTIPLIERS.wybercode placeholder above. Pure function — plug in
 * real numbers once the plan's Phase 3 load test and Phase 4 shadow-run data
 * exist; this is intentionally NOT wired into creditCost() automatically,
 * since a multiplier change should be a deliberate, reviewed decision, not a
 * side effect of some other code path recomputing it live.
 *
 * marginTarget mirrors the same margin discipline credits.ts already applies
 * to measured Anthropic COGS (see the "$0.52 COGS" comment on 'small-edit'
 * above) — default 3x is a starting assumption, not a verified figure.
 */
export function calibrateWyberCodeMultiplier(opts: {
  /** Blended $/hour across both GPU node pools (patch-tier + full-gen-tier),
   * at realistic utilization — not raw on-demand list price. */
  amortizedDollarsPerGpuHour: number
  /** Measured tokens/sec under vLLM continuous batching at production-like
   * concurrency — NOT a synthetic single-stream benchmark. */
  measuredTokensPerSecond: number
  /** Average output tokens per build, measured from real shadow-run data
   * (blended across template-hit patch calls and full-gen fallback calls). */
  avgOutputTokensPerBuild: number
  /** What a 'web-build' action (BASE_COSTS['web-build'] = 30) should cost in
   * real dollars to hit the target margin over COGS. */
  marginTarget?: number
  /** What $1 of platform revenue corresponds to in credits, for converting a
   * dollar COGS figure into a multiplier relative to BASE_COSTS. */
  dollarsPerCredit: number
}): number {
  const { amortizedDollarsPerGpuHour, measuredTokensPerSecond, avgOutputTokensPerBuild, dollarsPerCredit } = opts
  const marginTarget = opts.marginTarget ?? 3
  const dollarsPerToken = amortizedDollarsPerGpuHour / 3600 / measuredTokensPerSecond
  const cogsPerBuild = dollarsPerToken * avgOutputTokensPerBuild
  const targetCreditsPerBuild = (cogsPerBuild * marginTarget) / dollarsPerCredit
  const multiplier = targetCreditsPerBuild / BASE_COSTS['web-build']
  return Math.max(0, multiplier)
}

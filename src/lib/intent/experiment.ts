// Experiment plumbing: flag + variant. Pure so it is testable.

/** Off unless NEXT_PUBLIC_INTENT_EXPERIMENT === '1'. India gating happens at the call site. */
export function intentExperimentOn(value: string | undefined): boolean {
  return value === '1'
}

export type Variant = 'intent' | 'control'
export const INTENT_SHARE = 0.7 // 70% see the intent version, 30% the current page

/** r is a uniform [0,1) sample, injected so tests are deterministic. */
export function assignVariant(r: number, share: number = INTENT_SHARE): Variant {
  return r < share ? 'intent' : 'control'
}

export const ANON_KEY = 'wyber-intent-anon'
export const VARIANT_KEY = 'wyber-intent-variant'
export const LANG_KEY = 'wyber-intent-lang'
export const INTENT_KEY = 'wyber-intent'

// ── Link a visitor's experiment variant to their signup ──────────────────────
// The strip sets a first-party cookie "<anonId>.<variant>" so onboardUser can
// copy it onto the profile at signup, and the funnel report can compare
// signups/builds/publishes between the intent and control groups.
export const XP_COOKIE = 'wyber_xp'
export const XP_COOKIE_DAYS = 90

export function encodeXp(anonId: string, variant: Variant): string {
  return `${anonId}.${variant}`
}

export function decodeXp(raw: string | null | undefined): { anonId: string; variant: Variant } | null {
  if (!raw) return null
  const m = raw.match(/^([a-zA-Z0-9-]{8,64})\.(intent|control)$/)
  return m ? { anonId: m[1], variant: m[2] as Variant } : null
}

/** Column values for profiles, or null if the cookie is missing or tampered with. */
export function xpToProfileColumns(raw: string | null | undefined): { intent_anon_id: string; intent_variant: Variant } | null {
  const x = decodeXp(raw)
  return x ? { intent_anon_id: x.anonId, intent_variant: x.variant } : null
}

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

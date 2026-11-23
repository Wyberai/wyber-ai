// Design variety: how the corpus statistics (design-knowledge.ts) and the founder's "everything looks the same" complaint become
// a picking rule. Pure functions, no network, no model calls.
//
// What the data supports (see DESIGN_KNOWLEDGE.limits for what it does not):
//  - Primary colours converge: of 299 repos with a readable --primary, 109 are neutral and 88 blue (66%). A generator that copies the
//    average lands there, so a direction whose primary sits in an over-represented family is picked a little less often.
//  - The ground is not in the corpus (it records the default theme only: 172 light, 19 dark), so the cream cap below is a product
//    decision from the founder's complaint (9 of 31 directions are warm cream), not a corpus finding.
//  - Hero media: of 66 repos with a named hero variant, image or video 49, gradient/aurora/mesh 8. A gradient-field hero is nudged down.
//
// The pick stays fit-first. Weights only choose among directions that already fit the brief; they never promote a direction that does not.

import type { Direction, HeroMedia } from './design-directions'
import { DESIGN_KNOWLEDGE } from './design-knowledge'

export type GroundClass = 'dark' | 'cream' | 'white' | 'cool' | 'signal' | 'tinted'
export type HueFamily = 'neutral' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet' | 'pink'

function parseHsl(token: string): [number, number, number] {
  const [h, s, l] = token.replace(/%/g, '').split(' ').map(Number)
  return [h || 0, s || 0, l || 0]
}

/** The ground a direction sits on, in the terms a founder sees: dark, warm cream, plain white, cool paper, a saturated signal field, or a soft tint. */
export function groundOf(d: Direction): GroundClass {
  const [h, s, l] = parseHsl(d.palette.tokens.background)
  if (l < 50) return 'dark'
  if (s >= 70 && l < 70) return 'signal'
  if (s < 12 || (l >= 97 && s <= 22 && (h < 20 || h > 70))) return 'white'
  if (h >= 15 && h <= 70 && s >= 30) return 'cream'
  if (h >= 180 && h <= 260) return 'cool'
  return 'tinted'
}

/** Same thresholds as the corpus collector, so a direction and the corpus share are comparable. */
export function hueFamilyOf(d: Direction): HueFamily {
  const [h, s, l] = parseHsl(d.palette.tokens.primary)
  if (s < 12 || (s < 50 && (l < 18 || l > 92))) return 'neutral'
  return h < 15 || h >= 345 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'yellow' : h < 165 ? 'green' : h < 195 ? 'teal' : h < 255 ? 'blue' : h < 290 ? 'violet' : 'pink'
}

/** Share of corpus repos (with a readable primary) in each hue family. */
export function corpusHueShare(family: string): number {
  const n = DESIGN_KNOWLEDGE.denominators.withPrimaryToken
  return (DESIGN_KNOWLEDGE.primaryHue.find(x => x.key === family)?.repos ?? 0) / n
}

/** Cream is capped: the founder sees the same warm paper too often. 0.55 makes a cream direction roughly half as likely as an equal-fit white one. */
const GROUND_WEIGHT: Record<GroundClass, number> = { dark: 1, cream: 0.55, white: 1, cool: 1, signal: 1, tinted: 1 }
const HERO_WEIGHT: Partial<Record<HeroMedia, number>> = { 'gradient-field': 0.8 }

/** 1 = neutral. Below 1 for common corpus hues (neutral, blue), cream grounds and gradient heroes. Never below 0.3, never above 1. */
export function varietyWeight(d: Direction): number {
  const hue = 1 - 0.7 * corpusHueShare(hueFamilyOf(d))
  return Math.max(0.3, Math.min(1, hue * GROUND_WEIGHT[groundOf(d)] * (HERO_WEIGHT[d.rules.heroMedia] ?? 1)))
}

/** Candidates arrive best-fit first. Rank keeps fit in charge; the variety weight spreads the pick. */
const RANK_WEIGHT = [1, 0.9, 0.8, 0.7, 0.6]

/**
 * `fit` (optional) tells a real match from a filler. A cream direction that does not fit the trade is only there to fill a slot, and cream fillers
 * were the main reason briefs looked alike, so they are halved again; a cream direction that genuinely fits (a bakery's warm appetite) is not.
 */
export function pickWeighted(cands: Direction[], rnd: () => number, fit?: (d: Direction) => number): Direction {
  if (cands.length <= 1) return cands[0]
  const filler = (d: Direction) => (fit && fit(d) < 1 && groundOf(d) === 'cream' ? 0.5 : 1)
  const w = cands.map((d, i) => (RANK_WEIGHT[i] ?? 0.4) * varietyWeight(d) * filler(d))
  const total = w.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) return cands[i] }
  return cands[cands.length - 1]
}

/** How many candidates to consider. A clear business match (law firm, bakery) keeps a tight pool; a vague brief gets a wider one. */
export function poolSize(bestFit: number): number {
  return bestFit >= 3 ? 3 : 5
}

/** Mono faces by what the corpus uses with which body face. Warm, human directions keep DM Mono (4 repos use it: a deliberate minority). */
export function corpusMonoFaces(): string[] {
  return DESIGN_KNOWLEDGE.monoFaces.map(m => m.key)
}

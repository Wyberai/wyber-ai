// The art director. A model reads the whole brief and decides how THIS business should look (a dental clinic is not a gaming store);
// code then picks a matching design direction and re-skins it with a seeded hue and font pairing, so two builds in one industry never
// share a face. Keyword matching alone could only ever produce four looks for a dental brief (measured 23 Nov 2026).
//
// Pure data and helpers apart from the one model call. Every colour change keeps the contrast of the original palette.

import { DIRECTIONS, hslToHex, type Direction, type DirectionGroup } from '../design-directions'
import { contrastRatio, luminance } from '../color-contrast'
import { askForJson } from './ask'
import { seededRandom } from './random'
import type { ModelCall, ModelReply } from './types'

export interface Pairing { display: string; body: string; displayWeight: number; displayTracking: string }
export interface Look { hue: number; family: string; fonts: Pairing; type: string; radius: string; why?: string }

/** Colour families: a hue range each (degrees). A build draws one hue inside the range from its seed, so two "teal" sites still differ. */
export const HUE_FAMILIES: Record<string, { range: [number, number]; feel: string }> = {
  teal: { range: [172, 190], feel: 'clean, fresh, medical, calm' },
  sky: { range: [196, 208], feel: 'open, light, friendly, airy' },
  navy: { range: [214, 226], feel: 'trustworthy, professional, financial, legal' },
  indigo: { range: [236, 252], feel: 'technical, focused, software' },
  plum: { range: [278, 298], feel: 'creative, premium, beauty, wellness' },
  berry: { range: [322, 340], feel: 'bold, expressive, fashion, youth' },
  rose: { range: [346, 358], feel: 'warm, caring, celebratory' },
  terracotta: { range: [10, 20], feel: 'earthy, hospitality, food, craft' },
  amber: { range: [34, 46], feel: 'sunny, optimistic, retail, children' },
  olive: { range: [62, 82], feel: 'natural, organic, outdoor' },
  forest: { range: [136, 156], feel: 'growth, sustainability, agriculture, health' },
  slate: { range: [200, 212], feel: 'neutral, restrained, architecture, B2B' },
}

/** Pairings use only fonts the platform already loads, each with a weight the family really has (checked in look.test.ts). */
export const PAIRINGS: Record<string, { feel: string; list: Pairing[] }> = {
  'serif-warm': { feel: 'warm editorial serif with a friendly sans', list: [
    { display: 'Erode', body: 'Satoshi', displayWeight: 500, displayTracking: '-0.02em' },
    { display: 'Gambetta', body: 'Satoshi', displayWeight: 500, displayTracking: '-0.015em' },
    { display: 'Boska', body: 'Satoshi', displayWeight: 400, displayTracking: '-0.02em' },
    { display: 'Young Serif', body: 'Nunito', displayWeight: 400, displayTracking: '-0.01em' },
  ] },
  'serif-classic': { feel: 'classic high-contrast serif, formal and trusted', list: [
    { display: 'DM Serif Display', body: 'Work Sans', displayWeight: 400, displayTracking: '-0.01em' },
    { display: 'Newsreader', body: 'Hanken Grotesk', displayWeight: 500, displayTracking: '-0.02em' },
    { display: 'Cormorant Garamond', body: 'Work Sans', displayWeight: 500, displayTracking: '-0.01em' },
    { display: 'Gloock', body: 'Figtree', displayWeight: 400, displayTracking: '-0.01em' },
  ] },
  grotesk: { feel: 'modern grotesque sans, confident and neutral', list: [
    { display: 'Clash Grotesk', body: 'Satoshi', displayWeight: 500, displayTracking: '-0.02em' },
    { display: 'Space Grotesk', body: 'Inter Tight', displayWeight: 500, displayTracking: '-0.025em' },
    { display: 'Hanken Grotesk', body: 'Hanken Grotesk', displayWeight: 600, displayTracking: '-0.03em' },
    { display: 'Inter Tight', body: 'Inter Tight', displayWeight: 600, displayTracking: '-0.035em' },
  ] },
  geometric: { feel: 'geometric sans, clean and contemporary', list: [
    { display: 'Clash Display', body: 'Satoshi', displayWeight: 500, displayTracking: '-0.01em' },
    { display: 'Supreme', body: 'Satoshi', displayWeight: 500, displayTracking: '-0.02em' },
    { display: 'Figtree', body: 'Figtree', displayWeight: 600, displayTracking: '-0.025em' },
    { display: 'Archivo', body: 'Archivo', displayWeight: 700, displayTracking: '-0.03em' },
  ] },
  humanist: { feel: 'rounded, friendly, approachable', list: [
    { display: 'Fredoka', body: 'Nunito', displayWeight: 600, displayTracking: '0em' },
    { display: 'Baloo 2', body: 'Nunito', displayWeight: 700, displayTracking: '0em' },
    { display: 'Rubik', body: 'Nunito', displayWeight: 500, displayTracking: '-0.01em' },
  ] },
  'display-bold': { feel: 'loud condensed or heavy display type, high energy', list: [
    { display: 'Anton', body: 'Work Sans', displayWeight: 400, displayTracking: '0.01em' },
    { display: 'Archivo Black', body: 'Archivo', displayWeight: 400, displayTracking: '-0.02em' },
    { display: 'Barlow Condensed', body: 'Hanken Grotesk', displayWeight: 700, displayTracking: '0em' },
    { display: 'Unbounded', body: 'Hanken Grotesk', displayWeight: 600, displayTracking: '-0.02em' },
  ] },
  technical: { feel: 'technical, precise, tool-like', list: [
    { display: 'Geist', body: 'Geist', displayWeight: 500, displayTracking: '-0.03em' },
    { display: 'Space Mono', body: 'Inter Tight', displayWeight: 700, displayTracking: '-0.02em' },
    { display: 'IBM Plex Mono', body: 'Hanken Grotesk', displayWeight: 500, displayTracking: '-0.01em' },
  ] },
}

const GROUP_HELP: Record<DirectionGroup, string> = {
  editorial: 'magazine-like, serif and photography led, considered',
  'type-led': 'giant type is the picture, poster-like, confident',
  dark: 'dark, cinematic, energetic, immersive',
  'light-tech': 'airy and light, product and software feel, precise',
  'brand-block': 'bold fields of colour, loud, youthful',
  physical: 'tactile, photo-rich, places and craft and food',
  human: 'friendly, people-centred, soft and welcoming',
  tool: 'dense, utilitarian, dashboards and working tools',
}

export interface LookBrief {
  mode: 'light' | 'dark'; groups: DirectionGroup[]; palette: string; type: string; mood: string[]; why: string
  /** Colour families that ALL suit this business, best first. A build takes the one this industry has used least recently. */
  palettes?: string[]
  /** One word from INDUSTRIES: which recent builds this one must not look like. */
  industry?: string
}

export const INDUSTRIES = ['dental', 'medical', 'legal', 'finance', 'food', 'retail', 'gaming', 'fitness', 'beauty', 'education', 'real-estate', 'hospitality', 'technology', 'manufacturing', 'logistics', 'home-services', 'creative', 'nonprofit', 'agriculture', 'other']

export function buildLookPrompt(prompt: string, surface: 'website' | 'app' | 'saas'): { system: string; user: string } {
  const groups = (Object.keys(GROUP_HELP) as DirectionGroup[]).map(g => `- ${g}: ${GROUP_HELP[g]}`).join('\n')
  const palettes = Object.entries(HUE_FAMILIES).map(([k, v]) => `- ${k}: ${v.feel}`).join('\n')
  const types = Object.entries(PAIRINGS).map(([k, v]) => `- ${k}: ${v.feel}`).join('\n')
  const system = [
    `You are the art director for a ${surface === 'website' ? 'website' : surface === 'saas' ? 'SaaS product and its marketing site' : 'business web app'}. Decide how it should LOOK for this specific business and its real visitors, the way an expert designer would.`,
    'A dental clinic feels clean, calm and trustworthy. A gaming store feels dark, energetic and bold. A family law firm feels restrained and serious. A bakery feels warm. An accountancy tool feels precise. Think about who is looking and what they must feel in five seconds.',
    'Do NOT default to cream grounds with orange or red. Warm earthy colours are right only for food, craft, hospitality and similar. Clinics, law, finance and software almost never want them.',
    `Pick "groups" (one or two) from:\n${groups}`,
    `Pick "palettes": FOUR colour families that are ALL genuinely right for this business, best first, from the list below. Later builds for the same kind of business use the other three, so never pad the list with a family that is wrong for it. Warm earthy families (terracotta, amber) belong only to food, craft, hospitality, children and retail.\n${palettes}`,
    `Pick "industry" (one word) from: ${INDUSTRIES.join(', ')}.`,
    `Pick "type" (one) from:\n${types}`,
    'Pick "mode": "light" or "dark". Dark only when the business and audience suit it (gaming, nightlife, cinema, some tech).',
    'Reply with one JSON object and nothing else: {"industry": "dental", "mode": "light", "groups": ["human"], "palettes": ["teal","sky","forest","navy"], "type": "geometric", "mood": ["calm","clear","trusting"], "why": "one sentence"}',
  ].join('\n')
  return { system, user: `Brief:\n${prompt.slice(0, 1800)}` }
}

export function validateLookBrief(v: unknown): string[] {
  const o = v as Partial<LookBrief> | null
  if (!o || typeof o !== 'object') return ['reply is not an object']
  const out: string[] = []
  if (o.mode !== 'light' && o.mode !== 'dark') out.push('mode must be light or dark')
  if (!Array.isArray(o.groups) || o.groups.length < 1 || o.groups.length > 2 || o.groups.some(g => !(g in GROUP_HELP))) out.push('groups: one or two of ' + Object.keys(GROUP_HELP).join(', '))
  const families = o.palettes ?? (o.palette ? [o.palette] : [])
  if (!Array.isArray(families) || families.length < 1 || families.length > 5 || families.some(f => !(f in HUE_FAMILIES))) out.push('palettes: one to five of ' + Object.keys(HUE_FAMILIES).join(', '))
  if (!o.type || !(o.type in PAIRINGS)) out.push('type must be one of ' + Object.keys(PAIRINGS).join(', '))
  return out
}

// ── colour work ─────────────────────────────────────────────────────────────────────────────────────
type HSL = [number, number, number]
const parse = (s: string | undefined): HSL | null => {
  const m = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(s ?? '')
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}
const show = (c: HSL) => `${Math.round(c[0] * 10) / 10} ${Math.round(c[1] * 10) / 10}% ${Math.round(c[2] * 10) / 10}%`
const ratio = (a: HSL, b: HSL) => contrastRatio(hslToHex(a), hslToHex(b))
const clamp = (n: number) => Math.max(0, Math.min(100, n))

const TINT_KEYS = ['background', 'card', 'popover', 'muted', 'secondary', 'accent', 'border', 'input']
const INK_KEYS = ['foreground', 'card-foreground', 'popover-foreground', 'secondary-foreground', 'accent-foreground', 'muted-foreground']
const BRAND_KEYS = ['primary', 'ring']
const TEXT_PAIRS: [string, string][] = [
  ['foreground', 'background'], ['card-foreground', 'card'], ['popover-foreground', 'popover'], ['muted-foreground', 'background'],
  ['secondary-foreground', 'secondary'], ['accent-foreground', 'accent'], ['primary-foreground', 'primary'],
]

/** The same colour in a new hue, with lightness searched so it reads exactly as bright as the original (a yellow and a navy at equal HSL lightness are not equally bright). */
function sameBrightness(c: HSL, hue: number): HSL {
  const target = luminance(hslToHex(c))
  let lo = 0, hi = 100
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (luminance(hslToHex([hue, c[1], mid])) < target) lo = mid; else hi = mid
  }
  return [hue, c[1], Math.round(((lo + hi) / 2) * 10) / 10]
}

/** Rotate a palette to a new hue. Neutrals stay neutral; brightness is kept; any text pair that loses contrast is nudged back above the original ratio (at least 4.5). */
export function recolorTokens(tokens: Record<string, string>, hue: number): Record<string, string> {
  const t: Record<string, HSL | null> = {}
  for (const k of Object.keys(tokens)) t[k] = parse(tokens[k])
  const next: Record<string, string> = { ...tokens }
  const set = (k: string, c: HSL) => { t[k] = c; next[k] = show(c) }
  for (const k of TINT_KEYS) { const c = t[k]; if (c && c[1] > 6) set(k, sameBrightness(c, hue)) }
  for (const k of INK_KEYS) { const c = t[k]; if (c && c[1] > 6) set(k, sameBrightness(c, hue)) }
  for (const k of BRAND_KEYS) { const c = t[k]; if (c && c[1] > 12) set(k, sameBrightness(c, hue)) }
  for (const [fgK, bgK] of TEXT_PAIRS) {
    const fg = t[fgK], bg = t[bgK], ofg = parse(tokens[fgK]), obg = parse(tokens[bgK])
    if (!fg || !bg || !ofg || !obg) continue
    const need = Math.min(7, Math.max(4.5, ratio(ofg, obg)))
    if (ratio(fg, bg) >= need) continue
    // move the brand colour (primary) or the ink away from its ground until it reads again
    const moveKey = fgK === 'primary-foreground' ? 'primary' : fgK
    const fixed = t[moveKey]!
    const ground = moveKey === 'primary' ? t['primary-foreground']! : bg
    const lighter = moveKey === 'primary' ? fixed[2] > ground[2] : fixed[2] > bg[2]
    let c = fixed
    for (let i = 0; i < 40 && ratio(moveKey === 'primary' ? ground : c, moveKey === 'primary' ? c : bg) < need; i++) c = [c[0], c[1], clamp(c[2] + (lighter ? 2 : -2))]
    set(moveKey, c)
  }
  return next
}

// ── choosing ───────────────────────────────────────────────────────────────────────────────────────
const surfaceOk = (d: Direction, surface: 'website' | 'app' | 'saas') => (surface === 'saas' ? d.surfaces.includes('website') && d.surfaces.includes('app') : d.surfaces.includes(surface))

export function pickDirectionForLook(b: LookBrief, seed: string, surface: 'website' | 'app' | 'saas', opts: { named?: boolean; avoid?: string[] } = {}): Direction {
  const rnd = seededRandom(seed + ':look')
  const pool = DIRECTIONS.filter(d => surfaceOk(d, surface) && (opts.named || !d.needsName) && !(opts.avoid ?? []).includes(d.id))
  const score = (d: Direction) => (d.palette.mode === b.mode ? 10 : 0) + (d.group === b.groups[0] ? 4 : d.group === b.groups[1] ? 2 : 0) + (d.generalist ? 0.5 : 0)
  const ranked = pool.map(d => ({ d, s: score(d) + rnd() * 0.4 })).sort((a, b2) => b2.s - a.s)
  const best = ranked[0]?.s ?? 0
  // everything within one point of the best fit is a fair choice; the seed decides among them
  const near = ranked.filter(x => x.s >= best - 1.5).slice(0, 8)
  return (near[Math.floor(rnd() * near.length)] ?? ranked[0] ?? { d: DIRECTIONS[0] }).d
}

/** Corner radius is a design dimension of its own: sharp for technical and loud type, soft for friendly type, a spread for the rest. */
export const RADII: Record<string, string[]> = {
  humanist: ['0.75rem', '1rem', '1.25rem', '1.5rem'],
  technical: ['0rem', '0.125rem', '0.25rem'],
  'display-bold': ['0rem', '0.125rem', '0.25rem', '0.5rem'],
  default: ['0.125rem', '0.25rem', '0.5rem', '0.75rem', '1rem'],
}

export function lookFor(b: LookBrief, seed: string): Look {
  const rnd = seededRandom(seed + ':skin')
  const [lo, hi] = HUE_FAMILIES[b.palette].range
  const hue = Math.round((lo + rnd() * (hi - lo)) * 10) / 10
  const list = PAIRINGS[b.type].list
  const fonts = list[Math.floor(rnd() * list.length)]
  const radii = RADII[b.type] ?? RADII.default
  return { hue, family: b.palette, type: b.type, fonts, radius: radii[Math.floor(rnd() * radii.length)], why: b.why }
}

/** The direction with the art director's skin applied: recoloured tokens and the chosen font pairing. Used for CSS and for the free-form design brief. */
export function skinDirection(d: Direction, look: Look): Direction {
  return {
    ...d,
    palette: { ...d.palette, tokens: recolorTokens(d.palette.tokens, look.hue), radius: look.radius ?? d.palette.radius },
    fonts: { ...d.fonts, display: look.fonts.display, body: look.fonts.body, displayWeight: look.fonts.displayWeight, displayTracking: look.fonts.displayTracking },
  }
}

export interface ResolvedLook { directionId: string; look: Look; brief: LookBrief }

/** The one model question: how should this business look. Null when the model gives no usable answer (the caller keeps its old behaviour). */
export async function askLookBrief(prompt: string, surface: 'website' | 'app' | 'saas', call: ModelCall, onUsage: (r: ModelReply) => void): Promise<LookBrief | null> {
  const p = buildLookPrompt(prompt, surface)
  const asked = await askForJson<LookBrief>({ call, system: p.system, user: p.user, attempts: 1, timeoutMs: 20000, onUsage, validate: validateLookBrief })
  return asked.ok ? normalizeLookBrief(asked.value) : null
}

/** A valid reply made complete: distinct colour families with the first as the default, and a known industry word. */
export function normalizeLookBrief(b: LookBrief): LookBrief {
  const palettes = [...new Set(b.palettes?.length ? b.palettes : [b.palette])]
  const industry = b.industry && INDUSTRIES.includes(b.industry) ? b.industry : 'other'
  return { ...b, palettes, palette: palettes[0], industry }
}

/** A design drawn from the brief with a seed: cheap, synchronous, and different for every seed. */
export function drawLook(brief: LookBrief, seed: string, surface: 'website' | 'app' | 'saas', opts: { named?: boolean; avoid?: string[] } = {}): ResolvedLook {
  const d = pickDirectionForLook(brief, seed, surface, opts)
  return { directionId: d.id, look: lookFor(brief, seed), brief }
}

/** Ask the art director, then draw one design. For callers that do not need the uniqueness loop. */
export async function resolveLook(
  prompt: string, seed: string, surface: 'website' | 'app' | 'saas', call: ModelCall, onUsage: (r: ModelReply) => void,
  opts: { named?: boolean; avoid?: string[] } = {},
): Promise<ResolvedLook | null> {
  const brief = await askLookBrief(prompt, surface, call, onUsage)
  return brief ? drawLook(brief, seed, surface, opts) : null
}

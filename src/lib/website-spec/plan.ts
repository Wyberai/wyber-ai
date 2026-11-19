import { dealDirections } from '../direction-brief'
import { getDirectionById, type Direction } from '../design-directions'
import { seededRandom } from '../build-spec/random'
import { languagesFor } from '../build-spec/languages'
import { BLUEPRINTS, classifyIntent } from './intents'
import type {
  BuildSpec, HeaderVariant, HeroVariant, ImageSlot, IntentBrief, LangId, LayoutPlan, MotionPlan, OwnerFacts, PlannedSection, ServicesVariant,
} from './types'

export { seededRandom, languagesFor }

const SCHEMA_BY_INDUSTRY: [RegExp, string][] = [
  [/homestay|guest ?house|hotel|resort|haveli|villa|hostel/, 'LodgingBusiness'],
  [/dental|dentist/, 'Dentist'], [/physio|clinic|doctor|vet/, 'MedicalBusiness'], [/bakery/, 'Bakery'], [/cafe|café|coffee/, 'CafeOrCoffeeShop'],
  [/restaurant|kitchen|dhaba|tiffin|bistro/, 'Restaurant'], [/salon|spa/, 'HealthAndBeautyBusiness'], [/gym|studio/, 'SportsActivityLocation'],
  [/law|lawyer|advocate|attorney|notary/, 'LegalService'], [/real estate|property/, 'RealEstateAgent'], [/travel|tour/, 'TravelAgency'],
]

const EDITORIAL = new Set(['editorial', 'type-led'])
const OPEN = new Set(['human', 'physical', 'tool'])

export function heroVariantFor(d: Direction): HeroVariant {
  if (EDITORIAL.has(d.group)) return 'editorial'
  if (OPEN.has(d.group)) return 'split'
  return 'stacked'
}
export function headerVariantFor(d: Direction): HeaderVariant {
  return EDITORIAL.has(d.group) || d.group === 'physical' ? 'condensing' : 'navbar'
}
export function servicesVariantFor(d: Direction): ServicesVariant {
  if (EDITORIAL.has(d.group)) return 'list'
  if (d.group === 'tool' || d.group === 'light-tech') return 'bento'
  return 'cards'
}

const HERO_IMAGE_MEDIA = new Set(['photo', 'video', 'illustration', 'cutouts', 'line-art'])

export interface PlanOptions {
  /** Same id, same plan. */
  seed: string
  facts?: OwnerFacts
  /** An explicit direction id (Plan Mode) wins. */
  directionId?: string | null
  /** Directions this user got recently: skipped when there is another good fit. */
  avoid?: string[]
}

/** What the owner said about the feel they want. Each phrase prefers the directions that deliver it. */
const FEEL: { re: RegExp; fits: (d: Direction) => boolean }[] = [
  { re: /\b(editorial|magazine|journal|literary)\b/i, fits: d => EDITORIAL.has(d.group) },
  { re: /\b(photo-?led|photograph\w*|photos|imagery|visual)\b/i, fits: d => d.rules.heroMedia === 'photo' },
  { re: /\b(warm|friendly|cosy|cozy|homely|welcoming|family)\b/i, fits: d => d.palette.mode === 'light' && (OPEN.has(d.group) || EDITORIAL.has(d.group)) },
  { re: /\b(dark|cinematic|moody|night|dramatic)\b/i, fits: d => d.palette.mode === 'dark' },
  { re: /\b(minimal|minimalist|clean|simple|quiet|calm)\b/i, fits: d => d.group === 'light-tech' || d.group === 'type-led' },
  { re: /\b(bold|loud|playful|colou?rful|vibrant)\b/i, fits: d => d.group === 'brand-block' },
  { re: /\b(luxury|luxurious|premium|elegant|refined)\b/i, fits: d => d.group === 'editorial' || d.group === 'dark' },
]
export function feelScore(prompt: string, d: Direction): number {
  return FEEL.reduce((n, f) => n + (f.re.test(prompt) && f.fits(d) ? 1 : 0), 0)
}

export function pickWebsiteDirection(prompt: string, o: PlanOptions): Direction {
  const explicit = getDirectionById(o.directionId)
  if (explicit) return explicit
  const rnd = seededRandom(o.seed)
  // Take the best fits for the business, then let the stated feel decide the order (stable for equal scores).
  const wide = dealDirections(prompt, 9, { projectType: 'website', rnd })
  const top = wide.map((d, i) => ({ d, i, s: feelScore(prompt, d) })).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 3).map(x => x.d)
  const fresh = top.filter(d => !(o.avoid ?? []).includes(d.id))
  const pool = fresh.length ? fresh : top
  return pool[Math.floor(rnd() * pool.length)]
}

/** The direction's own motion note decides what moves; the seed varies the optional extras so two sites never share a rhythm. */
export function motionFor(d: Direction, seed: string): MotionPlan {
  const r = seededRandom(seed + ':motion')
  const note = d.motion
  // "None beyond hover" is still; "Almost none: a gentle rise" and "...nothing else moves" still move, quietly
  const still = /^\s*none\b/i.test(note)
  const quiet = /almost none|subtle|quiet|otherwise static/i.test(note)
  const editorial = EDITORIAL.has(d.group)
  const stickyCta = r() < 0.5
  return {
    reveal: !still,
    stagger: !still && !quiet,
    progress: !still && (editorial || r() < 0.4),
    highlight: !still && (editorial || r() < 0.5),
    dropCap: editorial,
    stickyCta,
    // the back-to-top button and the sticky bar share the bottom edge, so only one of them appears
    backToTop: !stickyCta,
  }
}

export function layoutFor(d: Direction, seed: string): LayoutPlan {
  const r = seededRandom(seed + ':layout')
  const coin = () => r() < 0.5
  const rhythm: LayoutPlan['rhythm'] = EDITORIAL.has(d.group) ? 'rules' : d.palette.mode === 'dark' ? 'bands' : (['bands', 'plain', 'rules'] as const)[Math.floor(r() * 3)]
  return { heroFlip: coin(), heroMediaFirst: coin(), rhythm, steps: coin() ? 'timeline' : 'columns', faq: coin() ? 'split' : 'centered', contactFlip: coin(), aboutFlip: coin() }
}

export function planWebsite(prompt: string, o: PlanOptions): BuildSpec {
  const facts = o.facts ?? {}
  const brief: IntentBrief = classifyIntent(prompt, facts)
  const bp = BLUEPRINTS[brief.intent]
  const d = pickWebsiteDirection(prompt, o)
  const hero = heroVariantFor(d)
  const sv = servicesVariantFor(d)

  const sections: PlannedSection[] = bp.sections
    .filter(s => !s.needs || s.needs.every(k => Boolean(facts[k]) || (k === 'email' && brief.modules.includes('enquiry'))))
    .map(s => {
      const count =
        s.kind === 'services' ? (sv === 'bento' ? { min: 4, max: 4 } : sv === 'cards' ? { min: 3, max: 6 } : { min: 3, max: 6 })
        : s.kind === 'rows' ? { min: 3, max: 8 }
        : s.kind === 'steps' ? { min: 3, max: 4 }
        : s.kind === 'faq' ? { min: 4, max: 6 }
        : { min: 0, max: 0 }
      return { ...s, variant: s.kind === 'services' ? sv : undefined, count }
    })

  const images: ImageSlot[] = []
  // Slots carry the direction's STYLE only. The subject is written by the copy step from the real brief (an image prompt must
  // never contain the goal action, a phone number or any wording the image model could paint as a sign).
  if (HERO_IMAGE_MEDIA.has(d.rules.heroMedia)) {
    images.push({
      id: 'hero', brief: d.imageBrief, eager: true, altFrom: 'hero',
      ratio: hero === 'editorial' ? '21/9' : hero === 'stacked' ? '16/9' : '4/3',
    })
  }
  if ((EDITORIAL.has(d.group) || d.group === 'physical') && sections.some(s => s.id === 'about')) {
    images.push({ id: 'about', brief: d.imageBrief, ratio: '4/5', eager: false, altFrom: 'about' })
  }

  const schemaType = SCHEMA_BY_INDUSTRY.find(([re]) => re.test(brief.industry))?.[1] ?? bp.schemaType
  const slug = (brief.industry + '-' + (facts.city ?? 'site')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return {
    version: 1,
    layout: layoutFor(d, o.seed),
    languages: languagesFor(prompt, facts),
    brief,
    direction: { id: d.id, name: d.name, group: d.group, mode: d.palette.mode, heroMedia: d.rules.heroMedia },
    header: headerVariantFor(d),
    hero,
    motion: motionFor(d, o.seed),
    sections,
    images,
    seo: { schemaType, slug, titleMax: 60, descMin: 110, descMax: 158, faqSchema: sections.some(s => s.kind === 'faq') },
  }
}

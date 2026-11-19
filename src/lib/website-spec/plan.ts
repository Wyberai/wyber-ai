import { dealDirections } from '../direction-brief'
import { getDirectionById, type Direction } from '../design-directions'
import { BLUEPRINTS, classifyIntent } from './intents'
import type {
  BuildSpec, HeaderVariant, HeroVariant, ImageSlot, IntentBrief, OwnerFacts, PlannedSection, ServicesVariant,
} from './types'

/** Small deterministic generator so the same project id always gets the same direction and variants. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  let a = h >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296)
  }
}

const SCHEMA_BY_INDUSTRY: [RegExp, string][] = [
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

export function pickWebsiteDirection(prompt: string, o: PlanOptions): Direction {
  const explicit = getDirectionById(o.directionId)
  if (explicit) return explicit
  const rnd = seededRandom(o.seed)
  const top = dealDirections(prompt, 3, { projectType: 'website', rnd })
  const fresh = top.filter(d => !(o.avoid ?? []).includes(d.id))
  const pool = fresh.length ? fresh : top
  return pool[Math.floor(rnd() * pool.length)]
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
  const subject = `${brief.industry}${facts.city ? ' in ' + facts.city : ''}`
  if (HERO_IMAGE_MEDIA.has(d.rules.heroMedia)) {
    images.push({
      id: 'hero', brief: `${d.imageBrief} Subject: ${subject}, ${bp.goalAction}.`, eager: true, altFrom: 'hero',
      ratio: hero === 'editorial' ? '21/9' : hero === 'stacked' ? '16/9' : '4/3',
    })
  }
  if ((EDITORIAL.has(d.group) || d.group === 'physical') && sections.some(s => s.id === 'about')) {
    images.push({ id: 'about', brief: `${d.imageBrief} Subject: the people and place behind a ${subject}.`, ratio: '4/5', eager: false, altFrom: 'about' })
  }

  const schemaType = SCHEMA_BY_INDUSTRY.find(([re]) => re.test(brief.industry))?.[1] ?? bp.schemaType
  const slug = (brief.industry + '-' + (facts.city ?? 'site')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return {
    version: 1,
    brief,
    direction: { id: d.id, name: d.name, group: d.group, mode: d.palette.mode, heroMedia: d.rules.heroMedia },
    header: headerVariantFor(d),
    hero,
    motion: /\b(no scroll|instant|none)\b/i.test(d.motion) ? 'none' : 'reveal',
    sections,
    images,
    seo: { schemaType, slug, titleMax: 60, descMin: 110, descMax: 158, faqSchema: sections.some(s => s.kind === 'faq') },
  }
}

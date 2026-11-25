import { describe, it, expect } from 'vitest'
import { planWebsite, sxPoolsFor, renderWebsite, validateCopy, BLUEPRINTS } from './index'
import { compositionOf, FEATURE_NAME, featuresVariant, rowsVariantFor, ABOUT_SHOWS_PHOTO, HERO_NEEDS_PHOTO, HERO_NO_PHOTO, HERO_PHOTO_FIRST, HEADER_NAME, HERO_NAME, STEPS_NAME, ABOUT_NAME, FAQ_NAME, CONTACT_NAME, FOOTER_NAME, VISIT_NAME } from './composition'
import { DEMOS } from './demo-copy'
import { DIRECTIONS } from '../design-directions'
import { checkWebsiteReady } from '../website-ready'
import { scanSlopSource } from '../unslop'
import { WYBER_SECTION_NAMES } from '../wyber-sections'

// How many different pages the website planner can produce, per industry (blueprint). Measured 25 Nov 2026 with the same prompts and seeds before
// and after the section expansion. "Brief pool" = what a brief drawing its own directions yields over N seeds; "one direction" = the same
// design direction over many seeds (the case the founder complained about: a dental brief came out as the same few looks).

const PROMPTS: Record<string, string> = {
  'local-service': 'dental clinic in Ahmedabad', food: 'sourdough bakery in Pune', catalogue: 'basmati rice exporter', portfolio: 'freelance photographer portfolio',
  firm: 'family law firm in Mumbai', education: 'JEE coaching institute', event: 'two-day tech expo with talks and demos', community: 'temple trust and community',
  listings: 'real estate listings in Surat', product: 'saas landing page for invoicing software', stay: 'homestay guest house in Udaipur', publication: 'food magazine blog', store: 'online store for steel utensils',
}

/** Distinct page compositions seen over 1,500 seeds (brief pool) and over 400 seeds on one direction, BEFORE the expansion (commit 0f1c628). */
export const BASELINE: Record<string, { pool: number; one: number }> = {
  'local-service': { pool: 618, one: 244 }, food: { pool: 292, one: 125 }, catalogue: { pool: 385, one: 164 }, portfolio: { pool: 160, one: 95 },
  firm: { pool: 570, one: 244 }, education: { pool: 372, one: 164 }, event: { pool: 335, one: 125 }, community: { pool: 617, one: 244 },
  listings: { pool: 135, one: 64 }, product: { pool: 408, one: 163 }, stay: { pool: 461, one: 164 }, publication: { pool: 443, one: 244 }, store: { pool: 707, one: 244 },
}

/** The per-group pool sizes before the expansion: header, hero (non-photo), features, steps, about, faq, cta, contact, footer. */
const OLD_POOL_SIZES: Record<string, number[]> = {
  editorial: [2, 2, 2, 2, 2, 2, 2, 2, 2], 'type-led': [2, 3, 2, 2, 2, 2, 2, 2, 2], human: [2, 2, 3, 2, 2, 2, 2, 2, 2], physical: [2, 2, 3, 2, 2, 2, 2, 2, 2],
  tool: [2, 3, 3, 2, 2, 2, 2, 2, 2], 'light-tech': [2, 3, 3, 2, 2, 2, 2, 2, 2], dark: [2, 2, 3, 2, 2, 2, 2, 2, 2], 'brand-block': [2, 2, 3, 2, 2, 2, 2, 2, 2],
}

/** The same count for the old pools: only the parts that industry's blueprint has (header, hero, features, steps, about, faq, cta, contact, footer). */
function oldReach(intent: keyof typeof BLUEPRINTS, group: string): number {
  const kinds = new Set(BLUEPRINTS[intent].sections.map(s => s.kind))
  const sz = OLD_POOL_SIZES[group]
  const has = [true, true, kinds.has('services') || kinds.has('rows'), kinds.has('steps'), kinds.has('about'), kinds.has('faq'), kinds.has('cta'), kinds.has('contact'), true]
  return sz.reduce((a, b, i) => (has[i] ? a * b : a), 1)
}

/** Compositions one direction can reach for an industry: the product of the distinct components each part of the page can be, for the parts that industry's blueprint has. */
function reachable(intent: keyof typeof BLUEPRINTS, d: (typeof DIRECTIONS)[number]): number {
  const kinds = new Set(BLUEPRINTS[intent].sections.map(s => s.kind))
  const g = sxPoolsFor(d, false)
  const n = (xs: string[]) => new Set(xs).size
  const list = BLUEPRINTS[intent].sections.find(s => s.kind === 'services' || s.kind === 'rows')
  const features = list ? n(g.features.map(f => FEATURE_NAME[list.kind === 'rows' ? rowsVariantFor(f) : featuresVariant(f)])) : 1
  const parts = [
    n(g.header.map(x => HEADER_NAME[x])), n(g.hero.map(x => HERO_NAME[x])), features,
    kinds.has('steps') ? n(g.steps.map(x => STEPS_NAME[x])) : 1, kinds.has('about') ? n(g.about.map(x => ABOUT_NAME[x])) : 1,
    kinds.has('faq') ? n(g.faq.map(x => FAQ_NAME[x])) : 1, kinds.has('contact') ? n(g.contact.map(x => CONTACT_NAME[x])) : 1,
    kinds.has('visit') ? n(g.visit.map(x => VISIT_NAME[x])) : 1, n(g.footer.map(x => FOOTER_NAME[x])), n(g.strip), kinds.has('cta') ? g.cta.length : 1,
  ]
  return parts.reduce((a, b) => a * b, 1)
}

describe('page variety per industry', () => {
  it('the planner reaches far more distinct page compositions than before, for every industry', () => {
    const lines: string[] = []
    let poolSum = 0, oneSum = 0, baseSum = 0, baseOneSum = 0
    for (const [intent, prompt] of Object.entries(PROMPTS)) {
      const pool = new Set<string>(), one = new Set<string>()
      for (let i = 0; i < 1000; i++) pool.add(compositionOf(planWebsite(prompt, { seed: 'm' + i })).join('|'))
      const d0 = DIRECTIONS.find(d => d.group === 'human' && d.surfaces.includes('website'))!
      for (let i = 0; i < 300; i++) one.add(compositionOf(planWebsite(prompt, { seed: 'z' + i, directionId: d0.id })).join('|'))
      const b = BASELINE[intent]
      lines.push(`${intent.padEnd(14)} brief pool ${String(b.pool).padStart(4)} (1500 seeds) -> ${String(pool.size).padStart(4)} (1000 seeds)   one direction ${String(b.one).padStart(3)} (400) -> ${String(one.size).padStart(3)} (300)   reachable on one direction ${reachable(intent as never, d0).toLocaleString('en-US')}`)
      // the baseline's best industry over 1,500 seeds is beaten by every industry over 1,000
      expect(pool.size, intent + ' brief pool').toBeGreaterThan(Math.max(...Object.values(BASELINE).map(x => x.pool)))
      expect(one.size, intent + ' one direction').toBeGreaterThan(Math.max(...Object.values(BASELINE).map(x => x.one)))
      poolSum += pool.size; oneSum += one.size; baseSum += b.pool; baseOneSum += b.one
    }
    console.log('\n' + lines.join('\n') + `\nTOTAL brief pool ${baseSum} -> ${poolSum}   one direction ${baseOneSum} -> ${oneSum}`)
    expect(poolSum).toBeGreaterThan(baseSum * 2.2)
  }, 120_000)

  it('the space one direction can reach is at least 40 times the old one, for every group and industry', () => {
    const lines: string[] = []
    for (const group of Object.keys(OLD_POOL_SIZES)) {
      const d = DIRECTIONS.find(x => x.group === group && x.surfaces.includes('website'))
      if (!d) continue
      for (const intent of Object.keys(PROMPTS)) {
        const now = reachable(intent as never, d), old = oldReach(intent as never, group)
        expect(now, group + '/' + intent).toBeGreaterThan(old * 40)
      }
      const old = oldReach('local-service', group)
      lines.push(`${group.padEnd(12)} old ${old} -> local-service ${reachable('local-service', d).toLocaleString('en-US')}, product ${reachable('product', d).toLocaleString('en-US')}, food ${reachable('food', d).toLocaleString('en-US')}`)
    }
    console.log('\n' + lines.join('\n'))
  })
})

describe('every drawn composition is sound', () => {
  const FACTS = { city: 'Pune', hours: 'Mon to Sat 9 to 6', phone: '+91 98765 43210', email: 'hello@example.com' }
  it('photo-led directions always get a photograph in the first screen; type-led ones never a hero that needs one', () => {
    for (const d of DIRECTIONS.filter(x => x.surfaces.includes('website'))) for (const intent of ['local-service', 'food', 'product', 'event']) for (let i = 0; i < 12; i++) {
      const spec = planWebsite(PROMPTS[intent], { seed: 's' + i, directionId: d.id, facts: i % 2 ? FACTS : {} })
      const hero = spec.layout!.sx!.hero
      const photoLed = ['photo', 'video', 'illustration', 'cutouts', 'line-art'].includes(d.rules.heroMedia)
      const tag = d.id + '/' + intent + '/' + i + ' ' + hero
      if (photoLed) { expect(HERO_PHOTO_FIRST.has(hero), tag).toBe(true); expect(spec.images.some(x => x.id === 'hero'), tag).toBe(true) }
      else { expect(HERO_NEEDS_PHOTO.has(hero), tag).toBe(false); expect(spec.images.some(x => x.id === 'hero'), tag).toBe(false) }
      if (HERO_NO_PHOTO.has(hero)) expect(spec.images.some(x => x.id === 'hero'), tag).toBe(false)
      // the about photograph is only generated when the chosen about section shows it
      expect(spec.images.some(x => x.id === 'about') && !ABOUT_SHOWS_PHOTO.has(spec.layout!.sx!.about), tag).toBe(false)
    }
  })

  it('facts-based variants (ledger hero, utility header) are only drawn when the owner gave facts', () => {
    for (const d of DIRECTIONS.filter(x => x.surfaces.includes('website'))) for (let i = 0; i < 30; i++) {
      const none = planWebsite(PROMPTS.food, { seed: 'f' + i, directionId: d.id }).layout!.sx!
      expect(none.hero, d.id).not.toBe('ledger')
      expect(none.header, d.id).not.toBe('utility')
    }
  })

  it('grid sections get exactly the item counts they need (four-up layouts: 4; the rest 3 to 6, rows 3 to 8)', () => {
    for (const intent of Object.keys(PROMPTS)) for (let i = 0; i < 60; i++) {
      const spec = planWebsite(PROMPTS[intent], { seed: 'c' + i })
      for (const s of spec.sections) {
        if (s.kind === 'services') expect(s.count, intent).toEqual(s.variant === 'bento' || s.variant === 'grid' ? { min: 4, max: 4 } : { min: 3, max: 6 })
        if (s.kind === 'rows') { expect(s.count).toEqual({ min: 3, max: 8 }); expect(['bento', 'grid', 'cards']).not.toContain(s.variant) }
      }
    }
  })

  it('rendered sites import only sections that exist, pass the launch checks and the anti-slop scan, across many layouts', () => {
    for (const d of DEMOS) for (let i = 0; i < 40; i++) {
      const spec = planWebsite(d.prompt, { seed: d.seed + 'r' + i, facts: d.facts })
      // the demo copy has no about photograph text: give it some when the plan carries an about slot (the real copy step writes it)
      const copy: typeof d.copy = { ...d.copy, sections: { ...d.copy.sections } }
      if (spec.images.some(x => x.id === 'about') && copy.sections.about) copy.sections.about = { ...copy.sections.about, imageAlt: 'A quiet view of the place and the people who work there, in daylight', imageBrief: 'A quiet view of the place and the people who work there, in daylight, unposed, soft natural light, a calm and uncluttered room.' }
      if (spec.images.some(x => x.id === 'hero') && !copy.hero.imageBrief) copy.hero = { ...copy.hero, imageAlt: 'The place and the people who run it, in daylight, unposed', imageBrief: 'The place and the people who run it, in daylight, unposed, soft natural light, a calm and uncluttered room with a plant by the window.' }
      // card grids need a multiple of three items (the copy step is told so); trim the four-item demo list to three for them
      for (const sec of spec.sections) if (sec.kind === 'services' && sec.variant === 'cards' && copy.sections[sec.id]?.items) copy.sections[sec.id] = { ...copy.sections[sec.id], items: copy.sections[sec.id].items!.slice(0, 3) }
      expect(validateCopy(spec, copy).map(p => p.path + ' ' + p.message), d.key + i).toEqual([])
      const files = renderWebsite(spec, copy).files
      const app = files['src/App.tsx']
      const imp = app.match(/import \{([^}]+)\} from '\.\/wyber-sections'/)
      for (const n of (imp?.[1] ?? '').split(',').map(x => x.trim()).filter(Boolean)) expect(WYBER_SECTION_NAMES as readonly string[], n).toContain(n)
      // every component the composition names is really in the rendered page
      for (const name of compositionOf(spec)) if (name !== 'legacy') expect(app, d.key + i + ' ' + name).toContain(name)
      expect(checkWebsiteReady(files).items.filter(x => !x.ok).map(x => x.id).filter(x => x !== 'language-toggle' && x !== 'copy-depth'), d.key + i).toEqual([])
      expect(scanSlopSource({ 'src/App.tsx': app }).issues.map(x => x.id + ': ' + x.sample), d.key + i).toEqual([])
    }
  }, 120_000)
})

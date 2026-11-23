import { describe, it, expect } from 'vitest'
import { DIRECTIONS, getDirectionById, type Direction } from './design-directions'
import { DESIGN_KNOWLEDGE } from './design-knowledge'
import { groundOf, hueFamilyOf, varietyWeight, corpusMonoFaces, pickWeighted, poolSize } from './design-variety'
import { pickWebsiteDirection } from './website-spec/plan'
import { pickSaasDirection } from './saas-spec/plan'
import { UNSLOP_WEBAPP_RULES } from './unslop'

const WEBSITE_BRIEFS: Record<string, string> = {
  dental: 'A website for a dental clinic in Pune with appointment booking',
  law: 'A website for a family law firm in Mumbai',
  bakery: 'A website for a neighbourhood bakery and cafe',
  restaurant: 'A website for a family restaurant with a menu and table booking',
  yoga: 'A website for a yoga studio with class timetable',
  realestate: 'A website for a real estate agency listing apartments',
  boutique: 'An online boutique selling handmade clothing',
  photographer: 'A portfolio website for a wedding photographer',
  school: 'A website for a coaching institute and tuition classes',
  ngo: 'A website for a charity that runs a rural education programme',
  gym: 'A website for a local gym with membership plans',
  homestay: 'A website for a homestay in the hills',
  salon: 'A website for a hair salon and spa',
  architect: 'A website for an architecture practice',
}
const SAAS_BRIEFS: Record<string, string> = {
  crm: 'A SaaS CRM that helps small agencies track deals and clients',
  invoicing: 'A SaaS invoicing tool for freelancers',
  hr: 'A SaaS for HR teams to manage leave and onboarding',
  analytics: 'A SaaS analytics dashboard for online stores',
  scheduling: 'A SaaS appointment scheduling tool for clinics',
  support: 'A SaaS helpdesk for support teams',
}
const SEEDS = Array.from({ length: 30 }, (_, i) => `seed-${i + 1}`)

function run(briefs: Record<string, string>, pick: (prompt: string, seed: string) => Direction) {
  const out: { industry: string; seed: string; d: Direction }[] = []
  for (const [industry, prompt] of Object.entries(briefs)) for (const seed of SEEDS) out.push({ industry, seed, d: pick(prompt, seed) })
  return out
}
const share = <T,>(xs: T[], f: (x: T) => string) => {
  const m = new Map<string, number>()
  for (const x of xs) m.set(f(x), (m.get(f(x)) ?? 0) + 1)
  return new Map([...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v / xs.length] as const))
}
const fmt = (m: Map<string, number>) => [...m.entries()].map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(', ')

const website = run(WEBSITE_BRIEFS, (p, s) => pickWebsiteDirection(p, { seed: s }))
const saas = run(SAAS_BRIEFS, (p, s) => pickSaasDirection(p, { seed: s }))

describe('variety of picked directions', () => {
  it('prints the distribution (website and SaaS)', () => {
    for (const [name, set] of [['website', website], ['saas', saas]] as const) {
      console.log(`[${name}] n=${set.length}`)
      console.log('  ground:', fmt(share(set, x => groundOf(x.d))))
      console.log('  primary hue:', fmt(share(set, x => hueFamilyOf(x.d))))
      console.log('  hero:', fmt(share(set, x => x.d.rules.heroMedia)))
      console.log('  mode:', fmt(share(set, x => x.d.palette.mode)))
      console.log('  distinct directions:', new Set(set.map(x => x.d.id)).size, '| top:', fmt(new Map([...share(set, x => x.d.id)].slice(0, 5))))
    }
  })

  it('websites: cream is not the default ground', () => {
    expect(share(website, x => groundOf(x.d)).get('cream') ?? 0).toBeLessThanOrEqual(0.4)
  })

  it('websites: no single direction takes more than a quarter of all picks', () => {
    expect(Math.max(...share(website, x => x.d.id).values())).toBeLessThanOrEqual(0.25)
  })

  it('websites: picks spread over at least 14 directions, 4 grounds, 5 hue families and 4 hero styles', () => {
    expect(new Set(website.map(x => x.d.id)).size).toBeGreaterThanOrEqual(14)
    expect(new Set(website.map(x => groundOf(x.d))).size).toBeGreaterThanOrEqual(4)
    expect(new Set(website.map(x => hueFamilyOf(x.d))).size).toBeGreaterThanOrEqual(5)
    expect(new Set(website.map(x => x.d.rules.heroMedia)).size).toBeGreaterThanOrEqual(4)
  })

  it('websites: the over-represented corpus primary (blue + neutral) is not the majority of picks', () => {
    const s = share(website, x => hueFamilyOf(x.d))
    expect((s.get('blue') ?? 0) + (s.get('neutral') ?? 0)).toBeLessThan(0.5)
  })

  it('two briefs in the same industry get different directions across seeds', () => {
    for (const industry of Object.keys(WEBSITE_BRIEFS)) {
      const ids = new Set(website.filter(x => x.industry === industry).map(x => x.d.id))
      expect(ids.size, `${industry} always gets the same ${[...ids].join(',')}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('SaaS: picks spread over at least 5 directions and cream is not the default ground', () => {
    expect(new Set(saas.map(x => x.d.id)).size).toBeGreaterThanOrEqual(5)
    expect(share(saas, x => groundOf(x.d)).get('cream') ?? 0).toBeLessThanOrEqual(0.15)
    expect(Math.max(...share(saas, x => x.d.id).values())).toBeLessThanOrEqual(0.4)
  })

  it('SaaS: every pick is made for both a website and an app', () => {
    for (const x of saas) expect(x.d.surfaces).toEqual(expect.arrayContaining(['website', 'app']))
  })

  it('is deterministic: the same seed gives the same direction', () => {
    for (const [industry, prompt] of Object.entries(WEBSITE_BRIEFS)) {
      expect(pickWebsiteDirection(prompt, { seed: 'fixed' }).id, industry).toBe(pickWebsiteDirection(prompt, { seed: 'fixed' }).id)
    }
  })

  it('an explicit direction still wins, and "avoid" is still honoured', () => {
    expect(pickWebsiteDirection('a bakery', { seed: 'a', directionId: 'mn-signal' }).id).toBe('mn-signal')
    for (const seed of SEEDS.slice(0, 10)) {
      const first = pickWebsiteDirection(WEBSITE_BRIEFS.bakery, { seed })
      expect(pickWebsiteDirection(WEBSITE_BRIEFS.bakery, { seed, avoid: [first.id] }).id).not.toBe(first.id)
    }
  })

  it('a clear feel in the brief still decides: "dark moody" gets dark directions', () => {
    for (const seed of SEEDS.slice(0, 10)) expect(pickWebsiteDirection('a dark, moody cocktail bar website', { seed }).palette.mode).toBe('dark')
  })

  it('fit stays in charge: a law-firm brief never gets a playful or dark-tech direction', () => {
    const bad = new Set(['il-joyful', 'hl-anti-clinical', 'mono-dev', 'dk-instrument', 'fb-oxblood-pop'])
    for (const x of website.filter(x => x.industry === 'law')) expect(bad.has(x.d.id), x.d.id).toBe(false)
  })
})

describe('the library itself', () => {
  it('classifies every direction (ground, hue family) and the cream share is reported', () => {
    const cream = DIRECTIONS.filter(d => groundOf(d) === 'cream').map(d => d.id)
    console.log(`[library] ${DIRECTIONS.length} directions, cream grounds: ${cream.length} (${cream.join(', ')})`)
    expect(cream.length).toBeGreaterThan(0)
    for (const d of DIRECTIONS) expect(varietyWeight(d)).toBeGreaterThanOrEqual(0.3)
  })

  it('cream directions weigh less than an equal-fit white one; common corpus hues weigh less than rare ones', () => {
    const cream = getDirectionById('ed-brand-world')!
    const white = getDirectionById('mk-photo-grid')!
    expect(varietyWeight(cream)).toBeLessThan(varietyWeight(white))
    const rare = DIRECTIONS.find(d => groundOf(d) === 'white' && ['orange', 'green', 'teal', 'red'].includes(hueFamilyOf(d)))!
    const common = DIRECTIONS.find(d => groundOf(d) === 'white' && hueFamilyOf(d) === 'blue')!
    expect(varietyWeight(common)).toBeLessThan(varietyWeight(rare))
  })

  it('mono faces are no longer all DM Mono and come from the corpus set', () => {
    const monos = share(DIRECTIONS, d => d.fonts.mono)
    console.log('[library] mono faces:', fmt(monos))
    expect(monos.get('DM Mono') ?? 1).toBeLessThanOrEqual(0.65)
    for (const d of DIRECTIONS) {
      if (d.fonts.mono !== 'DM Mono') expect(corpusMonoFaces(), d.id).toContain(d.fonts.mono)
    }
  })

  it('pool size is tight for a clear business match and wide for a vague brief', () => {
    expect(poolSize(3)).toBe(3)
    expect(poolSize(0)).toBe(5)
  })

  it('pickWeighted never returns a candidate outside the list and handles one candidate', () => {
    const c = DIRECTIONS.slice(0, 4)
    for (let i = 0; i < 50; i++) expect(c).toContain(pickWeighted(c, () => Math.random()))
    expect(pickWeighted([c[0]], () => 0.5)).toBe(c[0])
  })
})

describe('the knowledge base is honest', () => {
  it('every entry has a repo count that fits inside its denominator', () => {
    const k = DESIGN_KNOWLEDGE
    for (const x of k.primaryHue) expect(x.repos).toBeGreaterThan(0)
    expect(k.primaryHue.reduce((a, x) => a + x.repos, 0)).toBe(k.denominators.withPrimaryToken)
    expect(k.defaultTheme.reduce((a, x) => a + x.repos, 0)).toBe(k.denominators.withBackgroundToken)
    expect(k.radiusTier.reduce((a, x) => a + x.repos, 0)).toBe(k.denominators.withRadius)
    for (const list of [k.fonts, k.monoFaces, k.pairingsWithoutMono, k.heroVariants, k.navigation, k.landingSections, k.components]) {
      for (const x of list) expect(x.repos).toBeLessThanOrEqual(k.denominators.repos)
    }
    expect(k.denominators.repos).toBe(3903)
  })

  it('states its limits, and no industry palette is claimed from fewer than 20 readable primaries', () => {
    expect(DESIGN_KNOWLEDGE.limits.length).toBeGreaterThanOrEqual(5)
    expect(DESIGN_KNOWLEDGE.limits.join(' ')).toMatch(/ORDER/)
    for (const [name, b] of Object.entries(DESIGN_KNOWLEDGE.byBusiness)) {
      expect(b.repos, name).toBeGreaterThanOrEqual(50)
      expect(b.hueRepos).toBeLessThanOrEqual(b.repos)
    }
  })

  it('carries no repo names, urls or source code', () => {
    expect(JSON.stringify(DESIGN_KNOWLEDGE)).not.toMatch(/github\.com|https?:\/\/|=>|function\s*\(/)
  })

  it('the anti-slop rules are intact (scanner untouched)', () => {
    expect(UNSLOP_WEBAPP_RULES).toContain('US2 COLOR')
    expect(UNSLOP_WEBAPP_RULES).toContain('Cream with an orange, amber or rust accent is the default every generated app falls into')
  })
})

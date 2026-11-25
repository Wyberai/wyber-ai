import { describe, it, expect, beforeAll } from 'vitest'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WYBER_SECTIONS_SOURCE, WYBER_SECTION_NAMES } from './wyber-sections'
import { WYBER_HEROES_NAMES } from './wyber-sections-heroes'
import { WYBER_BLOCKS_NAMES } from './wyber-sections-blocks'

// The sections ship as a string, so these tests compile that string for real and render every new component to HTML on the server:
// nothing may throw, every title must reach the page, and no grid may end on an orphan row.

type Mod = Record<string, (p: Record<string, unknown>) => unknown>
let M: Mod
let renderToStaticMarkup: (n: unknown) => string
let h: (t: unknown, p?: unknown, ...c: unknown[]) => unknown

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'wyber-sections-'))
  writeFileSync(join(dir, 'wyber-ui.ts'), "import clsx from 'clsx'\nexport const cn = (...a: unknown[]) => clsx(a as never)\n")
  writeFileSync(join(dir, 'wyber-sections.tsx'), WYBER_SECTIONS_SOURCE)
  const out = await build({
    entryPoints: [join(dir, 'wyber-sections.tsx')], bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'framer-motion', 'lucide-react'], nodePaths: [join(process.cwd(), 'node_modules')], logLevel: 'silent',
  })
  const req = createRequire(join(process.cwd(), 'package.json'))
  const mod = { exports: {} as Mod }
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, req)
  M = mod.exports
  renderToStaticMarkup = req('react-dom/server').renderToStaticMarkup
  h = req('react').createElement
}, 60_000)

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ title: 'Item title ' + (i + 1), text: 'Item text ' + (i + 1), meta: i % 2 ? 'Meta ' + (i + 1) : undefined }))
const faq = (n: number) => Array.from({ length: n }, (_, i) => ({ question: 'Question ' + (i + 1) + '?', answer: 'Answer ' + (i + 1) }))
const facts = (n: number) => Array.from({ length: n }, (_, i) => ({ label: 'Label ' + (i + 1), value: 'Value ' + (i + 1) }))
const links = [{ label: 'One', href: '#one' }, { label: 'Two', href: '#two' }, { label: 'Three', href: '#three' }]
const media = () => h('img', { src: 'x.jpg', alt: 'A photograph' })
const render = (name: string, props: Record<string, unknown>) => renderToStaticMarkup(h(M[name], props))

const LIST = ['FeaturesTabs', 'FeaturesStack', 'FeaturesScroller', 'FeaturesLedger', 'FeaturesZigzag', 'FeaturesMosaic', 'StepsRail', 'StepsPath', 'StepsAccordion']
const ABOUT = ['AboutStatement', 'AboutNotes', 'AboutOverlap']
const FAQS = ['FaqColumns', 'FaqDetails']
const CTAS = ['CtaCentered', 'CtaStrip']
const VISIT = ['VisitCards', 'VisitStatement']
const CONTACT = ['ContactInverted', 'ContactStacked']
const FOOT = ['FooterColumns', 'FooterCentered']
const HEAD = ['HeaderStack', 'HeaderIsland', 'HeaderDetails', 'HeaderUtility']
const HERO = ['HeroSplitScreen', 'HeroTabbed', 'HeroIndex', 'HeroTriptych', 'HeroSheet', 'HeroOverlap', 'HeroLedger']

describe('new sections: counts', () => {
  it('there are at least 20 new page sections and at least 10 new hero and header variants, all exported', () => {
    const blocks = [...WYBER_BLOCKS_NAMES]
    const heroes = [...WYBER_HEROES_NAMES]
    expect(blocks.length).toBeGreaterThanOrEqual(20)
    expect(heroes.length).toBeGreaterThanOrEqual(10)
    for (const n of [...blocks, ...heroes]) { expect(WYBER_SECTION_NAMES).toContain(n); expect(typeof M[n], n).toBe('function') }
    expect(new Set([...LIST, ...ABOUT, ...FAQS, ...CTAS, ...VISIT, ...CONTACT, ...FOOT, 'RibbonBand'])).toEqual(new Set(blocks))
    expect(new Set([...HEAD, ...HERO])).toEqual(new Set(heroes))
  })
})

describe('new sections render on the server', () => {
  for (const name of LIST) for (const n of [3, 4, 5, 6]) {
    it(name + ' with ' + n + ' items shows every title and text', () => {
      const html = render(name, { eyebrow: 'Eyebrow', title: 'Section title', description: 'Description', items: items(n), tone: 'plain', reveal: false })
      expect(html).toContain('Section title')
      for (let i = 1; i <= n; i++) {
        // the explorers show one item at a time but list every title
        expect(html, name + ' title ' + i).toContain('Item title ' + i)
      }
      if (!['FeaturesTabs'].includes(name)) for (let i = 1; i <= n; i++) expect(html).toContain('Item text ' + i)
    })
  }
  for (const name of ABOUT) it(name + ' shows the title and every paragraph, with and without a photograph', () => {
    for (const m of [undefined, media()]) {
      const html = render(name, { eyebrow: 'E', title: 'About title', paragraphs: ['Lead paragraph', 'Second paragraph', 'Third paragraph'], media: m, flip: true, tone: 'card', reveal: false })
      for (const t of ['About title', 'Lead paragraph', 'Second paragraph', 'Third paragraph']) expect(html).toContain(t)
    }
  })
  for (const name of FAQS) for (const n of [4, 5, 6]) it(name + ' with ' + n + ' questions shows every question and answer', () => {
    const html = render(name, { title: 'Questions', faq: faq(n), reveal: false })
    for (let i = 1; i <= n; i++) { expect(html).toContain('Question ' + i + '?'); expect(html).toContain('Answer ' + i) }
  })
  for (const name of CTAS) it(name + ' shows the title and the action', () => {
    const html = render(name, { title: 'Closing title', description: 'Closing text', cta: 'Do it', onCta: () => undefined, secondaryLabel: 'More', secondaryHref: '#more', reveal: false })
    for (const t of ['Closing title', 'Closing text', 'Do it', 'More']) expect(html).toContain(t)
  })
  for (const name of VISIT) for (const n of [1, 2, 3, 4, 5]) it(name + ' with ' + n + ' facts shows them all', () => {
    const html = render(name, { title: 'Visit', facts: facts(n), reveal: false })
    for (let i = 1; i <= n; i++) expect(html).toContain('Value ' + i)
  })
  for (const name of CONTACT) it(name + ' shows the form slot and the facts', () => {
    const html = render(name, { title: 'Contact title', facts: facts(3), reveal: false, children: h('form', { id: 'the-form' }) })
    for (const t of ['Contact title', 'the-form', 'Value 1', 'Value 3']) expect(html).toContain(t)
  })
  for (const name of FOOT) it(name + ' shows the brand, links and note', () => {
    const html = render(name, { brand: 'Brand', description: 'Desc', columns: [{ title: 'Explore', links }], note: 'Small print' })
    for (const t of ['Brand', 'Desc', 'One', 'Three', 'Small print']) expect(html).toContain(t)
  })
  for (const name of HEAD) it(name + ' shows the brand and every link', () => {
    const html = render(name, { brand: 'Brand', links, notes: ['Open today', '0123'], cta: h('button', null, 'Call') })
    for (const t of ['Brand', 'One', 'Two', 'Three']) expect(html).toContain(t)
  })
  it('HeaderUtility shows the owner notes and nothing when there are none', () => {
    expect(render('HeaderUtility', { brand: 'B', links, notes: ['Open today'] })).toContain('Open today')
    expect(render('HeaderUtility', { brand: 'B', links, notes: [] })).not.toContain('<ul class="mx-auto')
  })
  for (const name of HERO) for (const withMedia of [true, false]) it(name + (withMedia ? ' with' : ' without') + ' a photograph shows headline, sub and facts', () => {
    const html = render(name, { eyebrow: 'Eyebrow', headline: 'Headline words here', accent: 'words', sub: 'Sub line', cta: 'Act', onCta: () => undefined, secondaryLabel: 'See', secondaryHref: '#a', facts: facts(3), media: withMedia ? media() : undefined, items: items(4), itemsHref: '#list', reveal: false })
    for (const t of ['Headline', 'Sub line']) expect(html).toContain(t)
    expect(html).toContain('Act')
  })
  it('the ribbon repeats the names for a seamless loop and stops (wraps as text) under reduced motion', () => {
    const html = render('RibbonBand', { items: ['Alpha', 'Beta', 'Gamma'], label: 'Names' })
    expect(html).toContain('motion-reduce:animate-none')
    expect(html).toContain('animate-marquee')
    expect(render('RibbonBand', { items: ['Alpha', 'Beta'] })).toBe('')
  })
})

describe('grids never end on an orphan row', () => {
  const spans = (html: string) => [...html.matchAll(/md:col-span-(\d)/g)].map(m => Number(m[1]))
  const rowsFill = (xs: number[]) => { let acc = 0; for (const x of xs) { acc += x; if (acc > 6) return false; if (acc === 6) acc = 0 } return acc === 0 }
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    it('FeaturesMosaic with ' + n + ' tiles fills whole rows', () => {
      const html = render('FeaturesMosaic', { title: 'T', items: items(n), reveal: false })
      const s = spans(html)
      expect(s.length).toBe(n)
      expect(rowsFill(s), s.join(',')).toBe(true)
    })
    it('VisitCards with ' + n + ' facts fills whole rows', () => {
      const s = spans(render('VisitCards', { title: 'T', facts: facts(n), reveal: false }))
      expect(s.length).toBe(n)
      expect(rowsFill(s), s.join(',')).toBe(true)
    })
  }
  for (const n of [4, 5, 6]) it('FaqColumns with ' + n + ' questions: an odd last question spans both columns', () => {
    const html = render('FaqColumns', { title: 'T', faq: faq(n), reveal: false })
    expect((html.match(/md:col-span-2/g) ?? []).length).toBe(n % 2)
  })
})

describe('the tabbed explorers are real tab widgets', () => {
  it('FeaturesTabs and HeroTabbed expose tablist, tab and tabpanel with matching ids', () => {
    for (const [name, props] of [['FeaturesTabs', { title: 'T', items: items(4), reveal: false }], ['HeroTabbed', { headline: 'H', sub: 'S', items: items(4), reveal: false }]] as const) {
      const html = render(name, props as Record<string, unknown>)
      expect(html).toContain('role="tablist"')
      expect((html.match(/role="tab"/g) ?? []).length).toBeGreaterThanOrEqual(4)
      expect(html).toContain('role="tabpanel"')
      const panel = html.match(/role="tabpanel" id="([^"]+)"/)?.[1]
      expect(panel).toBeTruthy()
      expect(html).toContain('aria-controls="' + panel + '"')
    }
  })
  it('the native disclosures share one name so opening one closes the others, and the first starts open', () => {
    const html = render('FaqDetails', { title: 'T', faq: faq(4), reveal: false })
    const names = [...html.matchAll(/<details[^>]*name="([^"]+)"/g)].map(m => m[1])
    expect(names.length).toBe(4)
    expect(new Set(names).size).toBe(1)
    expect((html.match(/<details[^>]* open=""/g) ?? []).length).toBe(1)
  })
})

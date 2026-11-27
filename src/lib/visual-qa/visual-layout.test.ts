// The visual gate in the normal test run: real generated pages in the installed Chrome. This is the fast subset (every section
// composition, one SaaS product, one web app); the full matrix is `npm run qa:visual`.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer-core'
import { WYBER_SECTIONS_SOURCE } from '../wyber-sections'
import { appCases, coverageReport, saasCases, websiteCases, allCases, type QaCase } from './cases'
import { findChrome, launch, measure, openPage, defaultConcurrency } from './run'
import { groupFindings, runSuite } from './suite'

const chrome = findChrome()
// CI must never pass because the browser was missing
if (!chrome && process.env.CI) throw new Error('visual QA needs Chrome in CI (set CHROME_PATH)')
const skip = !chrome || process.env.SKIP_VISUAL_QA === '1'

const WANTED = [
  'HeaderBar', 'HeaderCentered', 'HeaderIndex', 'HeroSplitPhoto', 'HeroEditorial', 'HeroCentered', 'HeroFullBleed', 'HeroMinimal',
  'FeaturesIndex', 'FeaturesCards', 'FeaturesBento', 'FeaturesGrid', 'StepsColumns', 'StepsTimeline', 'AboutSplit', 'AboutBand',
  'FaqSplit', 'FaqBoxed', 'CtaBand', 'CtaSplit', 'CtaPhoto', 'PhotoBand', 'ContactSplit', 'ContactCentered', 'VisitList',
  'FooterGiant', 'FooterSlim', 'FactTicker',
]

/** The smallest set of matrix pages that still shows every composition, preferring long copy (where layouts break). */
function smallestCover(cases: QaCase[]): QaCase[] {
  const left = new Set(WANTED)
  const picked: QaCase[] = []
  const score = (c: QaCase) => c.sections.filter(s => left.has(s)).length + (c.id.endsWith('-long') ? 0.5 : 0)
  while (left.size) {
    const best = [...cases].sort((a, b) => score(b) - score(a))[0]
    if (!best.sections.some(s => left.has(s))) break
    picked.push(best)
    best.sections.forEach(s => left.delete(s))
  }
  return picked
}

const report = (findings: Parameters<typeof groupFindings>[0]) => groupFindings(findings).map(g => `${g.check} ${g.component} ${g.el} "${g.sample.text.slice(0, 40)}" ${g.detail} [${g.widths.join(',')}] ${g.cases[0]} (${g.sample.state})`)

describe('visual QA matrix', () => {
  it('covers every direction, section composition, font pairing and colour family on at least 40 briefs', () => {
    const cases = allCases()
    const coverage = coverageReport(cases)
    expect(cases.filter(c => c.id.startsWith('web-')).length).toBeGreaterThanOrEqual(40)
    expect(WANTED.filter(n => !coverage.sections.includes(n))).toEqual([])
    // long business names are where headers break, so every header must meet one
    for (const header of ['HeaderBar', 'HeaderCentered', 'HeaderIndex']) expect(cases.some(c => c.id.endsWith('-long') && c.sections.includes(header)), header + ' with long copy').toBe(true)
    expect(coverage.missingDirections).toEqual([])
    expect(coverage.missingPairings).toEqual([])
    expect(coverage.missingFamilies).toEqual([])
    expect(smallestCover(websiteCases()).flatMap(c => c.sections)).toEqual(expect.arrayContaining(WANTED))
  })
})

describe.skipIf(skip)('visual QA in Chrome', () => {
  let browser: Browser
  beforeAll(async () => { browser = await launch() }, 60000)
  afterAll(async () => { await browser?.close() })

  const checksOn = async (body: string, width: number) => {
    const { page, close } = await openPage(browser, `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font:16px/1.5 sans-serif;background:#fff;color:#111}</style></head><body><div id="root">${body}</div></body></html>`, width)
    try { return await measure(page, { caseId: 'fixture', width }) } finally { await close() }
  }

  // a gate that never fires proves nothing: every check has to catch a planted fault
  it('catches each kind of planted fault', async () => {
    const found = await checksOn(`
      <header><a href="#tap" style="display:block;width:50px">What we do here</a></header>
      <main>
        <section id="cover" style="position:relative;height:80px"><h2 style="margin:0;padding-top:20px">Covered heading</h2><span style="position:absolute;left:0;top:20px;width:40px;height:40px;background:#c00"></span></section>
        <section id="overlap" style="height:60px"><p style="margin:0">First line of text here</p><p style="margin:-20px 0 0">Second line on top of it</p></section>
        <section id="wide"><div style="width:600px;border:1px solid #000">too wide for a phone</div></section>
        <section id="clip"><div style="width:90px;overflow:hidden;white-space:nowrap">this sentence is cut off by its box</div></section>
        <section id="tiny"><p style="font-size:10px">ten pixel text</p></section>
        <section id="faint"><p style="color:#bbb">pale grey on white</p></section>
        <section id="tap"><button style="height:24px;width:60px">small</button></section>
        <section id="grid"><div style="display:grid;grid-template-columns:repeat(3,100px);gap:8px">${'<div>cell</div>'.repeat(5)}</div></section>
        <section id="img"><img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'/%3E"></section>
        <section id="word" style="width:150px"><h2 style="font-size:40px;overflow-wrap:anywhere">Rehabilitation</h2></section>
        <section id="wrap"><div style="position:relative"><div data-sv="" style="transform:translateY(0)"><span style="position:absolute;right:0">badge</span>body</div></div></section>
      </main>`, 390)
    const checks = new Set(found.map(f => f.check))
    for (const check of ['text-covered', 'text-overlap', 'horizontal-overflow', 'wider-than-viewport', 'text-clipped', 'small-text', 'low-contrast', 'tap-target', 'orphan-row', 'image-no-size', 'word-broken', 'absolute-in-transformed', 'header-crowded']) expect(checks, check).toContain(check)
  }, 60000)

  it('stays quiet on a sound page', async () => {
    const found = await checksOn(`
      <main><section id="ok" style="padding:24px"><h1>A sound page</h1><p>Ordinary running text with <a href="#ok">a link inside a sentence</a> in it.</p>
      <button style="min-height:44px;min-width:120px">Send</button>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${'<div>cell</div>'.repeat(4)}</div>
      <img alt="" width="80" height="60" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'/%3E"></section></main>`, 390)
    expect(report(found)).toEqual([])
  }, 60000)

  // 25 Nov 2026: step numbers covered the first letters of headings on a live law-firm site
  it('catches the step badge bug when it is put back', async () => {
    const badge = /\n\s*\{\/\* Outside the reveal wrapper on purpose[^\n]*\n(\s*<span aria-hidden="true" className="absolute left-0 top-0[^\n]*\n)(\s*<Rv on=\{reveal\} y=\{12\}>\n)/
    const broken = WYBER_SECTIONS_SOURCE.replace(badge, (_, span: string, open: string) => '\n' + open + span)
    expect(broken).not.toBe(WYBER_SECTIONS_SOURCE)
    const law = websiteCases().find(c => c.sections.includes('StepsTimeline'))!
    const result = await runSuite(browser, [law], { widths: [1440], overrides: { 'src/wyber-sections.tsx': broken } })
    expect(result.errors).toEqual([])
    const steps = result.findings.filter(f => f.where.startsWith('section#') && (f.check === 'absolute-in-transformed' || f.check === 'text-covered'))
    expect(steps.map(f => f.check)).toContain('absolute-in-transformed')
    expect(steps.map(f => f.check)).toContain('text-covered')
  }, 120000)

  it('finds no layout fault in any section composition, at phone, tablet and desktop widths', async () => {
    const cases = smallestCover(websiteCases())
    const result = await runSuite(browser, cases, { states: true, concurrency: defaultConcurrency(), step: 0.45, fallback: c => c === cases[0] })
    expect(result.errors).toEqual([])
    expect(report(result.findings)).toEqual([])
  }, 400000)

  // the full link row appears at 1024px, where a long name, the links and the button have the least room
  it('keeps every header uncrushed on a small laptop with a long business name', async () => {
    const cases = ['HeaderBar', 'HeaderCentered', 'HeaderIndex'].map(h => websiteCases().find(c => c.id.endsWith('-long') && c.sections.includes(h))!)
    const result = await runSuite(browser, cases, { widths: [1024], concurrency: defaultConcurrency(), step: 1 })
    expect(result.errors).toEqual([])
    expect(report(result.findings)).toEqual([])
  }, 200000)

  it('finds no layout fault in a SaaS product and a web app', async () => {
    const result = await runSuite(browser, [saasCases()[0], appCases()[0]], { widths: [390, 1440], states: true, concurrency: defaultConcurrency(), step: 0.6 })
    expect(result.errors).toEqual([])
    expect(report(result.findings)).toEqual([])
  }, 400000)
})

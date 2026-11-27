// Runs cases through every width and state and returns the findings.
import type { Browser, Page } from 'puppeteer-core'
import { filesToHtml, type FileMap } from './render'
import { HEIGHTS, WIDTHS, measure, openPage, pool, sleep, judgeContrast, type Finding, type MeasureOptions } from './run'
import type { QaCase } from './cases'

export interface SuiteOptions {
  widths?: readonly number[]
  concurrency?: number
  step?: number
  /** Also run each website the way a browser without scroll-driven animations shows it. */
  fallback?: (c: QaCase) => boolean
  /** Open app screens, menus and the second language. */
  states?: boolean
  overrides?: FileMap
  onCase?: (id: string, width: number, findings: number) => void
}

export interface SuiteResult { findings: Finding[]; errors: string[]; pages: number }

const click = (page: Page, selector: string, text: string) => page.evaluate((s, t) => {
  const hit = [...document.querySelectorAll<HTMLElement>(s)].find(e => (e.textContent || e.getAttribute('aria-label') || '').trim().includes(t) && e.getClientRects().length > 0)
  hit?.click()
  return Boolean(hit)
}, selector, text)

/** The checks that make sense while something is open over the page. */
async function openState(page: Page, base: MeasureOptions, state: string): Promise<Finding[]> {
  const names = ['overflow', 'textFit', 'crowdedHeader', 'smallText', 'images', ...(base.width < 640 ? ['tapTargets'] : [])]
  const out: Finding[] = []
  for (const name of names) {
    const raw = await page.evaluate(n => (window as unknown as { __wqa: Record<string, () => Promise<Finding[]>> }).__wqa[n](), name)
    for (const f of raw) out.push({ ...f, width: base.width, state, caseId: base.caseId })
  }
  const pairs = await page.evaluate(() => (window as unknown as { __wqa: Record<string, () => never[]> }).__wqa.colourPairs())
  for (const f of judgeContrast(pairs)) out.push({ ...f, width: base.width, state, caseId: base.caseId })
  return out
}

async function appScreens(page: Page, base: MeasureOptions): Promise<Finding[]> {
  const out: Finding[] = []
  out.push(...await openState(page, base, 'setup dialog'))
  await click(page, 'button', 'Skip for now')
  await sleep(400)
  out.push(...await measure(page, { ...base, state: 'home empty' }))
  await click(page, 'button', 'Load sample data')
  await sleep(600)
  out.push(...await measure(page, { ...base, state: 'home' }))
  // the sidebar on a desk; the tab bar plus its "more" drawer below that
  const labels: string[] = await page.evaluate(() => {
    const nav = [...document.querySelectorAll('aside button, aside a')].map(e => (e.textContent || e.getAttribute('aria-label') || '').trim())
    return [...new Set(nav.filter(Boolean))]
  })
  const wide = base.width >= 1024
  const go = async (label: string) => {
    if (wide) return click(page, 'aside button, aside a', label)
    if (await click(page, 'nav button, nav a', label)) return true
    if (!await click(page, 'nav button, nav a', 'More')) return false
    await sleep(350)
    return click(page, '[role=dialog] button', label)
  }
  let formSeen = false
  for (const label of labels.filter(l => l !== 'Home')) {
    if (!await go(label)) continue
    await sleep(450)
    out.push(...await measure(page, { ...base, state: 'screen ' + label }))
    if (!formSeen && await page.$('button[aria-label^="Edit"]')) {
      formSeen = true
      await page.evaluate(() => (document.querySelector('button[aria-label^="Edit"]') as HTMLElement).click())
      await sleep(500)
      out.push(...await openState(page, base, 'edit form on ' + label))
      await page.keyboard.press('Escape')
      await sleep(350)
    }
  }
  return out
}

async function runOne(browser: Browser, c: QaCase, html: string, width: number, o: SuiteOptions, noScrollTimeline: boolean): Promise<{ findings: Finding[]; errors: string[]; pages: number }> {
  const caseId = c.id + (noScrollTimeline ? ' (no scroll timeline)' : '')
  const base: MeasureOptions = { caseId, width, step: o.step, settle: noScrollTimeline ? 120 : 0 }
  const findings: Finding[] = []
  const errors: string[] = []
  let pages = 0
  const visit = async (hash: string, run: (page: Page) => Promise<Finding[]>) => {
    const { page, errors: pageErrors, close } = await openPage(browser, html, width, { hash, noScrollTimeline })
    try {
      const rendered = await page.evaluate(() => (document.getElementById('root')?.textContent ?? '').length)
      if (rendered < 40 || await page.evaluate(() => document.getElementById('root')!.textContent!.includes('Something went wrong'))) errors.push(`${caseId} @${width}: the page did not render`)
      findings.push(...await run(page))
      pages++
    } finally {
      errors.push(...pageErrors.map(e => `${caseId} @${width}: ${e}`))
      await close()
    }
  }
  if (c.kind === 'app') {
    await visit('', page => appScreens(page, base))
  } else {
    await visit('', async page => {
      const out = await measure(page, base)
      if (o.states && width < 768 && await page.$('button[aria-label=Menu]')) {
        await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); (document.querySelector('button[aria-label=Menu]') as HTMLElement).click() })
        await sleep(450)
        out.push(...await openState(page, base, 'menu open'))
      }
      if (c.hindi && o.states) {
        await page.evaluate(() => (document.querySelector('button[aria-label=Menu][aria-expanded=true]') as HTMLElement | null)?.click())
        await sleep(300)
        if (await click(page, 'button[aria-pressed]', 'हिन्दी')) { await sleep(900); out.push(...await measure(page, { ...base, state: 'hindi' })) }
      }
      return out
    })
    if (c.kind === 'saas' && o.states) {
      await visit('#/app', page => appScreens(page, base))
      await visit('#/terms', page => measure(page, { ...base, state: 'terms' }))
    }
  }
  return { findings, errors, pages }
}

export async function runSuite(browser: Browser, cases: QaCase[], o: SuiteOptions = {}): Promise<SuiteResult> {
  const widths = o.widths ?? WIDTHS
  const html = new Map<string, string>()
  await pool(cases, 4, async c => { html.set(c.id, await filesToHtml(await c.build(), o.overrides)) })
  const jobs = cases.flatMap(c => widths.flatMap(width => [{ c, width, fallback: false }, ...(o.fallback?.(c) ? [{ c, width, fallback: true }] : [])]))
  const result: SuiteResult = { findings: [], errors: [], pages: 0 }
  await pool(jobs, o.concurrency ?? 3, async ({ c, width, fallback }) => {
    try {
      const r = await runOne(browser, c, html.get(c.id)!, width, o, fallback)
      result.findings.push(...r.findings)
      result.errors.push(...r.errors)
      result.pages += r.pages
      o.onCase?.(c.id, width, r.findings.length)
    } catch (e) {
      result.errors.push(`${c.id} @${width}: ${(e as Error).message}`)
    }
  })
  return result
}

export { HEIGHTS }

export interface Group { check: string; component: string; el: string; detail: string; count: number; cases: string[]; widths: number[]; sample: Finding }

/** The same fault on many pages is one defect: group by check, element and place. */
export function groupFindings(findings: Finding[]): Group[] {
  const groups = new Map<string, Group>()
  for (const f of findings) {
    const key = [f.check, f.el, f.where.replace(/#.*/, '')].join('|')
    let g = groups.get(key)
    if (!g) groups.set(key, (g = { check: f.check, component: f.where, el: f.el, detail: f.detail, count: 0, cases: [], widths: [], sample: f }))
    g.count++
    if (!g.cases.includes(f.caseId)) g.cases.push(f.caseId)
    if (!g.widths.includes(f.width)) g.widths.push(f.width)
  }
  return [...groups.values()].sort((a, b) => a.check.localeCompare(b.check) || b.count - a.count)
}

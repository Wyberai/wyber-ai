// Opens a rendered page in the Chrome already installed on the machine and measures it: at rest, at every step of a full scroll
// (so scroll-driven reveals are caught half-way as well as finished), and with menus and answers opened.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { contrastRatio } from '../color-contrast'

export const WIDTHS = [390, 768, 1440] as const
export const HEIGHTS: Record<number, number> = { 390: 760, 768: 1000, 1440: 900 }

export interface Finding { check: string; where: string; el: string; text: string; detail: string; width: number; state: string; caseId: string }

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
]

export const findChrome = (): string | undefined => CHROMES.find(p => p && fs.existsSync(p)) as string | undefined

export async function launch(): Promise<Browser> {
  const executablePath = findChrome()
  if (!executablePath) throw new Error('Chrome not found. Set CHROME_PATH.')
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--font-render-hinting=none'] })
}

const CHECKS_SOURCE = fs.readFileSync(path.join(process.cwd(), 'src/lib/visual-qa/page-checks.js'), 'utf8')
const FONT_HOSTS = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|api\.fontshare\.com|cdn\.fontshare\.com)\//
// Real fonts change every measurement, so they are fetched once and reused. Everything else off the page is refused.
const fontCache = new Map<string, Promise<{ body: Buffer; type: string } | null>>()
export const fontFailures = new Set<string>()

function font(url: string, ua: string) {
  let hit = fontCache.get(url)
  if (!hit) {
    hit = (async () => {
      try {
        const res = await fetch(url, { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error(String(res.status))
        return { body: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') ?? 'application/octet-stream' }
      } catch { fontFailures.add(url); return null }
    })()
    fontCache.set(url, hit)
  }
  return hit
}

export async function openPage(browser: Browser, html: string, width: number, opts: { hash?: string; noScrollTimeline?: boolean; reducedMotion?: boolean } = {}): Promise<{ page: Page; errors: string[]; close: () => Promise<void> }> {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String((e as Error).message ?? e)))
  await page.setViewport({ width, height: HEIGHTS[width] ?? 900, deviceScaleFactor: 1, hasTouch: width < 768, isMobile: width < 768 })
  const ua = await browser.userAgent()
  await page.setRequestInterception(true)
  page.on('request', async r => {
    const url = r.url()
    if (url.startsWith('http://wqa.test/')) return void r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: html })
    if (url.startsWith('data:')) return void r.continue()
    if (FONT_HOSTS.test(url)) {
      const f = await font(url, ua)
      return void (f ? r.respond({ status: 200, contentType: f.type, headers: { 'access-control-allow-origin': '*' }, body: f.body }) : r.abort())
    }
    return void r.abort()
  })
  // browsers without scroll-driven animations take the framer-motion path
  if (opts.noScrollTimeline) await page.evaluateOnNewDocument(() => { const real = CSS.supports.bind(CSS); CSS.supports = ((a: string, b?: string) => (String(a).includes('animation-timeline') ? false : b === undefined ? real(a) : real(a, b))) as typeof CSS.supports })
  if (opts.reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto('http://wqa.test/' + (opts.hash ?? ''), { waitUntil: 'load' })
  // a colour half-way through a hover or header transition is not a state anyone reads; scroll reveals are animations and still run
  await page.addStyleTag({ content: '*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; }' })
  await page.evaluate(() => document.fonts.ready.then(() => true))
  await sleep(250)
  await page.evaluate(CHECKS_SOURCE)
  return { page, errors, close: () => context.close() }
}

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const frames = (page: Page) => page.evaluate(() => new Promise<boolean>(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))))

type Raw = Omit<Finding, 'width' | 'state' | 'caseId'> & { fg?: string; bg?: string; size?: number; weight?: number }
const call = (page: Page, name: string) => page.evaluate(n => (window as unknown as { __wqa: Record<string, () => unknown> }).__wqa[n](), name) as Promise<Raw[]>

/** WCAG AA: 4.5 for running text, 3 for large text. The maths is the platform's own (color-contrast.ts). */
export function judgeContrast(pairs: Raw[]): Raw[] {
  const out: Raw[] = []
  for (const p of pairs) {
    const large = (p.size ?? 0) >= 24 || ((p.size ?? 0) >= 18.6 && (p.weight ?? 400) >= 700)
    const need = large ? 3 : 4.5
    const got = contrastRatio(p.fg!, p.bg!)
    if (got < need - 0.05) out.push({ check: 'low-contrast', where: p.where, el: p.el, text: p.text, detail: `${got.toFixed(2)}:1 (${p.fg} on ${p.bg}), needs ${need}:1` })
  }
  return out
}

export interface MeasureOptions {
  caseId: string
  width: number
  state?: string
  /** Fraction of a screen moved between measurements. */
  step?: number
  /** Extra wait at each stop, for time-based (framer-motion) reveals. */
  settle?: number
  skip?: string[]
}

/** The whole set of checks on the page as it is now. */
export async function measure(page: Page, o: MeasureOptions): Promise<Finding[]> {
  const found = new Map<string, Finding>()
  const state = o.state ?? 'page'
  const add = (list: Raw[], at: string) => {
    for (const f of list) {
      if (o.skip?.includes(f.check)) continue
      const key = [f.check, f.where, f.el, f.text].join('|')
      if (!found.has(key)) found.set(key, { ...f, width: o.width, state: at, caseId: o.caseId })
    }
  }
  const height = HEIGHTS[o.width] ?? 900
  // 1. a full scroll, measuring on the way: most stops catch some block half-revealed
  const step = Math.max(80, Math.round(height * (o.step ?? 0.37)))
  let y = 0
  for (let i = 0; i < 200; i++) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y)
    await frames(page)
    if (o.settle) await sleep(o.settle)
    add(await call(page, 'covered'), `${state} @${y}px`)
    add(await call(page, 'transformedWrappers'), `${state} @${y}px`)
    add(judgeContrast(await call(page, 'colourPairs')), state)
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    if (y >= max) break
    y = Math.min(max, y + step)
  }
  // 2. the very bottom, after the page has come to rest
  await sleep(700)
  add(await call(page, 'covered'), `${state} bottom`)
  // 3. reveals must finish
  add(await call(page, 'stuckReveals'), state)
  // 4. at rest, with everything revealed
  await sleep(150)
  for (const name of ['overflow', 'textFit', 'crowdedHeader', 'smallText', 'orphanRows', ...(o.width < 640 ? ['tapTargets'] : [])]) add(await call(page, name), state)
  add(await call(page, 'covered'), `${state} top`)
  add(await call(page, 'images'), state)
  return [...found.values()]
}

/** Run jobs a few at a time. */
export async function pool<T, R>(items: T[], size: number, job: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await job(items[i], i) }
  }))
  return out
}

export const defaultConcurrency = () => Math.max(2, Math.min(5, Math.floor(os.cpus().length / 2)))

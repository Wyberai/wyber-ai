// Real-browser check of a published WyberAi app. Opens the public page in installed Chrome, finds the sandboxed app frame, and
// measures what a person would meet: console errors, horizontal overflow at three widths, accessibility violations (axe-core,
// WCAG 2.x A and AA), a walk through the navigation, whether launch-ready signals are on screen, and design-slop signs in the
// computed styles (not just the source). Writes JSON and PNGs and prints a scored summary.
//
//   node scripts/verify-app.mjs https://wyberai.com/app/<slug> [--out <dir>] [--chrome <path>] [--setup]
//
// --setup (opt in): when the app opens on a setup or PIN screen, fill it with throwaway values ("Test Shop", "Tester", PIN 1234)
// and press its main button, then press "Load sample data" once if the app offers it. Without it the check never types or submits.
//
// Uses puppeteer-core and axe-core that are already in node_modules, and the Chrome or Edge already on the machine: nothing is
// downloaded. Read-only: it never types into or submits forms. Scoring is explained in docs/webapp-95-spec.md section 9.
// Design-slop signs are the ones listed by unslop (Damir Sokolovsky, CC BY 4.0, https://github.com/heydamir/unslop).

import puppeteer from 'puppeteer-core'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const url = args.find(a => /^https?:\/\//.test(a))
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback }
if (!url) { console.error('usage: node scripts/verify-app.mjs <url> [--out dir] [--chrome path]'); process.exit(2) }

const SETUP = args.includes('--setup')
const outDir = resolve(opt('--out', 'verify-out'))
mkdirSync(outDir, { recursive: true })
const slug = url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '')

const CHROME_CANDIDATES = [
  opt('--chrome'), process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const executablePath = CHROME_CANDIDATES.find(p => existsSync(p))
if (!executablePath) { console.error('No Chrome or Edge found. Pass --chrome <path>.'); process.exit(2) }

const axeSource = readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8')
const VIEWPORTS = [{ name: 'phone', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1280, height: 800 }]
const sleep = ms => new Promise(r => setTimeout(r, ms))
// Platform telemetry and aborted requests are not the app's errors.
const NOISE = /sentry|csp-report|ingest.|analytics|beacon|googletagmanager|metrics|collect|Failed to load resource|favicon/i
const SIGNAL_RES = {
  browserOnlyNote: /(saved|stored|kept) (in|on) (this|your) (browser|device)|browser only/,
  demoData: /sample data|demo data/,
  importMention: /import/, exportMention: /export/, privacyMention: /privacy/,
  printMention: /print/, historyMention: /history|activity log|audit/,
}
const signalsOf = t => Object.fromEntries(Object.entries(SIGNAL_RES).map(([k, re]) => [k, re.test(t.toLowerCase())]))
const seenSignals = {}
const mergeSignals = o => { for (const [k, v] of Object.entries(o)) seenSignals[k] = seenSignals[k] || v }

// Runs inside the app frame. Returns plain data only.
function measureInFrame() {
  const doc = document
  const text = (doc.body?.innerText || '').trim()
  const overflowX = doc.documentElement.scrollWidth - doc.documentElement.clientWidth
  const all = Array.from(doc.querySelectorAll('body *'))
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const interactive = all.filter(e => e.matches('a[href],button,input,select,textarea,[role=button],[role=tab]') && visible(e))
  const unlabeled = interactive.filter(e => {
    if (e.matches('input,select,textarea')) return !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.getAttribute('placeholder')
    return !(e.innerText || '').trim() && !e.getAttribute('aria-label') && !e.getAttribute('title') && !e.querySelector('img[alt]:not([alt=""])')
  }).length
  const smallTargets = interactive.filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24 }).length
  const slop = { gradients: 0, gradientText: 0, glows: 0, heavyWeight: 0, upperTracked: 0, transitionAll: 0, infiniteAnim: 0, emoji: 0, fonts: new Set() }
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u2728\u26A0\u2B50\u2764]/u
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) { if (emojiRe.test(n.nodeValue || '')) slop.emoji++ }
  for (const el of all) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    if (/gradient\(/.test(s.backgroundImage) && !el.matches('[class*=skeleton],[class*=shimmer]')) slop.gradients++
    if ((s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') && /gradient\(/.test(s.backgroundImage)) slop.gradientText++
    const sh = s.boxShadow
    if (sh && sh !== 'none') {
      for (const part of sh.split(/,(?![^(]*\))/)) {
        const m = part.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); const nums = part.match(/-?\d+(\.\d+)?px/g) || []
        const blur = nums.length >= 3 ? parseFloat(nums[2]) : 0
        if (m && blur >= 12) { const [r, g, b] = [m[1], m[2], m[3]].map(Number); if (Math.max(r, g, b) - Math.min(r, g, b) > 40) slop.glows++ }
      }
    }
    if (parseInt(s.fontWeight, 10) >= 800 && (el.innerText || '').trim()) slop.heavyWeight++
    if (s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) / (parseFloat(s.fontSize) || 16) >= 0.06 && (el.childElementCount === 0) && (el.innerText || '').trim()) slop.upperTracked++
    if (/\ball\b/.test(s.transitionProperty) && parseFloat(s.transitionDuration) > 0) slop.transitionAll++
    if (s.animationIterationCount === 'infinite' && s.animationName !== 'none' && !/skeleton|pulse|spin|loading/i.test(String(el.className) + s.animationName)) slop.infiniteAnim++
    if ((el.innerText || '').trim()) slop.fonts.add((s.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim())
  }
  const t = text.toLowerCase()
  const signals = {
    browserOnlyNote: /(saved|stored|kept) (in|on) (this|your) (browser|device)|browser only/.test(t),
    demoData: /sample data|demo data/.test(t),
    importMention: /\bimport\b/.test(t),
    exportMention: /\bexport\b/.test(t),
    privacyMention: /\bprivacy\b/.test(t),
    printMention: /\bprint\b/.test(t),
    historyMention: /\bhistory\b|activity log|audit/.test(t),
  }
  return {
    textLength: text.length, headline: (doc.querySelector('h1,h2')?.textContent || '').trim().slice(0, 80), title: doc.title,
    overflowX, interactive: interactive.length, unlabeled, smallTargets,
    slop: { ...slop, fonts: Array.from(slop.fonts).slice(0, 8) }, signals,
    storageKeys: (() => { try { return Object.keys(localStorage).length } catch { return -1 } })(),
  }
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
const report = { url, checkedAt: new Date().toISOString(), viewports: {}, axe: null, nav: null, errors: [], notes: [] }

async function passGate(frame) {
  // Fill visible empty inputs with throwaway values, then press the first button that reads like "open / start / continue / save".
  const inputs = await frame.$$('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file])')
  let filled = 0
  for (const h of inputs) {
    const info = await h.evaluate(e => { const r = e.getBoundingClientRect(); const lab = (e.labels && e.labels[0] ? e.labels[0].innerText : '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || ''); return { visible: r.width > 0 && r.height > 0, value: e.value, type: e.type, max: e.maxLength, lab: lab.toLowerCase() } })
    if (!info.visible || info.value) continue
    const pin = info.type === 'password' || /pin|passcode/.test(info.lab) || (info.max > 0 && info.max <= 6)
    try { await h.evaluate(e => e.focus()); await h.type(pin ? '1234' : /name|shop|business/.test(info.lab) ? 'Test Shop' : 'Tester'); filled++ } catch { /* ignore */ }
  }
  if (filled === 0) return false
  const clicked = await frame.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /open|start|continue|save|create|get started|enter|unlock|sign in|log in/i.test(x.innerText) && x.getBoundingClientRect().width > 0); if (b) { b.click(); return true } return false })
  await sleep(800)
  return clicked
}
let demoLoaded = false
async function loadDemo(frame) {
  if (demoLoaded) return
  const ok = await frame.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /load (the )?(sample|demo) data/i.test(x.innerText) && x.getBoundingClientRect().width > 0); if (b) { b.click(); return true } return false })
  if (ok) { demoLoaded = true; await sleep(800) }
}

async function openApp(viewport) {
  const page = await browser.newPage()
  await page.setViewport({ width: viewport.width, height: viewport.height })
  const errors = []
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).slice(0, 160)))
  page.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)) })
  page.on('requestfailed', r => { const u = r.url(); const why = r.failure()?.errorText || ''; if (/ERR_ABORTED/.test(why) || NOISE.test(u)) return; errors.push('requestfailed: ' + u.slice(0, 120) + ' ' + why) })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1500)
  const frames = page.frames().filter(f => f !== page.mainFrame())
  let frame = null
  for (const f of frames) { try { const len = await f.evaluate(() => (document.body?.innerText || '').length); if (len > 0) { frame = f; break } } catch { /* detached */ } }
  if (!frame) { report.notes.push(`${viewport.name}: no app frame found; measured the page itself`); frame = page.mainFrame() }
  if (SETUP) { const passed = await passGate(frame); if (passed) report.notes.push(`${viewport.name}: passed a setup or PIN screen with throwaway values`); await loadDemo(frame) }
  return { page, frame, errors }
}

try {
  for (const vp of VIEWPORTS) {
    const { page, frame, errors } = await openApp(vp)
    const m = await frame.evaluate(measureInFrame)
    await page.screenshot({ path: join(outDir, `${slug}-${vp.name}.png`) })
    report.viewports[vp.name] = { ...m, errors }
    mergeSignals(m.signals)
    if (vp.name === 'desktop') {
      // Accessibility on the desktop render.
      await frame.evaluate(axeSource)
      const axeResult = await frame.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
        return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }))
      })
      report.axe = axeResult
    }
    if (vp.name === 'phone') {
      // Walk the navigation (clicks only; never types or submits).
      const handles = await frame.evaluateHandle(() => {
        const sel = 'nav a, nav button, [role=tab], aside a, aside button, footer button, [class*=bottom] button, [class*=tab] button'
        const seen = new Set(); const out = []
        for (const el of document.querySelectorAll(sel)) {
          const label = ((el.innerText || el.getAttribute('aria-label') || '') + '').trim().slice(0, 30)
          const r = el.getBoundingClientRect()
          if (!label || r.width === 0 || seen.has(label)) continue
          seen.add(label); out.push(el)
        }
        return out.slice(0, 8)
      })
      const props = await handles.getProperties()
      const steps = []
      for (const h of props.values()) {
        const el = h.asElement(); if (!el) continue
        const label = await el.evaluate(e => ((e.innerText || e.getAttribute('aria-label') || '') + '').trim().slice(0, 30))
        const before = errors.length
        // A real person taps with a finger: is anything from the page wrapper (report button, "Built with" badge) sitting on top of it?
        let covered = null
        try {
          const box = await el.boundingBox()
          if (box) covered = await page.evaluate((x, y) => { const t = document.elementFromPoint(x, y); return t && t.tagName !== 'IFRAME' ? (t.tagName + ' "' + ((t.innerText || t.textContent || '').trim().slice(0, 24)) + '"') : null }, box.x + box.width / 2, box.y + box.height / 2)
        } catch { /* ignore */ }
        try { await el.evaluate(e => e.click()); await sleep(500) } catch (e) { steps.push({ label, ok: false, note: 'click failed: ' + String(e.message).slice(0, 60) }); continue }
        const info = await frame.evaluate(() => ({ text: (document.body?.innerText || '').trim(), head: (document.querySelector('h1,h2')?.textContent || '').trim().slice(0, 50) }))
        mergeSignals(signalsOf(info.text))
        steps.push({ label: label.replace(/s+/g, ' '), ok: info.text.length > 40 && errors.length === before && !covered, textLength: info.text.length, heading: info.head, newErrors: errors.length - before, ...(covered ? { note: `covered by wrapper element ${covered}` } : {}) })
      }
      report.nav = steps
      const keysAfter = await frame.evaluate(() => { try { return Object.keys(localStorage).length } catch { return -1 } })
      await page.reload({ waitUntil: 'networkidle2' }); await sleep(1200)
      let keysReload = -2
      for (const f of page.frames().filter(f => f !== page.mainFrame())) { try { keysReload = await f.evaluate(() => Object.keys(localStorage).length); break } catch { /* ignore */ } }
      report.persistence = { keysBeforeReload: keysAfter, keysAfterReload: keysReload }
    }
    report.errors.push(...errors.map(e => `${vp.name}: ${e}`))
    await page.close()
  }
} finally {
  await browser.close()
}

// ── Scoring (100): explained in the spec ─────────────────────────────────────
const vps = Object.values(report.viewports)
const serious = (report.axe || []).filter(v => v.impact === 'serious' || v.impact === 'critical')
const minor = (report.axe || []).filter(v => v.impact === 'moderate' || v.impact === 'minor')
const sig = seenSignals
const sigKeys = ['browserOnlyNote', 'demoData', 'importMention', 'exportMention', 'privacyMention', 'printMention', 'historyMention']
const sigHit = sigKeys.filter(k => seenSignals[k]).length
const slopTotals = vps.reduce((a, v) => { for (const k of ['gradients', 'gradientText', 'glows', 'heavyWeight', 'upperTracked', 'transitionAll', 'infiniteAnim', 'emoji']) a[k] = Math.max(a[k] || 0, v.slop[k]); return a }, {})
const slopPenalty = Math.min(20, (slopTotals.gradientText + slopTotals.glows + slopTotals.emoji) * 2 + Math.min(slopTotals.gradients, 6) + slopTotals.heavyWeight + slopTotals.upperTracked + Math.min(slopTotals.infiniteAnim, 4))
const navOk = (report.nav || []).filter(s => s.ok).length
const navTotal = (report.nav || []).length
const score = {
  noErrors: Math.max(0, 20 - report.errors.length * 5),
  noOverflow: 5 * vps.filter(v => v.overflowX <= 1).length,
  accessibility: Math.max(0, 20 - serious.length * 6 - minor.length * 1 - (vps.reduce((a, v) => a + (v.unlabeled > 0 ? 1 : 0), 0)) * 2),
  navigation: navTotal === 0 ? 0 : Math.round(15 * navOk / navTotal),
  launchSignals: Math.round(15 * sigHit / sigKeys.length),
  quietDesign: 15 - Math.min(15, slopPenalty),
}
const maxes = { noErrors: 20, noOverflow: 15, accessibility: 20, navigation: 15, launchSignals: 15, quietDesign: 15 }
let got = 0
let possible = 0
for (const k of Object.keys(maxes)) { if (k === 'navigation' && navTotal === 0) continue; got += score[k]; possible += maxes[k] }
score.total = Math.round(100 * got / possible)
score.note = navTotal === 0 ? 'navigation not measured (no navigation found, probably a setup or login screen; use --setup)' : ''
report.score = score
report.slopRuntime = slopTotals
report.signalsSeen = seenSignals
writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(report, null, 2))

console.log(`\nVerify ${url}\n`)
for (const vp of VIEWPORTS) { const v = report.viewports[vp.name]; console.log(`${vp.name.padEnd(8)} ${vp.width}px  overflowX ${v.overflowX}px  controls ${v.interactive}  unlabeled ${v.unlabeled}  tiny targets ${v.smallTargets}  headline "${v.headline}"  title "${v.title}"`) }
console.log(`\nConsole/network errors: ${report.errors.length}`); report.errors.slice(0, 6).forEach(e => console.log('  ' + e))
console.log(`Accessibility (axe, WCAG 2.x A/AA): ${serious.length} serious/critical, ${minor.length} moderate/minor`)
for (const v of report.axe || []) console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes})`)
console.log(`Navigation walk: ${navOk}/${navTotal} steps fine`); (report.nav || []).forEach(s => console.log(`  ${s.ok ? 'ok ' : 'BAD'} ${s.label} (text ${s.textLength ?? '-'}, new errors ${s.newErrors ?? '-'})${s.note ? ' ' + s.note : ''}`))
console.log(`Persistence: keys ${report.persistence?.keysBeforeReload} before reload, ${report.persistence?.keysAfterReload} after (the walk does not write data)`)
console.log(`Launch-ready signals on screen: ${sigHit}/${sigKeys.length}  ${JSON.stringify(sig)}`)
console.log(`Runtime design signs: ${JSON.stringify(slopTotals)}`)
if (score.note) console.log(score.note)
console.log(`\nScore ${score.total}/100  (errors ${score.noErrors}/20, overflow ${score.noOverflow}/15, access ${score.accessibility}/20, nav ${score.navigation}/15, signals ${score.launchSignals}/15, quiet design ${score.quietDesign}/15)`)
console.log(`Files: ${outDir}`)

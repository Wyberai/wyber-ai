// Clicks every visible button, tab and link of a published WyberAi app and records what each one does, so "does every button work"
// is a measured answer, not a guess. Read-only by design: it never types, never submits a form with data, and skips anything that
// looks destructive (delete, remove, sign out, reset, pay) or leaves the app (other origins are only checked for a real href).
//
//   node scripts/check-buttons.mjs https://wyberai.com/app/<slug> [--out <dir>] [--max 60] [--chrome <path>]
//
// Each element is tried on a fresh load so one click cannot hide the next. A click is "ok" when something observable changed
// (the hash, the visible text, a dialog opened, focus moved, a validation message appeared, a menu expanded), "dead" when nothing did,
// and "error" when the page threw or logged an error. Prints a summary and writes JSON.
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const url = args.find(a => /^https?:\/\//.test(a))
if (!url) { console.error('usage: node scripts/check-buttons.mjs https://wyberai.com/app/<slug>'); process.exit(1) }
const opt = (n, f) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : f }
const MAX = +opt('--max', 60)
const outDir = resolve(opt('--out', 'verify-buttons'))
mkdirSync(outDir, { recursive: true })
const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || 'home'
const CHROME = opt('--chrome', ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const DESTRUCTIVE = /\b(delete|remove|sign ?out|log ?out|reset|clear all|erase|cancel subscription|pay|buy now|checkout|unsubscribe)\b/i

// Runs inside the app frame. Lists the interactive elements in document order with a label and the facts needed to decide how to test them.
const listElements = () => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && s.pointerEvents !== 'none' }
  const nodes = Array.from(document.querySelectorAll('button, [role=button], [role=tab], a[href], summary')).filter(vis)
  return nodes.map((e, i) => {
    const label = ((e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || e.value || '').replace(/\s+/g, ' ').trim()).slice(0, 60) || '(no label)'
    const href = e.tagName === 'A' ? e.getAttribute('href') : null
    return { i, tag: e.tagName.toLowerCase(), label, href, disabled: !!(e.disabled || e.getAttribute('aria-disabled') === 'true'), type: e.getAttribute('type') || '', inForm: !!e.closest('form'), noLabel: label === '(no label)' }
  })
}

// Runs inside the frame before and after a click. Cheap fingerprints of "something happened".
const snapshot = () => ({
  hash: location.hash,
  text: (document.body?.innerText || '').slice(0, 4000),
  nodes: document.body ? document.body.getElementsByTagName('*').length : 0,
  dialogs: document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open],[aria-modal=true]').length,
  expanded: document.querySelectorAll('[aria-expanded=true],details[open]').length,
  active: document.activeElement ? document.activeElement.tagName + (document.activeElement.id || '') : '',
  invalid: document.querySelectorAll(':invalid').length,
  scroll: Math.round(window.scrollY),
  selected: document.querySelectorAll('[aria-selected=true],[aria-current],[data-state=active]').length,
})

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const results = []
const loadErrors = []
let total = 0

async function openApp() {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 860 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  await sleep(3200)
  let frame = null
  for (const f of page.frames().filter(f => f !== page.mainFrame())) { try { if (await f.evaluate(() => (document.body?.innerText || '').length > 0)) { frame = f; break } } catch { /* detached */ } }
  return { page, frame: frame || page.mainFrame(), errors }
}

try {
  const first = await openApp()
  const elements = await first.frame.evaluate(listElements)
  total = elements.length
  await first.page.close()
  const todo = elements.slice(0, MAX)
  for (const el of todo) {
    const rec = { i: el.i, tag: el.tag, label: el.label, href: el.href, result: '', reason: '' }
    results.push(rec)
    if (el.noLabel) rec.reason = 'no accessible label'
    if (el.disabled) { rec.result = 'skipped'; rec.reason = 'disabled'; continue }
    if (DESTRUCTIVE.test(el.label)) { rec.result = 'skipped'; rec.reason = 'looks destructive'; continue }
    if (el.href) {
      if (/^(mailto|tel|sms|whatsapp):/i.test(el.href) || /^https?:\/\/wa\.me\//i.test(el.href)) { rec.result = el.href.length > 8 ? 'ok' : 'dead'; rec.reason = 'contact link with a value'; continue }
      if (/^javascript:/i.test(el.href) || el.href === '#' ) { rec.reason = el.href === '#' ? 'href is just "#"' : 'javascript: link'; rec.result = el.tag === 'a' && el.href === '#' ? 'check' : 'check'; }
      else if (/^https?:\/\//i.test(el.href)) { try { const u = new URL(el.href); if (u.origin !== new URL(url).origin && !/\.wyberai\.com$/.test(u.hostname)) { rec.result = 'ok'; rec.reason = 'external link with a real address (not clicked)'; continue } } catch { /* relative */ } }
    }
    const { page, frame, errors } = await openApp()
    const base = errors.length // errors that already happened while the page loaded are not this button's fault
    try {
      const before = await frame.evaluate(snapshot)
      const clicked = await frame.evaluate(i => {
        const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && s.pointerEvents !== 'none' }
        const nodes = Array.from(document.querySelectorAll('button, [role=button], [role=tab], a[href], summary')).filter(vis)
        const e = nodes[i]; if (!e) return false
        e.scrollIntoView({ block: 'center' }); e.click(); return true
      }, el.i)
      if (!clicked) { rec.result = 'skipped'; rec.reason = 'element not found on reload'; await page.close(); continue }
      await sleep(900)
      const after = await frame.evaluate(snapshot).catch(() => null)
      if (!after) { rec.result = 'ok'; rec.reason = 'the page navigated away'; await page.close(); continue }
      const changed = []
      if (after.hash !== before.hash) changed.push('hash')
      if (after.text !== before.text) changed.push('text')
      if (after.nodes !== before.nodes) changed.push('structure')
      if (after.dialogs !== before.dialogs) changed.push('dialog')
      if (after.expanded !== before.expanded) changed.push('expanded')
      if (after.active !== before.active) changed.push('focus')
      if (after.invalid !== before.invalid || (el.inForm && after.invalid > 0)) changed.push('validation')
      if (after.scroll !== before.scroll) changed.push('scrolled')
      if (after.selected !== before.selected) changed.push('selection')
      const fresh = errors.slice(base)
      if (!loadErrors.length && base) loadErrors.push(...errors.slice(0, base))
      if (fresh.length) { rec.result = 'error'; rec.reason = fresh[0] }
      else if (changed.length) { rec.result = 'ok'; rec.reason = 'changed: ' + changed.join(', ') }
      else { rec.result = 'dead'; rec.reason = 'nothing observable happened' }
    } catch (e) { rec.result = 'error'; rec.reason = String(e.message).slice(0, 100) }
    await page.close()
  }
} finally { await browser.close() }

const tested = results.filter(r => r.result && r.result !== 'skipped')
const ok = tested.filter(r => r.result === 'ok').length
const dead = results.filter(r => r.result === 'dead' || r.result === 'check')
const err = results.filter(r => r.result === 'error')
const score = tested.length ? Math.round((ok / tested.length) * 100) : 0
const report = { url, loadErrors: loadErrors.slice(0, 3), found: total, tried: results.length, tested: tested.length, ok, dead: dead.length, errors: err.length, skipped: results.filter(r => r.result === 'skipped').length, score, results }
writeFileSync(join(outDir, `${slug}-buttons.json`), JSON.stringify(report, null, 1))
console.log(`${slug}: found ${total}, tested ${tested.length}, ok ${ok}, dead ${dead.length}, errors ${err.length}, skipped ${report.skipped}  => button score ${score}/100`)
if (loadErrors.length) console.log('  (page-load error, not a button: ' + loadErrors[0].slice(0, 110) + ')')
for (const r of [...dead, ...err]) console.log(`  ${r.result.toUpperCase().padEnd(5)} <${r.tag}> "${r.label}" — ${r.reason}`)

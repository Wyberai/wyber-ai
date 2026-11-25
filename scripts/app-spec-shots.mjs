// Walks a rendered demo app in a real browser and takes screenshots: node scripts/app-spec-shots.mjs <outDir> <name> <url> <firstEntityLabel>
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const [out, name, url, entityLabel] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.setViewport({ width: 1280, height: 800 })
const wait = ms => new Promise(r => setTimeout(r, ms))
const clickText = async (sel, text) => {
  const hs = await page.$$(sel)
  for (const h of hs) { const t = await page.evaluate(e => (e.textContent || '').trim(), h); if (t.includes(text)) { await h.click(); return true } }
  return false
}
await page.goto(url, { waitUntil: 'networkidle0' })
await wait(800)
await page.screenshot({ path: `${out}/${name}-1-setup.png` })
console.log('skip', await clickText('button', 'Skip for now'))
await wait(500)
await page.screenshot({ path: `${out}/${name}-2-home-empty.png` })
console.log('sample', await clickText('button', 'Load sample data (demo)'))
await wait(700)
await page.screenshot({ path: `${out}/${name}-3-home.png` })
console.log('open', await clickText('aside button', entityLabel))
await wait(700)
await page.screenshot({ path: `${out}/${name}-4-list.png` })
const openBtn = await page.$('button[aria-label^="Open"]')
if (openBtn) { await openBtn.click(); await wait(700); await page.screenshot({ path: `${out}/${name}-4b-detail.png` }); await page.keyboard.press('Escape'); await wait(400) }
const edit = await page.$('button[aria-label^="Edit"]')
if (edit) { await edit.click(); await wait(600); await page.screenshot({ path: `${out}/${name}-5-form.png` }); await page.keyboard.press('Escape'); await wait(400) }
console.log('import', await clickText('button', 'Import CSV'))
await wait(500)
await page.screenshot({ path: `${out}/${name}-6-import.png` })
await page.keyboard.press('Escape')
await wait(300)
const del = await page.$('button[aria-label^="Delete"]')
if (del) { await del.click(); await wait(500); await page.screenshot({ path: `${out}/${name}-7-undo.png` }) }
await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 2 })
await wait(700)
await page.screenshot({ path: `${out}/${name}-8-phone.png` })
console.log('overflow-x at 390px:', await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1))
console.log('errors:', JSON.stringify(errors.slice(0, 5)))
await browser.close()

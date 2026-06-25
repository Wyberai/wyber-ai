// Screenshot a page to PNG at a given size + scale.
// Usage: node scripts/png.mjs <url> <out> <width> <height> [scale]
import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , url, out, wS, hS, scaleS] = process.argv
const w = parseInt(wS, 10), h = parseInt(hS, 10), scale = parseFloat(scaleS || '2')
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--hide-scrollbars'], defaultViewport: { width: w, height: h, deviceScaleFactor: scale } })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
try { await page.evaluate(() => document.fonts.ready) } catch {}
await new Promise(r => setTimeout(r, 400))
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } })
await browser.close()
console.log('PNG', out)

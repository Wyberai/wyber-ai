// Quick preview: capture stills of a reel HTML at given timestamps (no full render).
// Usage: node scripts/reel-frames.mjs "<input.html>" "<outDir>" "t1,t2,t3,..."
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , inArg, outDir, timesArg] = process.argv
const inPath = path.resolve(inArg)
const times = (timesArg || '0').split(',').map(s => parseFloat(s.trim()))
const fileUrl = 'file:///' + inPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
fs.mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1'] })
const page = await browser.newPage()
await page.evaluateOnNewDocument(() => { window.__RENDER = true })
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 90000 })
try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
for (const t of times) {
  await page.evaluate((tt) => window.__seek(tt), t)
  const p = path.join(outDir, `t_${String(t).replace('.', '_')}.png`)
  await page.screenshot({ path: p, clip: { x: 0, y: 0, width: 1080, height: 1920 } })
  console.log('✓', p)
}
await browser.close()

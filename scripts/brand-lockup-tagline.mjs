// Renders the official WyberAi lockup with the tagline "Describe it. Ship it." underneath.
// Uses the untouched Brand Kit lockup PNGs. Usage: node scripts/brand-lockup-tagline.mjs [outDir]
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const KIT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Brand Kit')
const OUT = path.resolve(process.argv[2] || path.join(KIT, 'with-tagline'))
fs.mkdirSync(OUT, { recursive: true })

const TAG = 'Describe it. Ship it.'
const SKY = '#0ea5e9'

// variant: which official lockup, tagline colour, page background (null = transparent)
const VARIANTS = [
  { name: 'wyberai-lockup-tagline-on-dark', src: 'wyberai-lockup-on-dark.png', tag: '#9aa4b5', bg: null, w: 1400, h: 640, logoW: 1100 },
  { name: 'wyberai-lockup-tagline-on-light', src: 'wyberai-lockup-on-light.png', tag: '#5b6578', bg: null, w: 1400, h: 640, logoW: 1100 },
  { name: 'wyberai-social-banner-1500x500', src: 'wyberai-lockup-on-dark.png', tag: '#9aa4b5', bg: '#05060a', w: 1500, h: 500, logoW: 760 },
  { name: 'wyberai-xpro-logo-1x1-light', src: 'wyberai-lockup-on-light.png', tag: '#5b6578', bg: '#ffffff', w: 1000, h: 1000, logoW: 820 },
  { name: 'wyberai-xpro-logo-1x1-dark', src: 'wyberai-lockup-on-dark.png', tag: '#9aa4b5', bg: '#05060a', w: 1000, h: 1000, logoW: 820 },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
for (const v of VARIANTS) {
  const img = pathToFileURL(path.join(KIT, v.src)).href
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:${v.w}px;height:${v.h}px;background:${v.bg ?? 'transparent'}}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,sans-serif}
img{width:${v.logoW}px;height:auto;display:block}
.tag{margin-top:${Math.round(v.logoW * 0.02)}px;font-size:${Math.round(v.logoW * 0.052)}px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${v.tag}}
.tag b{color:${SKY};font-weight:600}
</style></head><body><img src="${img}"><div class="tag">Describe it<b>.</b> Ship it<b>.</b></div></body></html>`
  await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1 })
  const tmp = path.join(KIT, '_tmp-lockup.html'); fs.writeFileSync(tmp, html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(OUT, `${v.name}.png`)
  await page.screenshot({ path: file, omitBackground: v.bg === null })
  console.log('png', path.basename(file))
}
fs.rmSync(path.join(KIT, '_tmp-lockup.html'), { force: true })
await browser.close()
console.log('tagline:', TAG, '→', OUT)

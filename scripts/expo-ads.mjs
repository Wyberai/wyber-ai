// Renders the Tech Expo Gujarat Meta ad creatives (static feed + story images) from marketing/gujarat-tech-expo/ads/ad.html.
// The 15s reel is rendered separately with scripts/reel-video.mjs (see the usage printed at the end).
// Usage: node scripts/expo-ads.mjs [outDir]
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SRC = path.resolve('marketing/gujarat-tech-expo/ads/ad.html')
const OUT = path.resolve(process.argv[2] || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'meta-ads'))
fs.mkdirSync(OUT, { recursive: true })

const SIZES = [{ fmt: 'feed-4x5', w: 1080, h: 1350 }, { fmt: 'story-9x16', w: 1080, h: 1920 }]
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
for (const aud of ['business', 'software']) {
  for (const { fmt, w, h } of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
    await page.goto(`${pathToFileURL(SRC).href}?aud=${aud}&mode=static`, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts.ready)
    const file = path.join(OUT, `${aud}-${fmt}.png`)
    await page.screenshot({ path: file })
    console.log('png', path.basename(file))
  }
}
await browser.close()
console.log(`\nReels: REEL_W=1080 REEL_H=1920 node scripts/reel-video.mjs "marketing/gujarat-tech-expo/ads/ad.html?aud=business&mode=reel" "${OUT}/business-reel-9x16.mp4" 30`)

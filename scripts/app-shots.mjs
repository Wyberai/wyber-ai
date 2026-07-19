// Screenshot the live published demo app (clean, no editor chrome) for
// Reddit/group posts. Usage: node scripts/app-shots.mjs <url>
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'campaign-jul11', 'app-shots')
fs.mkdirSync(OUT, { recursive: true })
const url = process.argv[2]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.25 })
const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
console.log('status:', resp?.status(), page.url())
await new Promise(r => setTimeout(r, 3500))
await page.screenshot({ path: path.join(OUT, 'app-schedule.png') })
// click through tabs by text — the app may render inside an iframe
for (const [label, file] of [['Instructors', 'app-instructors.png'], ['Reviews', 'app-reviews.png']]) {
  let ok = false
  for (const fr of page.frames()) {
    ok = await fr.evaluate((t) => {
      const el = [...document.querySelectorAll('a,button,div[role=button],li,span')].find(e => e.textContent.trim() === t)
      if (el) { el.click(); return true }
      return false
    }, label).catch(() => false)
    if (ok) break
  }
  await new Promise(r => setTimeout(r, 1800))
  if (ok) await page.screenshot({ path: path.join(OUT, file) })
  console.log(label, ok ? '✓' : 'not found')
}
await browser.close()
console.log('shots in', OUT)

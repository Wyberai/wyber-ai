// Full-page screenshots of running demo sites: node scripts/website-spec-shots.mjs <outDir> <name=url> [<name=url>...]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const [outDir, ...targets] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const executablePath = CANDIDATES.find(p => fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
for (const t of targets) {
  const [name, url] = t.split('=')
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  // scroll through so every reveal animation has fired, then return to the top
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await new Promise(r => setTimeout(r, 120)) }
  await new Promise(r => setTimeout(r, 600))
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise(r => setTimeout(r, 500))
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
  console.log(name, h + 'px')
  await page.close()
}
await browser.close()

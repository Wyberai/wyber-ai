// Full-page screenshots of the demo sites, and the second language of any site that has a language toggle.
//   node scripts/website-spec-shots-lang.mjs <outDir> <name=url> [<name=url> ...]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const [out, ...targets] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] })

async function full(page, name) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await new Promise(r => setTimeout(r, 100)) }
  await new Promise(r => setTimeout(r, 500))
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise(r => setTimeout(r, 400))
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  console.log(name, h + 'px')
}

for (const t of targets) {
  const [name, url] = t.split('=')
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  await full(page, name)
  const toggles = await page.$$('button[aria-pressed]')
  if (toggles.length > 1) {
    await toggles[1].click()
    await new Promise(r => setTimeout(r, 600))
    await full(page, name + '-lang2')
  }
  await page.close()
}
await browser.close()

// Viewport screenshots of one demo site at the top and after scrolling: node scripts/website-spec-shots-scroll.mjs <outDir> <url> [scrollY]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const [out, url, y = '1500'] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: `${out}/motion-top.png` })
await page.evaluate(v => window.scrollTo(0, v), Number(y))
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: `${out}/motion-scrolled.png` })
console.log('done')
await browser.close()

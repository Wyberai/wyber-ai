import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , url, outDir, wS, hS] = process.argv
const w = parseInt(wS, 10), h = parseInt(hS, 10)
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--hide-scrollbars','--force-device-scale-factor=1',`--window-size=${w},${h}`], defaultViewport: { width: w, height: h, deviceScaleFactor: 1 } })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
try { await page.evaluate(() => document.fonts.ready) } catch {}
for (const id of ['s1','s5','s7']) {
  await page.evaluate((sid) => { for (let i=1;i<99999;i++) clearTimeout(i); document.querySelectorAll('.scene').forEach(s => s.classList.toggle('active', s.id===sid)) }, id)
  await new Promise(r => setTimeout(r, 400))
  await page.screenshot({ path: `${outDir}/m_${id}.png` })
}
await browser.close()
console.log('shots done')

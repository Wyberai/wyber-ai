// Xpro company logo, 1:1. The old one carried "DESCRIBE IT. SHIP IT." under the wordmark. Run: node scripts/expo-logo.mjs
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'booth-artwork', '2-UPLOAD-TO-XPRO', 'wyberai-company-logo-1x1.png')
const SKY = '#0ea5e9'
const mark = `<svg width="150" height="150" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="${SKY}"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;width:1000px;height:1000px;background:#fff;overflow:hidden}
.w{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}
.r{display:flex;align-items:center;gap:28px;font-family:Inter,sans-serif;font-weight:900;font-size:132px;letter-spacing:-.04em;color:#0b1220;line-height:1}
.r b{color:${SKY}}
.t{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:27px;letter-spacing:.2em;color:#64748b}
</style></head><body><div class="w"><div class="r">${mark}<span>Wyber<b>Ai</b></span></div><div class="t">VIBE CODING WITH SUPERPOWERS</div></div></body></html>`

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] })
const pg = await browser.newPage()
await pg.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 })
await pg.setContent(html, { waitUntil: 'networkidle2', timeout: 90000 })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT })
await browser.close()
console.log('wrote', OUT)

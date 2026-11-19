// Xpro exhibitor-page banner, 1600x400 (4:1), same message as the booth backdrop. Run: node scripts/expo-banner.mjs
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'booth-artwork', '2-UPLOAD-TO-XPRO', 'xpro-banner-1600x400.png')
const SKY = '#0ea5e9'
const mark = `<svg width="64" height="64" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="${SKY}"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const tiles = [['Data leak test', 'database probed'], ['Secret-key guard', 'keys stay out'], ['Security checklist', 'full checklist'], ['AI slop remover', 'no generic AI look'], ['Not a template', 'a design for you'], ['SEO + AEO friendly', 'Google and AI']]
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;width:1600px;height:400px;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;overflow:hidden}
.glow{position:absolute;right:-120px;top:-160px;width:620px;height:620px;border-radius:50%;background:radial-gradient(closest-side,rgba(14,165,233,.28),transparent)}
.logo{position:absolute;left:64px;top:48px;display:flex;align-items:center;gap:16px;font-weight:900;font-size:44px;letter-spacing:-.03em}
.h{position:absolute;left:64px;top:122px;font-weight:900;font-size:80px;line-height:1;letter-spacing:-.045em}
.s{position:absolute;left:64px;top:302px;font-weight:700;font-size:25px;letter-spacing:-.02em;color:${SKY}}
.t{position:absolute;right:48px;top:36px;width:560px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.c{background:#0f121b;border:1px solid #1f2533;border-radius:12px;padding:14px 16px 15px}
.c b{display:block;font-size:24px;font-weight:900;letter-spacing:-.02em}.c span{display:block;margin-top:3px;font-size:17px;color:#9aa4b5;line-height:1.3}
.m{position:absolute;left:64px;bottom:24px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:17px;letter-spacing:.14em;color:#6b7488}
</style></head><body><div class="glow"></div>
<div class="logo">${mark}<div>Wyber<span style="color:${SKY}">Ai</span></div></div>
<div class="h">Vibe coding<br><span style="color:${SKY}">with superpowers.</span></div>
<div class="s">Websites · Web apps · Mobile apps · SaaS · Replace your SaaS</div>
<div class="t">${tiles.map(([a, b]) => `<div class="c"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="m">AN AI AGENT PLANS IT, BUILDS IT, REPAIRS IT AND CHECKS IT.</div>
</body></html>`

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] })
const pg = await browser.newPage()
await pg.setViewport({ width: 1600, height: 400, deviceScaleFactor: 1 })
await pg.setContent(html, { waitUntil: 'networkidle0' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT })
await browser.close()
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes')

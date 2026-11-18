// Xpro exhibitor-page banner, 1600x400 (4:1), same message as the booth backdrop. Run: node scripts/expo-banner.mjs
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'booth-artwork', 'xpro-banner-1600x400.png')
const SKY = '#0ea5e9'
const mark = `<svg width="64" height="64" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="${SKY}"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const tiles = [['Timesheets', 'who worked on what'], ['CRM', 'every lead, one place'], ['Attendance', 'on a phone'], ['Leave', 'approvals, not chats']]
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;width:1600px;height:400px;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;overflow:hidden}
.glow{position:absolute;right:-120px;top:-160px;width:620px;height:620px;border-radius:50%;background:radial-gradient(closest-side,rgba(14,165,233,.28),transparent)}
.logo{position:absolute;left:64px;top:48px;display:flex;align-items:center;gap:16px;font-weight:900;font-size:44px;letter-spacing:-.03em}
.h{position:absolute;left:64px;top:122px;font-weight:900;font-size:64px;line-height:1.04;letter-spacing:-.04em}
.s{position:absolute;left:64px;top:282px;font-weight:700;font-size:32px;letter-spacing:-.02em;color:${SKY}}
.t{position:absolute;right:64px;top:64px;width:420px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.c{background:#0f121b;border:1px solid #1f2533;border-radius:14px;padding:18px 18px 20px}
.c b{display:block;font-size:26px;font-weight:900;letter-spacing:-.02em}.c span{display:block;margin-top:6px;font-size:18px;color:#9aa4b5;line-height:1.3}
.m{position:absolute;left:64px;bottom:30px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:17px;letter-spacing:.14em;color:#6b7488}
</style></head><body><div class="glow"></div>
<div class="logo">${mark}<div>Wyber<span style="color:${SKY}">Ai</span></div></div>
<div class="h">Stop renting<br><span style="color:${SKY}">small software.</span></div>
<div class="s">Tell us your pain points. Build your own software.</div>
<div class="t">${tiles.map(([a, b]) => `<div class="c"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="m">YOU PAY FOR 100 FEATURES. YOU USE 5.</div>
</body></html>`

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] })
const pg = await browser.newPage()
await pg.setViewport({ width: 1600, height: 400, deviceScaleFactor: 1 })
await pg.setContent(html, { waitUntil: 'networkidle0' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT })
await browser.close()
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes')

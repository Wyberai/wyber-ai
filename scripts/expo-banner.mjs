// Tech Expo Gujarat banner (Xpro cover, social header). Uses the official icon and the generated expo photos.
// Usage: node scripts/expo-banner.mjs [outDir]
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve(process.argv[2] || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'banners'))
fs.mkdirSync(OUT, { recursive: true })
const PUB = path.resolve('public')
const img = p => pathToFileURL(path.join(PUB, p)).href

const SIZES = [
  { name: 'banner-4x1-1600x400-xpro', w: 1920, h: 480, dsf: 1600 / 1920, short: true },
  { name: 'banner-3x1-1920x640', w: 1920, h: 640 },
  { name: 'banner-16x9-1920x1080', w: 1920, h: 1080 },
]

const htmlShort = () => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}html,body{margin:0;width:1920px;height:480px;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 55% 90% at 80% 50%,rgba(14,165,233,.22),transparent 65%)}
.logo{position:absolute;left:90px;top:34px;display:flex;align-items:center;gap:16px;font-weight:900;font-size:40px;letter-spacing:-.03em}
.logo img{width:56px;height:56px;border-radius:14px}.logo b{color:#0ea5e9}
.txt{position:absolute;left:90px;top:118px;width:1150px}
h1{margin:0;font-weight:900;letter-spacing:-.045em;line-height:1;font-size:70px}h1 em{font-style:normal;color:#0ea5e9}
.tag{margin-top:14px;font-size:22px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9aa4b5}
.pill{position:absolute;left:90px;bottom:36px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;letter-spacing:.12em;color:#0ea5e9;border:2px solid rgba(14,165,233,.5);background:rgba(14,165,233,.1);border-radius:999px;padding:10px 26px}
.ph{position:absolute;filter:drop-shadow(0 14px 28px rgba(0,0,0,.6))}
</style></head><body><div class="glow"></div>
<div class="logo"><img src="${img('brand/wyberai-icon-512.png')}"><span>Wyber<b>Ai</b></span></div>
<div class="txt"><h1>Build any digital product.<br><em>Ship it in minutes.</em></h1><div class="tag">Describe it. Ship it.</div></div>
<div class="pill">TECH EXPO GUJARAT · BOOTH S23 · 27–29 NOV · FROM 9:30 AM</div>
<img class="ph" style="right:330px;top:10px;width:250px;transform:rotate(-8deg)" src="${img('expo/business/gstr2b-printout.webp')}">
<img class="ph" style="right:60px;top:30px;width:260px;transform:rotate(7deg)" src="${img('expo/business/challan-pad.webp')}">
<img class="ph" style="right:230px;top:240px;width:230px;transform:rotate(-4deg)" src="${img('expo/business/cheques.webp')}">
</body></html>`

const html = ({ w, h, short }) => {
  if (short) return htmlShort()
  const wide = w / h > 2
  const u = h / (wide ? 640 : 1080)
  const px = n => `${Math.round(n * u)}px`
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 78% 50%,rgba(14,165,233,.22),transparent 65%)}
.logo{position:absolute;left:${px(wide ? 90 : 110)};top:${px(wide ? 50 : 100)};display:flex;align-items:center;gap:${px(18)};font-weight:900;font-size:${px(wide ? 44 : 56)};letter-spacing:-.03em}
.logo img{width:${px(wide ? 64 : 84)};height:${px(wide ? 64 : 84)};border-radius:${px(16)}}.logo b{color:#0ea5e9}
.txt{position:absolute;left:${px(wide ? 90 : 110)};top:${px(wide ? 160 : 300)};width:${px(wide ? 1150 : 1150)}}
h1{margin:0;font-weight:900;letter-spacing:-.045em;line-height:1;font-size:${px(wide ? 74 : 104)}}h1 em{font-style:normal;color:#0ea5e9}
.tag{margin-top:${px(wide ? 22 : 30)};font-size:${px(wide ? 26 : 36)};font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9aa4b5}
.pill{position:absolute;left:${px(wide ? 90 : 110)};bottom:${px(wide ? 56 : 110)};font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${px(wide ? 24 : 28)};letter-spacing:.12em;color:#0ea5e9;border:2px solid rgba(14,165,233,.5);background:rgba(14,165,233,.1);border-radius:999px;padding:${px(wide ? 12 : 16)} ${px(wide ? 28 : 36)}}
.ph{position:absolute;filter:drop-shadow(0 ${px(18)} ${px(36)} rgba(0,0,0,.6))}
</style></head><body><div class="glow"></div>
<div class="logo"><img src="${img('brand/wyberai-icon-512.png')}"><span>Wyber<b>Ai</b></span></div>
<div class="txt"><h1>${wide ? 'Build any digital product.<br><em>Ship it in minutes.</em>' : 'Build any<br>digital product.<br><em>Ship it in minutes.</em>'}</h1><div class="tag">Describe it. Ship it.</div></div>
<div class="pill">TECH EXPO GUJARAT · BOOTH S23 · 27–29 NOV${wide ? ' · FROM 9:30 AM' : ''}</div>
${wide
  ? `<img class="ph" style="right:${px(330)};top:${px(50)};width:${px(300)};transform:rotate(-8deg)" src="${img('expo/business/gstr2b-printout.webp')}">
<img class="ph" style="right:${px(50)};top:${px(90)};width:${px(310)};transform:rotate(7deg)" src="${img('expo/business/challan-pad.webp')}">
<img class="ph" style="right:${px(230)};top:${px(340)};width:${px(270)};transform:rotate(-4deg)" src="${img('expo/business/cheques.webp')}">`
  : `<img class="ph" style="right:${px(110)};top:${px(60)};width:${px(430)};transform:rotate(-8deg)" src="${img('expo/business/gstr2b-printout.webp')}">
<img class="ph" style="right:${px(30)};top:${px(520)};width:${px(480)};transform:rotate(7deg)" src="${img('expo/business/challan-pad.webp')}">
<img class="ph" style="right:${px(430)};top:${px(640)};width:${px(340)};transform:rotate(-4deg)" src="${img('expo/business/cheques.webp')}">`}
</body></html>`
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
for (const s of SIZES) {
  const tmp = path.join(OUT, '_tmp-banner.html')
  fs.writeFileSync(tmp, html(s))
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: s.dsf || 1 })
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(OUT, `${s.name}.png`) })
  console.log('png', s.name)
}
fs.rmSync(path.join(OUT, '_tmp-banner.html'), { force: true })
await browser.close()

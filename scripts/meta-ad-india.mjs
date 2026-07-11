// Generate WyberAi Meta/Instagram ad creatives (India) as real PNGs.
// Same headless-Chrome + brand pattern as scripts/social-assets.mjs.
// Two angles (speed + price/UPI) × two sizes (4:5 feed, 9:16 story/reel).
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-india/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-india')

// ---- brand primitives (mirrors social-assets.mjs) ---------------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`

// pill badge (e.g. ₹499/mo · Pay with UPI)
const pill = (t, accent) => `<div class="mono" style="display:inline-flex;align-items:center;font-size:26px;font-weight:500;color:${accent?'#0EA5E9':'#e5e7eb'};border:1px solid ${accent?'rgba(14,165,233,.4)':'rgba(255,255,255,.14)'};background:${accent?'rgba(14,165,233,.08)':'rgba(255,255,255,.03)'};border-radius:999px;padding:12px 24px;white-space:nowrap">${t}</div>`
// faux product prompt bar — communicates "just describe it"
const promptBar = (t) => `<div style="display:flex;align-items:center;gap:16px;width:100%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:16px;padding:22px 26px"><span class="mono sky" style="font-size:30px;font-weight:500">&rsaquo;</span><span class="mono" style="font-size:27px;color:#9ca3af">${t}<span style="color:#0EA5E9">|</span></span></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:34px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:22px 44px;letter-spacing:-.01em">${t}</div>`

// near-black with a soft sky glow top-left for depth
const BG = `background:radial-gradient(1100px 700px at 22% 8%, rgba(14,165,233,.18), transparent 60%), #09090b`

const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`

// ---- ad body (shared between feed 4:5 and story 9:16 via padding) ------------
// `pad` gives Stories/Reels a top+bottom safe zone so IG's UI never covers copy.
function speedAd(w, h, pad) {
  return doc(w, h, `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:44px;padding:${pad}px 84px">
    <div style="display:flex;flex-direction:column;gap:30px">
      ${lockup(52, 33)}
      <div class="mono sky" style="font-size:24px;font-weight:500;letter-spacing:.14em">AI APP BUILDER</div>
      <div style="font-weight:900;font-size:96px;letter-spacing:-0.05em;color:#fafafa;line-height:.98">Build a real app<br>in 4 minutes.</div>
      <div style="font-size:34px;color:#a1a1aa;line-height:1.45;max-width:820px">No code. Just describe your idea — get a live web <span style="color:#e5e7eb">or</span> mobile app.</div>
    </div>
    ${promptBar('build me a booking app for my salon')}
    <div style="display:flex;gap:16px;flex-wrap:wrap">${pill('Free to start',false)}${pill('Pay with UPI',true)}${pill('Web + mobile',false)}</div>
    ${cta('Start free &rarr; wyberai.com')}
  </div>`)
}

function priceAd(w, h, pad) {
  return doc(w, h, `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:46px;padding:${pad}px 84px">
    <div style="display:flex;flex-direction:column;gap:30px">
      ${lockup(52, 33)}
      <div class="mono sky" style="font-size:24px;font-weight:500;letter-spacing:.12em">MADE FOR INDIA &middot; PAY WITH UPI</div>
      <div style="font-weight:900;font-size:92px;letter-spacing:-0.05em;color:#fafafa;line-height:1">Your idea,<br>a real app.<br><span class="sky">&#8377;499.</span></div>
      <div style="font-size:34px;color:#a1a1aa;line-height:1.45;max-width:820px">The cheapest way to start building for real. Web + mobile, unlimited projects.</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">${pill('50 free credits',true)}${pill('No card to start',false)}${pill('&#8377;499 / mo',false)}</div>
    ${cta('Start free &rarr; wyberai.com')}
  </div>`)
}

const assets = [
  { name: 'speed_feed_1080x1350.png', w: 1080, h: 1350, html: speedAd(1080, 1350, 90) },
  { name: 'speed_story_1080x1920.png', w: 1080, h: 1920, html: speedAd(1080, 1920, 300) },
  { name: 'price_feed_1080x1350.png', w: 1080, h: 1350, html: priceAd(1080, 1350, 90) },
  { name: 'price_story_1080x1920.png', w: 1080, h: 1920, html: priceAd(1080, 1920, 300) },
]

// ---- render -----------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await browser.newPage()
for (const a of assets) {
  await p.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 1 })
  await p.setContent(a.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([p.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await p.evaluate(() => document.fonts.check('900 40px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 300))
  await p.screenshot({ path: path.join(OUT, a.name), clip: { x: 0, y: 0, width: a.w, height: a.h } })
  console.log('✓', a.name, interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — Meta/Instagram ad creatives (India)
=============================================
Two angles to A/B test, each in feed + story sizes.

speed_feed_1080x1350.png   Angle A "Build a real app in 4 min" — Instagram/FB FEED (4:5)
speed_story_1080x1920.png  Angle A — Stories + Reels (9:16)
price_feed_1080x1350.png   Angle B "Your idea, a real app. ₹499" — FEED (4:5)
price_story_1080x1920.png  Angle B — Stories + Reels (9:16)

Upload BOTH angles as separate ads in one ad set so Meta finds the winner.
Feed placements use the 1080x1350 files; Stories/Reels use the 1080x1920 files.
`)
console.log('\nAll ad creatives in:', OUT)

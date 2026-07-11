// WyberAi — "the other builder's invoice" receipt creative, post #2 (post-launch).
// One concept, five native platform dimensions.
// Output: <OneDrive>/Desktop/Wyber Ai/receipt-2026/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'receipt-2026')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px">${MARK(m)}<div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const glow = `background:radial-gradient(1100px 640px at 50% 12%, rgba(14,165,233,.14), transparent 60%), #09090b`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${glow}">${inner}</body></html>`

// ── the credit-ledger card (scaled per placement) ────────────────────────────
const line = (label, status, ok) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px dashed rgba(255,255,255,.12)">
  <span class="mono" style="font-size:1em;color:#d4d4d8">${label}</span>
  <span class="mono" style="font-size:1em;font-weight:600;color:${ok ? '#f87171' : '#22c55e'}">${status}</span>
</div>`
const receipt = (scale) => {
  const s = (px) => `${px * scale}px`
  return `<div style="width:${620*scale}px;background:#0d0d10;border:1px solid rgba(255,255,255,.1);border-radius:${20*scale}px;padding:${40*scale}px ${44*scale}px;box-shadow:0 ${30*scale}px ${80*scale}px rgba(0,0,0,.55)">
  <div class="mono" style="font-size:${15*scale}px;color:#71717a;letter-spacing:.14em;margin-bottom:${18*scale}px">SOME OTHER APP BUILDER — YOUR CREDITS</div>
  <div style="font-size:${18*scale}px">
    ${line('Base app build', 'included', false)}
    ${line('Ask it to fix your security', '− credits', true)}
    ${line('Ask it to fix your SEO', '− credits', true)}
  </div>
  <div class="mono" style="margin-top:${22*scale}px;padding-top:${18*scale}px;border-top:2px solid rgba(255,255,255,.14)">
    <div style="font-size:${15*scale}px;color:#71717a;letter-spacing:.1em;margin-bottom:${10*scale}px">WYBERAI — SAME BUILD</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span style="font-size:${17*scale}px;color:#d4d4d8">Security + SEO, built in</span>
      <span style="font-size:${24*scale}px;font-weight:800;color:#22c55e">0 credits</span>
    </div>
  </div>
</div>`
}

const headline = (size, lh = 1.06) => `<div style="font-weight:900;font-size:${size}px;letter-spacing:-0.045em;color:#f4f4f5;line-height:${lh}">Other builders bill<br>you in credits to fix<br><span class="sky">what we ship correct.</span></div>`

// 1) LinkedIn 4:5 — 1080x1350
const linkedin = doc(1080, 1350, `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:40px;padding:80px 76px">
  ${lockup(52, 32)}
  ${headline(58)}
  ${receipt(1)}
</div>`)

// 2) Instagram feed square — 1080x1080
const instagram = doc(1080, 1080, `<div style="width:100%;height:100%;display:flex;align-items:center;gap:56px;padding:0 70px">
  <div style="display:flex;flex-direction:column;gap:34px;flex:1">
    ${lockup(46, 28)}
    ${headline(46, 1.12)}
  </div>
  <div style="flex-shrink:0;transform:scale(0.72);transform-origin:right center">${receipt(1)}</div>
</div>`)

// 3) X/Twitter — 1200x675
const twitter = doc(1200, 675, `<div style="width:100%;height:100%;display:flex;align-items:center;gap:60px;padding:0 80px">
  <div style="display:flex;flex-direction:column;gap:28px;flex:1">
    ${lockup(44, 27)}
    ${headline(44, 1.1)}
  </div>
  <div style="flex-shrink:0;transform:scale(0.62);transform-origin:right center">${receipt(1)}</div>
</div>`)

// 4) Reddit — 1200x628
const reddit = doc(1200, 628, `<div style="width:100%;height:100%;display:flex;align-items:center;gap:56px;padding:0 76px">
  <div style="display:flex;flex-direction:column;gap:24px;flex:1">
    ${lockup(40, 25)}
    ${headline(38, 1.12)}
  </div>
  <div style="flex-shrink:0;transform:scale(0.56);transform-origin:right center">${receipt(1)}</div>
</div>`)

// 5) WhatsApp Status — 1080x1920
const whatsapp = doc(1080, 1920, `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;padding:0 80px;text-align:center">
  ${lockup(56, 34)}
  <div style="font-weight:900;font-size:64px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.1">Other builders bill<br>you in credits to fix<br><span class="sky">what we ship correct.</span></div>
  ${receipt(1.05)}
  <div class="mono" style="font-size:26px;color:#0EA5E9;border:1px solid rgba(14,165,233,.4);border-radius:999px;padding:14px 30px">wyberai.com · forward this 👆</div>
</div>`)

const assets = [
  { name: 'linkedin-1080x1350.png', w: 1080, h: 1350, html: linkedin },
  { name: 'instagram-1080x1080.png', w: 1080, h: 1080, html: instagram },
  { name: 'twitter-1200x675.png', w: 1200, h: 675, html: twitter },
  { name: 'reddit-1200x628.png', w: 1200, h: 628, html: reddit },
  { name: 'whatsapp-status-1080x1920.png', w: 1080, h: 1920, html: whatsapp },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
for (const a of assets) {
  await page.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 2 })
  await page.setContent(a.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUT, a.name), clip: { x: 0, y: 0, width: a.w, height: a.h } })
  console.log('wrote', path.join(OUT, a.name))
}
await browser.close()
console.log('done ->', OUT)

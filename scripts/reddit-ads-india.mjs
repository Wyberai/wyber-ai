// Generate WyberAi Reddit Ads creatives for India as real PNGs.
// Reuses the headless-Chrome pattern from scripts/social-assets.mjs.
// Reddit feed image specs: 1200x628 (link ad) + 1080x1080 (square) — both supported.
// Output: <Desktop>/wyberai-reddit-india/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'reddit-india')

// ---- brand primitives -------------------------------------------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden}.sky{color:#0EA5E9}.violet{color:#a855f7}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.26)}px">${MARK(m)}<div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const pill = (txt) => `<div class="mono" style="display:inline-flex;align-items:center;gap:8px;font-size:20px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:11px 24px;background:rgba(14,165,233,.06)">${txt}</div>`
const glow = `background:#09090b;background-image:radial-gradient(ellipse 70% 55% at 50% 22%, rgba(14,165,233,0.14) 0%, transparent 60%),radial-gradient(ellipse 50% 45% at 82% 88%, rgba(168,85,247,0.10) 0%, transparent 60%)`
const page = (w, h, bodyStyle, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${bodyStyle}">${inner}</body></html>`

// live-build terminal motif — resonates on r/developersIndia
const terminal = (scale = 1) => {
  const s = (n) => Math.round(n * scale)
  const row = (label, sub, done) => `<div style="display:flex;align-items:flex-start;gap:${s(11)}px;margin-bottom:${s(11)}px"><div style="width:${s(22)}px;height:${s(22)}px;border-radius:50%;background:${done?'rgba(34,197,94,.15)':'#0EA5E9'};border:1px solid ${done?'#22c55e':'#0EA5E9'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:${s(1)}px">${done?`<svg width="${s(11)}" height="${s(11)}" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#22c55e" stroke-width="1.9" stroke-linecap="round" fill="none"/></svg>`:`<div style="width:${s(7)}px;height:${s(7)}px;border-radius:50%;background:#fff"></div>`}</div><div><div style="color:${done?'#a1a1aa':'#fafafa'};font-weight:${done?600:700};font-size:${s(13)}px">${label}</div><div style="color:#52525b;font-size:${s(11)}px;margin-top:${s(2)}px" class="mono">${sub}</div></div></div>`
  return `<div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.09);border-radius:${s(14)}px;padding:${s(20)}px;width:${s(430)}px;box-shadow:0 ${s(30)}px ${s(80)}px rgba(0,0,0,.5)"><div style="display:flex;gap:${s(6)}px;margin-bottom:${s(16)}px;align-items:center"><div style="width:${s(10)}px;height:${s(10)}px;border-radius:50%;background:#ff5f57"></div><div style="width:${s(10)}px;height:${s(10)}px;border-radius:50%;background:#febc2e"></div><div style="width:${s(10)}px;height:${s(10)}px;border-radius:50%;background:#28c840"></div><span class="mono" style="margin-left:${s(8)}px;color:#52525b;font-size:${s(11)}px">wyberai.com — live build</span></div>${row('Prompt received','"Build a CRM with pipeline view"',true)}${row('Generating React code','14 files · Supabase schema',true)}${row('Self-heal check','0 errors · build clean',true)}${row('Deploying to Vercel','crm-app.vercel.app',false)}</div>`
}

const DARK = 'background:#09090b'

// ---- creatives --------------------------------------------------------------
const assets = [
  // 1200x628 — primary link ad, "ship tonight" hook
  { name: 'ad-1200x628-A-ship-tonight.png', w: 1200, h: 628, scale: 2,
    html: page(1200, 628, glow, `<div style="display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;padding:0 60px">${lockup(46,30)}<div style="font-weight:800;font-size:76px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.02">Describe an app.<br><span class="sky">Ship it tonight.</span></div><div style="font-size:26px;color:#a1a1aa;max-width:760px;line-height:1.5">Plain English in, a real deployed web or mobile app out — no engineers.</div>${pill('→ wyberai.com · free to start · pay with UPI')}</div>`) },

  // 1200x628 — India price hook
  { name: 'ad-1200x628-B-price-499.png', w: 1200, h: 628, scale: 2,
    html: page(1200, 628, glow, `<div style="display:flex;flex-direction:column;align-items:center;gap:26px;text-align:center;padding:0 60px">${lockup(44,28)}<div style="font-weight:800;font-size:70px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.05">Build a real app for<br><span class="sky">₹499</span><span style="font-size:40px;color:#71717a">/mo</span></div><div style="font-size:25px;color:#a1a1aa;max-width:720px;line-height:1.5">Full-stack apps from a prompt. Start free with 50 credits — no card needed.</div>${pill('wyberai.com · UPI accepted')}</div>`) },

  // 1200x628 — differentiator / dev-forward, with terminal
  { name: 'ad-1200x628-C-engineered.png', w: 1200, h: 628, scale: 2,
    html: page(1200, 628, glow, `<div style="display:flex;align-items:center;gap:56px;padding:0 68px;width:100%"><div style="flex:1;display:flex;flex-direction:column;gap:22px">${lockup(42,27)}<div style="font-weight:800;font-size:52px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1.08">Other AI builders<br>generate code and hope.<br><span class="sky">WyberAi engineers it.</span></div><div style="font-size:21px;color:#a1a1aa;line-height:1.5;max-width:440px">Self-healing builds. Live database security scans. Fresh code every time.</div>${pill('wyberai.com')}</div><div>${terminal(1)}</div></div>`) },

  // 1080x1080 — square, ship tonight
  { name: 'ad-1080x1080-A-ship-tonight.png', w: 1080, h: 1080, scale: 1,
    html: page(1080, 1080, glow, `<div style="display:flex;flex-direction:column;align-items:center;gap:40px;text-align:center;padding:0 80px">${lockup(56,36)}<div style="font-weight:800;font-size:96px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1">Describe<br>an app.<br><span class="sky">Ship it<br>tonight.</span></div><div style="font-size:30px;color:#a1a1aa;max-width:760px;line-height:1.5">A real deployed web or mobile app from one prompt.</div>${pill('wyberai.com · free · UPI')}</div>`) },

  // 1080x1080 — square, price
  { name: 'ad-1080x1080-B-price-499.png', w: 1080, h: 1080, scale: 1,
    html: page(1080, 1080, glow, `<div style="display:flex;flex-direction:column;align-items:center;gap:34px;text-align:center;padding:0 80px">${lockup(52,34)}<div style="font-size:34px;color:#a1a1aa;font-weight:600">Build a real app for</div><div style="font-weight:800;font-size:150px;letter-spacing:-0.05em;color:#0EA5E9;line-height:.9">₹499<span style="font-size:56px;color:#71717a;font-weight:700">/mo</span></div><div style="font-size:30px;color:#a1a1aa;max-width:720px;line-height:1.5">Start free with 50 credits. No card needed. Pay with UPI.</div>${pill('wyberai.com')}</div>`) },
]

// ---- render -----------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const pageObj = await browser.newPage()
for (const a of assets) {
  await pageObj.setViewport({ width: a.w, height: a.h, deviceScaleFactor: a.scale })
  await pageObj.setContent(a.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([pageObj.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await pageObj.evaluate(() => document.fonts.check('800 40px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 300))
  const outPath = path.join(OUT, a.name)
  await pageObj.screenshot({ path: outPath, clip: { x: 0, y: 0, width: a.w, height: a.h } })
  console.log('✓', a.name, interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — Reddit Ads creatives (India)
========================================
Brand: near-black #09090b, sky #0EA5E9, violet #a855f7, Inter + JetBrains Mono.

1200x628 (link ad, main format — use these first):
  ad-1200x628-A-ship-tonight.png   Hook: "Describe an app. Ship it tonight."
  ad-1200x628-B-price-499.png      Hook: India ₹499 price
  ad-1200x628-C-engineered.png     Dev-forward differentiator + live-build terminal

1080x1080 (square — good on mobile feed):
  ad-1080x1080-A-ship-tonight.png
  ad-1080x1080-B-price-499.png

Suggested split test: run A vs B vs C in one ad group, let Reddit optimize.
`)
console.log('\\nAll creatives in:', OUT)

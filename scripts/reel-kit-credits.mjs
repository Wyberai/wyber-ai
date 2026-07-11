// WyberAi — 9:16 Reel/Shorts kit #2: "credits vs free" positioning (post-launch).
// 1080x1920 frames you drop into CapCut/InShot around your screen-recording.
// Reuses the headless-Chrome pattern from scripts/social-assets.mjs.
// Output: OneDrive\Desktop\Wyber Ai\reels-kit-credits\  (Desktop is OneDrive-redirected)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'reels-kit-credits')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden}.sky{color:#0EA5E9}.violet{color:#a855f7}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.26)}px">${MARK(m)}<div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const pill = (txt) => `<div class="mono" style="display:inline-flex;align-items:center;gap:8px;font-size:32px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:16px 34px;background:rgba(14,165,233,.06)">${txt}</div>`
const glow = `background:#09090b;background-image:radial-gradient(ellipse 80% 40% at 50% 26%, rgba(14,165,233,0.16) 0%, transparent 60%),radial-gradient(ellipse 70% 40% at 50% 82%, rgba(168,85,247,0.12) 0%, transparent 60%)`
// safe zone: keep key content away from top/bottom 240px (IG/TikTok UI covers it)
const page = (bodyStyle, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:1080px;height:1920px;${bodyStyle}">${inner}</body></html>`
const stack = (inner, gap = 44) => `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${gap}px;padding:260px 90px">${inner}</div>`

const W = 1080, H = 1920

const frames = [
  // 1 — brand intro (opening sting, ~1s)
  { name: 'reel-01-intro.png', html: page(glow, stack(`
    ${MARK(200)}
    <div style="font-weight:800;font-size:120px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div>
    <div class="mono" style="font-size:30px;color:#71717a;letter-spacing:.12em">· BUILD IN PUBLIC ·</div>`)) },

  // 2 — hook cover (feed thumbnail + first frame)
  { name: 'reel-02-hook-cover.png', html: page(glow, stack(`
    <div class="mono" style="font-size:30px;color:#0EA5E9;letter-spacing:.1em">READ BEFORE YOU BUY AN APP BUILDER</div>
    <div style="font-weight:900;font-size:104px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.05">Ask it to fix your<br>security. <span class="sky">Watch your<br>credits disappear.</span></div>
    <div style="font-size:40px;color:#a1a1aa;line-height:1.4;max-width:820px">Here's what happens on most AI builders 👇</div>`, 48)) },

  // 3 — value text card (the problem, framed honestly)
  { name: 'reel-03-card-credits.png', html: page(glow, stack(`
    ${lockup(56,38)}
    <div style="font-weight:900;font-size:100px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.06">"Fix my SEO."<br>"Fix my security."<br><span style="color:#f87171">− credits, every time.</span></div>
    <div style="font-size:40px;color:#a1a1aa;line-height:1.45;max-width:820px">On most builders, these are follow-up requests that eat your monthly quota.</div>`, 56)) },

  // 4 — value text card (the differentiator / payoff)
  { name: 'reel-04-card-builtin.png', html: page(glow, stack(`
    ${lockup(56,38)}
    <div style="font-weight:900;font-size:104px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.05">WyberAi ships<br>security + SEO<br><span class="sky">correct, day one.</span></div>
    <div style="font-size:40px;color:#a1a1aa;line-height:1.45;max-width:840px">Nothing to fix later. 0 credits spent catching up on what should've been there from the start.</div>`, 56)) },

  // 5 — outro / follow CTA (grow followers, not sell)
  { name: 'reel-05-outro-follow.png', html: page(glow, stack(`
    ${MARK(170)}
    <div style="font-weight:900;font-size:120px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.02">Follow<br>for the <span class="sky">build.</span></div>
    <div style="font-size:44px;color:#a1a1aa;font-weight:600">@WyberAi</div>
    ${pill('wyberai.com · free · UPI')}`, 48)) },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await browser.newPage()
for (const f of frames) {
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await p.setContent(f.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([p.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await p.evaluate(() => document.fonts.check('900 60px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 300))
  await p.screenshot({ path: path.join(OUT, f.name), clip: { x: 0, y: 0, width: W, height: H } })
  console.log('✓', f.name, interOk ? '(Inter ✓)' : '(FALLBACK ⚠)')
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — 9:16 Reel Kit #2: "credits vs free" (1080x1920, safe-zoned for IG/TikTok/Shorts/LinkedIn)
===========================================================================================
Drop these around your screen-recording in CapCut or InShot.

reel-01-intro.png         Brand open (1s at the very start)
reel-02-hook-cover.png    Hook + cover thumbnail
reel-03-card-credits.png  Value card — the problem (credits burned on fixes elsewhere)
reel-04-card-builtin.png  Value card — the payoff (WyberAi ships it correct, day one)
reel-05-outro-follow.png  End card — FOLLOW cta (not a sales cta)

Typical reel = intro (1s) -> hook (2s) -> your screen-recording of asking
another builder to "fix security/SEO" and watching credits drop (if you can
screen-record it) OR just the two value cards -> outro follow card (2s).
15-30s total.
`)
console.log('\\nReel kit in:', OUT)

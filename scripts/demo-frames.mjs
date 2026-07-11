// WyberAi — static wrap frames for the demo video cuts.
// Renders intro/end-card (16:9) and the 9:16 / 4:5 shells the screen recording
// gets overlaid into with ffmpeg. Same pattern as scripts/campaign-jul11.mjs.
// Output: OneDrive\Desktop\Wyber Ai\campaign-jul11\demo-video\frames\
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'campaign-jul11', 'demo-video', 'frames')
fs.mkdirSync(OUT, { recursive: true })

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:#f4f4f5}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}.dim{color:#a1a1aa}.faint{color:#71717a}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m * 0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const GLOW = `background:#09090b;background-image:radial-gradient(ellipse 80% 50% at 50% 30%, rgba(14,165,233,0.15) 0%, transparent 62%)`
const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${GLOW}">${body}</body></html>`
const center = (inner, gap = 40) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${gap}px">${inner}</div>`

// footage geometry (1600x900 source):
//   reel  9:16 → 984x553.5 ≈ 984x554  at x=48,  y=683
//   feed  4:5  → 984x554               at x=48,  y=398
export const REEL_BAND = { x: 48, y: 683, w: 984, h: 554 }
export const FEED_BAND = { x: 48, y: 398, w: 984, h: 554 }

const frames = [
  { name: 'intro-1920x1080.png', w: 1920, h: 1080, html: page(1920, 1080, center(`
      ${MARK(190)}
      <div style="font-weight:800;font-size:110px;letter-spacing:-0.05em;line-height:1">Wyber<span class="sky">Ai</span></div>
      <div class="dim" style="font-size:40px">Watch one prompt become a live app.</div>
      <div class="mono faint" style="font-size:26px;letter-spacing:.14em">REAL BUILD · REAL TIME</div>`)) },

  { name: 'endcard-1920x1080.png', w: 1920, h: 1080, html: page(1920, 1080, center(`
      ${lockup(120, 92)}
      <div style="font-weight:800;font-size:76px;letter-spacing:-0.045em;line-height:1.1">One prompt. Web <span class="sky">and</span> mobile apps.</div>
      <div class="dim" style="font-size:36px">Free to start · security-scanned · code you own</div>
      <div class="mono" style="font-size:34px;color:#fff;background:#0EA5E9;border-radius:999px;padding:20px 52px">wyberai.com</div>`)) },

  { name: 'reel-shell-1080x1920.png', w: 1080, h: 1920, html: page(1080, 1920, `
      <div style="position:absolute;top:280px;left:0;right:0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:28px;padding:0 80px">
        <div class="mono sky" style="font-size:26px;letter-spacing:.16em">WYBERAI · LIVE BUILD</div>
        <div style="font-weight:800;font-size:76px;letter-spacing:-0.045em;line-height:1.08">One prompt.<br>A <span class="sky">live app</span>.</div>
      </div>
      <div style="position:absolute;left:${REEL_BAND.x - 10}px;top:${REEL_BAND.y - 10}px;width:${REEL_BAND.w + 20}px;height:${REEL_BAND.h + 20}px;border:1px solid rgba(14,165,233,.35);border-radius:24px;background:#000"></div>
      <div style="position:absolute;bottom:220px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:22px">
        ${lockup(64, 48)}
        <div class="mono" style="font-size:24px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:12px 30px">wyberai.com · free to start</div>
      </div>`) },

  { name: 'feed-shell-1080x1350.png', w: 1080, h: 1350, html: page(1080, 1350, `
      <div style="position:absolute;top:90px;left:0;right:0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px;padding:0 70px">
        <div class="mono sky" style="font-size:23px;letter-spacing:.16em">WYBERAI · LIVE BUILD</div>
        <div style="font-weight:800;font-size:62px;letter-spacing:-0.04em;line-height:1.08">One prompt. A <span class="sky">live app</span> in minutes.</div>
      </div>
      <div style="position:absolute;left:${FEED_BAND.x - 10}px;top:${FEED_BAND.y - 10}px;width:${FEED_BAND.w + 20}px;height:${FEED_BAND.h + 20}px;border:1px solid rgba(14,165,233,.35);border-radius:24px;background:#000"></div>
      <div style="position:absolute;bottom:80px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:20px">
        ${lockup(56, 42)}
        <div class="dim" style="font-size:24px">Web &amp; mobile apps · security-scanned · code you own</div>
        <div class="mono" style="font-size:22px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:11px 26px">wyberai.com</div>
      </div>`) },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const pg = await browser.newPage()
for (const f of frames) {
  await pg.setViewport({ width: f.w, height: f.h, deviceScaleFactor: 1 })
  await pg.setContent(f.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([pg.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  await new Promise(r => setTimeout(r, 250))
  await pg.screenshot({ path: path.join(OUT, f.name), clip: { x: 0, y: 0, width: f.w, height: f.h } })
  console.log('✓', f.name)
}
await browser.close()
console.log('frames in', OUT)

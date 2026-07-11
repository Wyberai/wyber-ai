// Render two 1080x1350 (LinkedIn 4:5) cards for the launch video:
//   build-frame.png — title + logo, with an empty center band the GIF overlays into
//   press-card.png  — "In the press" end-card with the real headline + URL
// Reuses the brand primitives from social-assets.mjs / youtube-banner.mjs.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const page = (inner, bg = '#09090b') => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:1080px;height:1350px;background:${bg}">${inner}</body></html>`

// ── build-frame: title (top 0-438) + empty center band (438-912) + footer (912-1350)
const buildFrame = page(`
<div style="position:absolute;inset:0;background:radial-gradient(900px 500px at 50% 20%, rgba(14,165,233,0.16), transparent 60%)"></div>
<div style="position:absolute;top:0;left:0;right:0;height:438px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 70px">
  <div class="mono sky" style="font-size:22px;letter-spacing:0.18em;margin-bottom:20px">WYBERAI &nbsp;·&nbsp; LIVE BUILD</div>
  <div style="font-weight:800;font-size:64px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1.08">One prompt.<br>A <span class="sky">live app</span> in seconds.</div>
</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:438px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px">
  ${lockup(72, 52)}
  <div style="font-size:26px;color:#a1a1aa">Web &amp; mobile apps · security-scanned · code you own</div>
  <div class="mono" style="font-size:22px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:12px 28px">wyberai.com</div>
</div>`)

// ── press-card: understated, credible. Real headline + the einpresswire URL.
const pressCard = page(`
<div style="position:absolute;inset:0;background:radial-gradient(900px 520px at 50% 42%, rgba(14,165,233,0.14), transparent 62%)"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px;gap:0">
  <div style="margin-bottom:34px">${lockup(64, 46)}</div>
  <div class="mono sky" style="font-size:24px;letter-spacing:0.16em;margin-bottom:34px">🗞  IN THE PRESS</div>
  <div style="font-weight:800;font-size:52px;letter-spacing:-0.03em;color:#f4f4f5;line-height:1.22">"WyberAi Debuts AI App Builder That Tests Every App for Data Leaks Before Deployment"</div>
  <div class="mono" style="font-size:24px;color:#71717a;margin-top:40px">einpresswire.com</div>
</div>`)

const cards = [
  { name: 'build-frame.png', html: buildFrame },
  { name: 'press-card.png', html: pressCard },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
for (const c of cards) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
  await pg.setContent(c.html, { waitUntil: 'networkidle0' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: path.join(OUT, c.name), clip: { x: 0, y: 0, width: 1080, height: 1350 } })
  await pg.close()
  console.log('wrote', path.join(OUT, c.name))
}
await browser.close()
console.log('done')

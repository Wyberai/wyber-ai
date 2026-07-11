// Render the WyberAi YouTube channel banner + profile as real PNGs.
// Reuses the same headless-Chrome brand pattern as scripts/social-assets.mjs.
// Output: <OneDrive Desktop>/Wyber Ai/youtube/{youtube-banner,youtube-profile}.png
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'youtube')

// ---- brand primitives (identical to social-assets.mjs) ----------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const CHEVRON = (s) => `<svg width="${s}" height="${s}" viewBox="7 4 24 24" fill="none"><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const page = (w, h, bodyStyle, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${bodyStyle}">${inner}</body></html>`

const DARK = 'background:#09090b'

// ---- banner content ---------------------------------------------------------
// Everything sits inside a 1546px-wide column so it stays within YouTube's
// mobile-safe center area (1546x423) of the 2560x1440 canvas.
const bannerInner = `
<div style="position:absolute;inset:0;background:radial-gradient(1300px 620px at 50% 44%, rgba(14,165,233,0.20), transparent 62%), #09090b"></div>
<div style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:30px;width:1546px">
  ${lockup(120, 92)}
  <div style="font-weight:800;font-size:78px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.05">Build real apps from a <span class="sky">prompt</span>.</div>
  <div style="font-size:34px;color:#a1a1aa;line-height:1.4">Web + mobile &nbsp;·&nbsp; security-scanned &nbsp;·&nbsp; code you own</div>
  <div class="mono" style="font-size:22px;color:#0EA5E9;letter-spacing:0.04em;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:12px 28px;margin-top:8px">new videos weekly &nbsp;·&nbsp; wyberai.com</div>
</div>`

const assets = [
  { name: 'youtube-banner.png',  w: 2560, h: 1440, transparent: false,
    html: page(2560, 1440, DARK + ';position:relative', bannerInner) },
  { name: 'youtube-profile.png', w: 800,  h: 800,  transparent: false,
    html: page(800, 800, 'background:#0EA5E9', CHEVRON(470)) },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
for (const a of assets) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 1 })
  await pg.setContent(a.html, { waitUntil: 'networkidle0' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: path.join(OUT, a.name), omitBackground: a.transparent, clip: { x: 0, y: 0, width: a.w, height: a.h } })
  await pg.close()
  console.log('wrote', path.join(OUT, a.name))
}
await browser.close()
console.log('done ->', OUT)

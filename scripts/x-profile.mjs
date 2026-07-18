// WyberAi — X/Twitter profile assets: header banner (1500x500) + profile pic
// (400x400). Same brand pipeline as scripts/social-assets.mjs.
// Header safe zone: the avatar overlaps the bottom-left corner and mobile crops
// top/bottom ~60px, so keep key text centered and clear of the lower-left.
// Output: OneDrive\Desktop\Wyber Ai\campaign-jul11\x-profile\
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'campaign-jul11', 'x-profile')
fs.mkdirSync(OUT, { recursive: true })

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:#f4f4f5}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}.dim{color:#a1a1aa}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
// chevron only, for the circular profile pic (fills a sky square, crops to circle clean)
const CHEVRON = (s) => `<svg width="${s}" height="${s}" viewBox="7 4 24 24" fill="none"><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/></svg>`
const page = (w, h, bodyStyle, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${bodyStyle}">${inner}</body></html>`

const GLOW = `background:#09090b;background-image:radial-gradient(ellipse 70% 120% at 82% 12%, rgba(14,165,233,0.22) 0%, transparent 55%),radial-gradient(ellipse 60% 120% at 12% 95%, rgba(168,85,247,0.12) 0%, transparent 55%)`

const assets = [
  // ── personal/founder header banner 1500x500 (avatar = your face, bottom-left) ──
  { name: 'x-header-personal-1500x500.png', w: 1500, h: 500, scale: 2, bg: GLOW, inner: `
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:22px;padding:0 120px 40px">
      <div class="mono sky" style="font-size:20px;letter-spacing:.24em">BUILDING WYBERAI · IN PUBLIC</div>
      <div style="font-weight:800;font-size:64px;letter-spacing:-0.045em;line-height:1.06">Turn one prompt into<br>a <span class="sky">real app</span>.</div>
      <div class="dim" style="font-size:24px;letter-spacing:.01em">Web &amp; mobile · pentested before it ships · you own the code</div>
    </div>` },

  // ── profile pic 400x400, sky fill, white chevron (X crops to a circle) ──
  { name: 'x-avatar-400.png', w: 400, h: 400, scale: 2, bg: 'background:#0EA5E9',
    inner: `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${CHEVRON(230)}</div>` },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const pg = await browser.newPage()
for (const a of assets) {
  await pg.setViewport({ width: a.w, height: a.h, deviceScaleFactor: a.scale })
  await pg.setContent(page(a.w, a.h, a.bg, a.inner), { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([pg.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  await new Promise(r => setTimeout(r, 250))
  await pg.screenshot({ path: path.join(OUT, a.name), clip: { x: 0, y: 0, width: a.w, height: a.h } })
  console.log('✓', a.name)
}
await browser.close()
console.log('profile assets in', OUT)

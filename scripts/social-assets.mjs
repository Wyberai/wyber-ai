// Generate WyberAi social launch assets (FB + Instagram) as real PNGs.
// Reuses the same headless-Chrome pattern as scripts/png.mjs.
// Output: <Desktop>/wyberai-social-assets/{logo,facebook,instagram}
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'Desktop', 'wyberai-social-assets')

// ---- brand primitives -------------------------------------------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const CHEVRON = (s) => `<svg width="${s}" height="${s}" viewBox="7 4 24 24" fill="none"><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const step = (n, t) => `<div style="display:flex;align-items:center;gap:22px;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px 28px"><div class="mono sky" style="font-size:26px;font-weight:500">${n}</div><div style="font-size:30px;color:#e5e7eb">${t}</div></div>`
const page = (w, h, bodyStyle, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${bodyStyle}">${inner}</body></html>`

const DARK = 'background:#09090b'

// ---- asset definitions ------------------------------------------------------
const assets = [
  { dir: 'logo', name: 'logo-mark.png', w: 1024, h: 1024, scale: 1, transparent: true,
    html: page(1024, 1024, 'background:transparent', MARK(760)) },
  { dir: 'logo', name: 'logo-lockup-dark.png', w: 1200, h: 360, scale: 2, transparent: false,
    html: page(1200, 360, DARK, lockup(120, 88)) },

  // profile (identical for FB + IG) — full-bleed sky, circle-crops clean
  { dir: 'facebook', name: 'fb-profile.png', w: 512, h: 512, scale: 2, transparent: false, copyTo: ['instagram/ig-profile.png'],
    html: page(512, 512, 'background:#0EA5E9', CHEVRON(300)) },

  { dir: 'facebook', name: 'fb-cover.png', w: 820, h: 312, scale: 2, transparent: false,
    html: page(820, 312, DARK, `<div style="display:flex;flex-direction:column;align-items:center;gap:18px">${lockup(64,40)}<div style="font-size:22px;color:#c9d6e5">Build real apps with AI</div><div class="mono" style="font-size:14px;color:#6b7280;letter-spacing:.04em">free to start · web &amp; mobile apps</div></div>`) },

  { dir: 'facebook', name: 'fb-post-1.png', w: 1200, h: 630, scale: 2, transparent: false,
    html: page(1200, 630, DARK, `<div style="display:flex;flex-direction:column;align-items:center;gap:26px;text-align:center">${lockup(56,34)}<div style="font-weight:800;font-size:74px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.05">Build real apps<br>with AI</div><div style="font-size:26px;color:#a1a1aa;max-width:720px;line-height:1.5">Describe your idea — get a real, deployed web or mobile app.</div><div class="mono" style="font-size:18px;color:#0EA5E9;border:1px solid rgba(14,165,233,.35);border-radius:999px;padding:11px 24px">→ wyberai.com · free to start</div></div>`) },

  { dir: 'instagram', name: 'ig-post-1.png', w: 1080, h: 1080, scale: 1, transparent: false,
    html: page(1080, 1080, DARK, `<div style="display:flex;flex-direction:column;align-items:center;gap:34px;text-align:center">${MARK(150)}<div style="font-weight:800;font-size:96px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div><div style="font-size:36px;color:#c9d6e5">Build real apps with AI</div><div style="width:64px;height:3px;background:#0EA5E9;border-radius:2px"></div><div class="mono" style="font-size:24px;color:#6b7280">wyberai.com</div></div>`) },

  { dir: 'instagram', name: 'ig-post-2.png', w: 1080, h: 1080, scale: 1, transparent: false,
    html: page(1080, 1080, DARK, `<div style="display:flex;flex-direction:column;gap:44px;width:840px">${lockup(48,30)}<div style="font-weight:800;font-size:60px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1.1">From idea to app<br>in minutes</div><div style="display:flex;flex-direction:column;gap:16px">${step('01','Describe what you want to build')}${step('02','AI builds and wires it up')}${step('03','Deploy it live — web or mobile')}</div></div>`) },

  { dir: 'instagram', name: 'ig-post-3.png', w: 1080, h: 1080, scale: 1, transparent: false,
    html: page(1080, 1080, DARK, `<div style="display:flex;flex-direction:column;align-items:center;gap:30px;text-align:center">${MARK(120)}<div style="font-weight:800;font-size:84px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.05">Start building<br>— free</div><div style="font-size:34px;color:#a1a1aa">50 free credits. No card needed.</div><div style="margin-top:10px;font-size:32px;font-weight:700;color:#fff;background:#0EA5E9;border-radius:16px;padding:20px 46px">wyberai.com</div></div>`) },
]

// ---- render -----------------------------------------------------------------
for (const d of ['logo', 'facebook', 'instagram']) fs.mkdirSync(path.join(OUT, d), { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const pageObj = await browser.newPage()
for (const a of assets) {
  await pageObj.setViewport({ width: a.w, height: a.h, deviceScaleFactor: a.scale })
  await pageObj.setContent(a.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([pageObj.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await pageObj.evaluate(() => document.fonts.check('800 40px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 300))
  const outPath = path.join(OUT, a.dir, a.name)
  await pageObj.screenshot({ path: outPath, omitBackground: !!a.transparent, clip: { x: 0, y: 0, width: a.w, height: a.h } })
  for (const c of a.copyTo || []) fs.copyFileSync(outPath, path.join(OUT, c))
  console.log('✓', a.dir + '/' + a.name, a.transparent ? '' : (interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)'))
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — social launch assets
================================
All region-neutral, in-brand (near-black #09090b, sky #0EA5E9, Inter + JetBrains Mono).

logo/
  logo-mark.png        The sky ‹› mark, transparent. Use anywhere.
  logo-lockup-dark.png Mark + wordmark on dark. For headers/decks.

facebook/
  fb-profile.png       Profile picture. Upload as-is (crops to a circle).
  fb-cover.png         Page cover. Facebook size 820x312.
  fb-post-1.png        First feed post (1200x630).

instagram/
  ig-profile.png       Same mark — Instagram profile picture.
  ig-post-1.png        First post: brand intro (1080x1080).
  ig-post-2.png        Second post: how it works (1080x1080).
  ig-post-3.png        Third post: CTA (1080x1080).

Tip: post ig-post-1 → 2 → 3 in order so your grid reads as a set.
`)
console.log('\\nAll assets in:', OUT)

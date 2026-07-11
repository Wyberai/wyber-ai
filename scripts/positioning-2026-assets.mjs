// WyberAi — "2026 builder, not a 2020 one" + "Security & SEO: free" positioning set.
// Same headless-Chrome + brand pattern as scripts/social-assets.mjs.
// Formats: LinkedIn 4:5, IG/FB square, X/Twitter 16:9 link card, Story/Reel 9:16.
// Output: <OneDrive>/Desktop/Wyber Ai/positioning-2026/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'positioning-2026')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}.strike{color:#52525b;text-decoration:line-through;text-decoration-color:#3f3f46}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const pill = (t) => `<div class="mono" style="display:inline-flex;align-items:center;font-size:24px;font-weight:500;color:#0EA5E9;border:1px solid rgba(14,165,233,.4);background:rgba(14,165,233,.08);border-radius:999px;padding:12px 26px;white-space:nowrap">${t}</div>`
const glow = `background:radial-gradient(1100px 640px at 50% 18%, rgba(14,165,233,.16), transparent 60%), #09090b`
const doc = (w, h, inner, bg = glow) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${bg}">${inner}</body></html>`

// price-comparison row: feature name, "them" (struck through / paid), "us" (free)
const row = (feature, themLabel, usLabel) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:26px 32px;background:rgba(255,255,255,.02)">
  <div style="font-size:32px;font-weight:700;color:#e5e7eb">${feature}</div>
  <div style="display:flex;align-items:center;gap:28px">
    <span class="mono strike" style="font-size:24px">${themLabel}</span>
    <span class="mono" style="font-size:24px;color:#22c55e;font-weight:600">${usLabel}</span>
  </div>
</div>`

// ── 1) LinkedIn 4:5 (1080x1350) — the price-comparison hero
const linkedinCompare = doc(1080, 1350, `
<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:44px;padding:90px 80px">
  ${lockup(60, 38)}
  <div style="font-weight:900;font-size:64px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.08">Lovable charges<br>for security & SEO.<br><span class="sky">We don't.</span></div>
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:10px">
    ${row('DB security scan', 'paid add-on', 'free · every build')}
    ${row('SEO pack', 'paid add-on', 'free · every build')}
    ${row('Fresh, ownable code', 'templates', 'generated fresh')}
  </div>
  ${pill('wyberai.com · free to start')}
</div>`, 1080)

// ── 2) IG/FB square (1080x1080) — "2026 vs 2020" builder framing
const square2026 = doc(1080, 1080, `
<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;text-align:center;padding:0 90px">
  ${MARK(130)}
  <div class="mono sky" style="font-size:26px;letter-spacing:.16em">BUILT FOR 2026</div>
  <div style="font-weight:900;font-size:88px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.05">Stop building apps<br>like it's <span class="strike">2020</span>.</div>
  <div style="font-size:32px;color:#a1a1aa;line-height:1.5;max-width:820px">Real generated images, self-healing builds, and live security scans — not a drag-and-drop template from five years ago.</div>
  ${pill('wyberai.com')}
</div>`)

// ── 3) X/Twitter link card (1200x628)
const xLinkCard = doc(1200, 628, `
<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:30px;padding:0 84px">
  ${lockup(52, 32)}
  <div style="font-weight:900;font-size:66px;letter-spacing:-0.045em;color:#f4f4f5;line-height:1.06">The most powerful<br>app builder <span class="sky">isn't the oldest one.</span></div>
  <div style="font-size:26px;color:#a1a1aa;max-width:900px;line-height:1.5">Security scans and SEO — free, on every build. No paywalled essentials.</div>
</div>`)

// ── 4) Story/Reel 9:16 (1080x1920) — bold single-hit stat card
const story2026 = doc(1080, 1920, `
<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;text-align:center;padding:0 90px">
  ${lockup(56, 36)}
  <div style="font-weight:900;font-size:104px;letter-spacing:-0.05em;color:#f4f4f5;line-height:1.05">Security scan: <span class="sky">free.</span><br>SEO pack: <span class="sky">free.</span></div>
  <div style="font-size:36px;color:#a1a1aa;line-height:1.5">Other builders charge extra for the things that actually keep your app safe and findable.</div>
  ${pill('wyberai.com · free to start')}
</div>`)

const assets = [
  { name: 'linkedin-4x5-compare.png', w: 1080, h: 1350, html: linkedinCompare },
  { name: 'square-1x1-2026-vs-2020.png', w: 1080, h: 1080, html: square2026 },
  { name: 'x-linkcard-1200x628.png', w: 1200, h: 628, html: xLinkCard },
  { name: 'story-9x16-free-security-seo.png', w: 1080, h: 1920, html: story2026 },
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

// Single-image Meta ad — US small-business-automation campaign, same offer
// and visual system as scripts/meta-ad-us-founder-call.mjs (that one is a
// 3-card carousel; this is the single-frame version, condensing hook +
// checklist + CTA into one image since there's no swipe to spread it across).
// Copy verified against the real /us-consulting page (src/app/us-consulting/
// page.tsx) — same headline, same 30-min offer, same no-pricing rule.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-us-single-image')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:32px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:24px 44px;letter-spacing:-.01em">${t}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:21px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:11px 22px"><span style="width:8px;height:8px;border-radius:999px;background:#4ade80"></span>${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:16px"><div style="width:30px;height:30px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:18px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:25px;color:#e5e7eb;line-height:1.35">${t}</div></div>`
const BG = `background:radial-gradient(1100px 750px at 20% 6%, rgba(14,165,233,.17), transparent 60%), #05060a`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`

// One frame has to carry the whole ad — hook, proof, and CTA together —
// since there's no second/third card to spread the message across. Headline
// is verbatim from /us-consulting's H1 so anyone who clicks through sees the
// exact same words they just read in the ad, not a paraphrase.
function singleImage(w, h) {
  const body = `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:76px 80px 64px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(52, 32)}${badge('Free 30-min automation call')}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px">
      <div style="font-weight:900;font-size:58px;letter-spacing:-0.04em;color:#fafafa;line-height:1.14;max-width:860px">Still running your business by hand?<br>Get the one dashboard that fixes it.</div>
      <div style="font-size:26px;color:#a1a1aa;line-height:1.5;max-width:800px">Spreadsheets, texts, sticky notes, apps that don&rsquo;t talk to each other &mdash; you&rsquo;re already running a business, you don&rsquo;t have time to be your own IT department too.</div>
      <div style="display:flex;flex-direction:column;gap:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:30px;max-width:820px">
        ${check('30 minutes on Google Meet &mdash; no pitch, no card required')}
        ${check('We tell you exactly what&rsquo;s worth automating')}
        ${check('If it&rsquo;s worth building, our team builds it &mdash; not you')}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px">
      ${cta('Book your free call &rarr;')}
      <div class="mono" style="font-size:20px;color:#6b7280">wyberai.com/us-consulting &middot; usually responds same day</div>
    </div>
  </div>`
  return doc(w, h, body)
}

const W = 1080, H = 1080
fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await browser.newPage()
await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await p.setContent(singleImage(W, H), { waitUntil: 'domcontentloaded', timeout: 60000 })
try { await Promise.race([p.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
const interOk = await p.evaluate(() => document.fonts.check('900 40px Inter')).catch(() => false)
await new Promise(r => setTimeout(r, 300))
const outPath = path.join(OUT, 'single_image_1080x1080.png')
await p.screenshot({ path: outPath, clip: { x: 0, y: 0, width: W, height: H } })
console.log('✓ single_image_1080x1080.png', interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — US "Business Automation" single-image ad (1080x1080)
============================================================================
One frame carrying the full offer: headline verbatim from /us-consulting's
H1, pain-point body copy, 3-item proof checklist, and CTA + URL footer.

No pricing shown — same rule as the carousel version (real Done-For-You
pricing only comes up on the call itself). Landing link is
wyberai.com/us-consulting, matching the live page's copy and 30-min offer
exactly.

Companion assets: scripts/meta-ad-us-founder-call.mjs (3-card carousel,
same offer/system, for when you want the swipeable version instead).
`)
console.log('\nAd creative in:', OUT)

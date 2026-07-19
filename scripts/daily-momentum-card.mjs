// Renders the recurring "Day N" build-in-public momentum card — the one
// recurring visual device for the daily growth brief. Same headless-Chrome
// pattern as scripts/social-assets.mjs, kept in the established brand kit
// (near-black bg, sky #0EA5E9, Inter + JetBrains Mono).
//
// Usage: node scripts/daily-momentum-card.mjs <dayNumber> "<headline>" "<subline>" [outPath]
//   dayNumber  e.g. 1, 12, 47
//   headline   short stat/claim, e.g. "50 apps published this week"
//   subline    one supporting line, e.g. "up from 31 last week"
//   outPath    defaults to <Desktop>/wyberai-daily-cards/day-<N>.png
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const [, , dayArg, headlineArg, sublineArg, outArg] = process.argv
const day = String(dayArg ?? '1').trim()
const headline = (headlineArg ?? 'Building WyberAi in public').trim()
const subline = (sublineArg ?? '').trim()

// os.homedir()+'Desktop' resolves to the plain local Desktop, which is
// invisible here — this machine's real Desktop is OneDrive-redirected.
const OUT = outArg
  ? path.resolve(outArg)
  : path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'daily-cards', `day-${day}.png`)

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`

const W = 1080, H = 1080

const html = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head>
<body style="width:${W}px;height:${H}px;background:#09090b;position:relative">
  <!-- radial glow accents, brand-recurring device -->
  <div style="position:absolute;top:-160px;left:-160px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,0.22),transparent 70%);filter:blur(2px)"></div>
  <div style="position:absolute;bottom:-200px;right:-200px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,0.14),transparent 70%);filter:blur(2px)"></div>

  <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:38px;text-align:center;max-width:880px;padding:0 60px">
    <div class="mono sky" style="font-size:20px;letter-spacing:0.14em;font-weight:500;border:1px solid rgba(14,165,233,0.35);border-radius:999px;padding:9px 22px">BUILDING IN PUBLIC</div>

    <div style="font-weight:900;font-size:150px;letter-spacing:-0.04em;line-height:1;color:#f4f4f5">DAY <span class="sky">${day}</span></div>

    <div style="font-weight:800;font-size:44px;letter-spacing:-0.02em;line-height:1.25;color:#f4f4f5">${headline}</div>
    ${subline ? `<div style="font-size:24px;color:#9a9aad;line-height:1.5">${subline}</div>` : ''}

    <div style="margin-top:14px">${lockup(46, 30)}</div>
    <div class="mono" style="font-size:17px;color:#6b6b7d;letter-spacing:0.03em">wyberai.com</div>
  </div>
</body></html>`

fs.mkdirSync(path.dirname(OUT), { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
await new Promise(r => setTimeout(r, 300))
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } })
await browser.close()

console.log('✓ card rendered:', OUT)

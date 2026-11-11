// US free-call campaign creatives (Nov 11). Three concepts, two feed sizes each, all pointing at /us-consulting.
// Every line is taken from what the live page and the pricing page say: the headline, the 24-hour written plan, the three
// done-for-you sizes and their delivery times. No prices (same rule as the earlier US ads), no income claims, no
// "responds same day". Run: node scripts/meta-ad-us-nov11.mjs   Output: marketing/us-ads-nov11/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(process.cwd(), 'marketing', 'us-ads-nov11')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:#fafafa}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = s => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const lockup = () => `<div style="display:flex;align-items:center;gap:12px">${MARK(52)}<div style="font-weight:800;font-size:32px;letter-spacing:-.02em">Wyber<span class="sky">Ai</span></div></div>`
const badge = t => `<div style="font-size:21px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:9px 20px">${t}</div>`
const cta = t => `<div style="display:inline-flex;font-size:32px;font-weight:800;color:#03111c;background:#22c55e;border-radius:16px;padding:24px 44px;letter-spacing:-.01em">${t}</div>`
const url = `<div class="mono" style="font-size:20px;color:#6b7280">wyberai.com/us-consulting</div>`
const BG = `background:radial-gradient(1100px 750px at 20% 6%, rgba(14,165,233,.17), transparent 60%), #05060a`
const check = t => `<div style="display:flex;align-items:center;gap:16px;font-size:28px;font-weight:600"><div style="width:32px;height:32px;border-radius:999px;background:rgba(34,197,94,.18);color:#4ade80;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">&#10003;</div>${t}</div>`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const frame = (h, top, mid, bottom) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:${h > 1200 ? 96 : 72}px 80px 64px"><div style="display:flex;justify-content:space-between;align-items:center">${top}</div><div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:${h > 1200 ? 40 : 28}px">${mid}</div><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px">${bottom}</div></div>`
const H = (t, fs) => `<div style="font-weight:900;font-size:${fs}px;letter-spacing:-0.04em;line-height:1.1;max-width:900px">${t}</div>`
const P = t => `<div style="font-size:27px;color:#a1a1aa;line-height:1.5;max-width:820px">${t}</div>`

const concepts = {
  // 1. The idea -> plan promise, same words as the page headline.
  'a-idea-to-plan': (w, h) => doc(w, h, frame(h, lockup() + badge('Free &middot; 30 min &middot; Google Meet'),
    H('Have an app idea?<br><span class="sky">Leave with a plan to build it.</span>', 66) +
    P('30 minutes with the founder. Within 24 hours you get it in writing.') +
    `<div style="display:flex;flex-direction:column;gap:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:30px;max-width:820px">${check('Your MVP, scoped')}${check('The tools it needs')}${check('A fixed price and a date')}</div>`,
    cta('Book your free call &rarr;') + url)),

  // 2. Big builds: one for each kind of project.
  'b-big-builds': (w, h) => {
    const tile = (k, t) => `<div style="border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px 28px"><div class="mono" style="font-size:18px;color:#0EA5E9;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">${k}</div><div style="font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.2">${t}</div></div>`
    return doc(w, h, frame(h, lockup() + badge('Free planning call'),
      H('We build the big ones too.', 70) +
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px">${tile('SaaS', 'A scheduling platform for teams')}${tile('Web app', 'A two-sided marketplace')}${tile('Mobile app', 'A booking or delivery app')}${tile('Website', 'A business site that sells')}</div>` +
      P('Tell us the idea. We scope it on a free 30-minute call and quote a fixed price.'),
      cta('Book your free call &rarr;') + url))
  },

  // 3. Speed: the three sizes and their delivery times (from the pricing page).
  'c-days-not-months': (w, h) => {
    const row = (n, t) => `<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(255,255,255,.1);padding:22px 4px"><div style="font-size:32px;font-weight:700">${n}</div><div style="font-size:32px;font-weight:900;color:#0EA5E9">${t}</div></div>`
    return doc(w, h, frame(h, lockup() + badge('Free &middot; 30 min'),
      H('From idea to a live app in <span class="sky">days, not months.</span>', 66) +
      `<div style="max-width:820px;border-top:1px solid rgba(255,255,255,.1)">${row('Simple build', '24 hours')}${row('Medium build', '3 working days')}${row('Complex build', 'about 1 week')}</div>` +
      P('Fixed price, quoted in writing after a free 30-minute call.'),
      cta('Book your free call &rarr;') + url))
  },
}

const sizes = { square: [1080, 1080], feed45: [1080, 1350] }
fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
for (const [name, make] of Object.entries(concepts)) {
  for (const [sname, [w, h]] of Object.entries(sizes)) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
    await page.setContent(make(w, h), { waitUntil: 'domcontentloaded', timeout: 60000 })
    try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
    const ok = await page.evaluate(() => document.fonts.check('900 40px Inter')).catch(() => false)
    await new Promise(r => setTimeout(r, 300))
    const file = `${name}_${sname}.png`
    await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width: w, height: h } })
    console.log('✓', file, ok ? '(Inter ✓)' : '(fallback font)')
  }
}
await browser.close()
console.log('done:', OUT)

// Generate WyberAi Meta/Instagram carousel ad creatives (India — "no job, learn
// vibe coding" campaign) as real PNGs. Same headless-Chrome + brand pattern as
// scripts/meta-ad-india.mjs / scripts/meta-ad-us-carousel.mjs.
//
// Angle: build-a-skill + freelance/own-product income, NOT "sell on our
// marketplace" — the marketplace payout pipeline (src/app/api/marketplace/
// checkout/route.ts) only tracks seller_earning_usd in a ledger, it doesn't
// actually pay sellers out yet, so promising marketplace earnings here would
// be a deceptive-advertising risk. This campaign instead grounds the "earn
// money" claim in: (a) building apps for your own freelance/client work
// (ordinary freelancing, doesn't depend on any WyberAi payout feature), and
// (b) launching your own product. No specific income numbers claimed.
//
// India pricing is real (src/lib/plans.ts): Spark ₹499/mo, 100 credits/month,
// inrOnly. The free plan is explicitly hidden for INR users (hideForINR:
// true), so this — unlike the older meta-ad-india.mjs script — does NOT say
// "free to start".
//
// 3 cards, 1080x1080 (1:1) — Meta's carousel image spec, max 3 slides per user request.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-india-skillbuilders/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-india-skillbuilders')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:32px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:22px 42px;letter-spacing:-.01em">${t}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:20px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:10px 20px"><span style="width:8px;height:8px;border-radius:999px;background:#4ade80"></span>${t}</div>`
const pill = (t, accent) => `<div class="mono" style="display:inline-flex;align-items:center;font-size:24px;font-weight:500;color:${accent?'#0EA5E9':'#e5e7eb'};border:1px solid ${accent?'rgba(14,165,233,.4)':'rgba(255,255,255,.14)'};background:${accent?'rgba(14,165,233,.08)':'rgba(255,255,255,.03)'};border-radius:999px;padding:12px 22px;white-space:nowrap">${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:14px"><div style="width:28px;height:28px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:17px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:24px;color:#e5e7eb;line-height:1.35">${t}</div></div>`
const promptBar = (t) => `<div style="display:flex;align-items:center;gap:16px;width:100%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:16px;padding:20px 24px"><span class="mono sky" style="font-size:28px;font-weight:500">&rsaquo;</span><span class="mono" style="font-size:24px;color:#9ca3af">${t}<span style="color:#0EA5E9">|</span></span></div>`
const dots = (active, total) => `<div style="display:flex;gap:11px;justify-content:center">${Array.from({length:total},(_,i)=>`<div style="width:${i===active?22:9}px;height:9px;border-radius:999px;background:${i===active?'#0EA5E9':'rgba(255,255,255,.25)'}"></div>`).join('')}</div>`

const BG = `background:radial-gradient(1000px 650px at 22% 8%, rgba(14,165,233,.16), transparent 60%), #05060a`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const TOTAL = 3
const shell = (eyebrow, badgeText, headline, body, active) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:68px 72px 58px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(50, 31)}${badgeText ? badge(badgeText) : ''}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px">
      ${eyebrow ? `<div class="mono sky" style="font-size:24px;font-weight:500;letter-spacing:.12em">${eyebrow}</div>` : ''}
      <div style="font-weight:900;font-size:66px;letter-spacing:-0.04em;color:#fafafa;line-height:1.1">${headline}</div>
      ${body}
    </div>
    ${dots(active, TOTAL)}
  </div>`

// Card 1 — hook. Speaks to income/opportunity anxiety without naming
// employment status directly (avoids Meta's Special Ad Category friction and
// reads less exploitative). Real product claim: describe an idea in plain
// English, AI builds a real working app — verbatim mechanism from the site.
function card1(w, h) {
  const body = `<div style="font-size:30px;color:#a1a1aa;line-height:1.45;max-width:820px">No CS degree. No bootcamp. Just describe your idea in plain English — AI writes real, working software for you.</div>
    ${promptBar('build me an inventory tracker for my shop')}`
  return doc(w, h, shell('A SKILL THAT PAYS &middot; NO CODING BACKGROUND NEEDED', '1,000 builders &middot; 50% off', 'Anyone can learn<br>to build software now.', body, 0))
}

// Card 2 — proof of mechanism (how it actually works), grounded in real
// product behavior: self-healing builds, full-stack, live URL.
function card2(w, h) {
  const body = `<div style="display:flex;flex-direction:column;gap:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:30px">
      ${check('Describe it &mdash; get a real, working app in minutes')}
      ${check('Fixes its own errors while building &mdash; no debugging required')}
      ${check('Database, login &amp; a live URL included, not just a frontend')}
      ${check('Works for web apps and mobile apps')}
    </div>`
  return doc(w, h, shell('HOW IT WORKS', null, 'From idea to<br>live app. No code.', body, 1))
}

// Card 3 — the honest monetization angle: build for clients/your own
// business (ordinary freelancing — not a WyberAi payout promise) + real
// India pricing (Spark ₹499/mo, 100 credits, inrOnly per src/lib/plans.ts)
// with the live Independence Day promo verbatim from src/app/HomeClient.tsx:508
// ("Independence Day special: 50% off all plans with code WYBER50 through
// August 15") and the 1,000-creators milestone (src/lib/i18n/home-translations.ts:190-191).
// ₹499 halved = ₹249.50, shown rounded down to ₹249 as marketing copy typically does.
function card3(w, h) {
  const body = `<div style="font-size:28px;color:#a1a1aa;line-height:1.4;max-width:820px">Build apps for local shops, freelance clients, or your own idea &mdash; and charge for the work.</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">${pill('&#8377;249/mo &middot; was &#8377;499',true)}${pill('Code WYBER50',false)}${pill('Web + mobile',false)}</div>
    ${cta('Start building &rarr; wyberai.com')}
    <div class="mono" style="font-size:19px;color:#6b7280">50% off with code WYBER50 &middot; ends Aug 15</div>`
  return doc(w, h, shell('BUILD FOR CLIENTS &middot; OR LAUNCH YOUR OWN', 'Ends Aug 15', 'Turn this skill<br>into income.', body, 2))
}

const W = 1080, H = 1080
const assets = [
  { name: 'card1_hook_1080x1080.png', html: card1(W, H) },
  { name: 'card2_howitworks_1080x1080.png', html: card2(W, H) },
  { name: 'card3_cta_1080x1080.png', html: card3(W, H) },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await browser.newPage()
for (const a of assets) {
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await p.setContent(a.html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  try { await Promise.race([p.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]) } catch {}
  const interOk = await p.evaluate(() => document.fonts.check('900 40px Inter')).catch(() => false)
  await new Promise(r => setTimeout(r, 300))
  await p.screenshot({ path: path.join(OUT, a.name), clip: { x: 0, y: 0, width: W, height: H } })
  console.log('✓', a.name, interOk ? '(Inter ✓)' : '(FALLBACK FONT ⚠)')
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — India "learn to build, earn a skill" carousel (3 cards, 1080x1080)
============================================================================
card1_hook_1080x1080.png        "Anyone can learn to build software now." + live prompt-bar example + "1,000 builders · 50% off" badge
card2_howitworks_1080x1080.png  "From idea to live app. No code." — self-healing builds, full-stack, live URL
card3_cta_1080x1080.png         "Turn this skill into income." — build for clients/own idea + ₹249/mo (50% off ₹499 Spark) with code WYBER50, ends Aug 15

Angle note: deliberately does NOT promise marketplace resale earnings — the
marketplace payout pipeline only ledgers seller_earning_usd today, it doesn't
pay sellers out yet (src/app/api/marketplace/checkout/route.ts:11). The income
claim here is grounded in ordinary freelance/client work + building your own
product, both true regardless of that gap. No specific income figures claimed.

Discount is real and live on-site: Independence Day promo, code WYBER50, 50%
off all plans through Aug 15 2026 (src/app/HomeClient.tsx:508, src/lib/i18n/
home-translations.ts:190-191, src/lib/email/index.ts:1232-1234). The
"1,000 builders" milestone is the same real milestone the site banner and the
1,000-creators celebration email use — not an invented number.
`)
console.log('\nAll ad creatives in:', OUT)

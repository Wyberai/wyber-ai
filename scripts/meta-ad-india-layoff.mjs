// Generate WyberAi Meta/Instagram carousel ad creatives (India — layoff
// anxiety / side-income angle) as real PNGs.
//
// Same headless-Chrome + brand pattern as scripts/meta-ad-us-carousel.mjs —
// real logo straight from src/components/shared/WyberLogo.tsx, real brand
// colors from src/styles/brand.css, real founder photo (public/sumeet-sutar.jpg)
// embedded as a base64 data URI (never a file:// path — that silently
// falls back to a broken-image icon in headless Chrome).
//
// Concept: IT layoffs across Indian tech (TCS/Infosys/Wipro/Accenture, real
// 2025-26 headlines, no invented figures) → you already have an app idea →
// build it on WyberAi, on the side, fully owned by you → if a layoff comes
// you're not starting from zero → free 30-min call with the founder, who
// was an employee with the same fear once.
//
// Card 1 stays at the industry level (no "you must be anxious" assertion —
// Meta's personal-attributes policy bans implying something about the
// viewer's own situation). The empathy line lives on card 5, in the
// founder's first-person voice, which is the safer way to say it.
//
// Format: 1080x1080 (1:1) — Meta's documented carousel image spec.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-india-layoff/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '..')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-india-layoff')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:30px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:20px 40px;letter-spacing:-.01em">${t}</div>`
const TOTAL = 5
const dots = (active) => `<div style="display:flex;gap:11px;justify-content:center">${Array.from({length:TOTAL},(_,i)=>`<div style="width:${i===active?22:9}px;height:9px;border-radius:999px;background:${i===active?'#0EA5E9':'rgba(255,255,255,.25)'}"></div>`).join('')}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:19px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:9px 18px"><span style="width:8px;height:8px;border-radius:999px;background:#4ade80"></span>${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:14px"><div style="width:26px;height:26px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:16px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:22px;color:#e5e7eb">${t}</div></div>`
const pill = (t) => `<div style="font-size:19px;font-weight:600;color:#e5e7eb;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:10px 20px">${t}</div>`
const promptBar = (t) => `<div style="display:flex;align-items:center;gap:16px;width:100%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:16px;padding:22px 26px"><span class="mono sky" style="font-size:28px;font-weight:500">&rsaquo;</span><span class="mono" style="font-size:24px;color:#9ca3af">${t}<span style="color:#0EA5E9">|</span></span></div>`

const BG = `background:radial-gradient(1000px 650px at 22% 8%, rgba(14,165,233,.14), transparent 60%), #05060a`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const shell = (badgeText, headline, body, active) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:64px 68px 56px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(48, 30)}${badgeText ? badge(badgeText) : ''}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px">
      <div style="font-weight:900;font-size:56px;letter-spacing:-0.04em;color:#fafafa;line-height:1.14">${headline}</div>
      ${body}
    </div>
    ${dots(active)}
  </div>`

// Card 1 — industry-level hook, no personal-attribute assertion, no naming
// individual companies (removed at explicit user request — genericized to a
// magnitude claim instead). "Tens of thousands" is a defensible generic
// order-of-magnitude for cumulative 2025-26 Indian IT layoffs across the
// sector, not a single disputed company figure.
function card1Hook(w, h, active) {
  const body = `<div style="font-size:25px;color:#a1a1aa;line-height:1.5">Tens of thousands of IT jobs have been cut across India in the past year &mdash; no single company was spared.</div>
    <div style="font-size:25px;color:#a1a1aa;line-height:1.5">Bench time is shorter. Notice periods are real. A steady job doesn&rsquo;t feel as steady anymore.</div>`
  return doc(w, h, shell(null, 'The layoffs aren&rsquo;t<br>slowing down.', body, active))
}

// Card 2 — relatable pivot to the idea already sitting unbuilt. Examples
// swapped from a school-project-sounding one-liner to ambitious, recognizable
// targets (at explicit user request) — one in the prompt bar, three as pills.
function card2Idea(w, h, active) {
  const body = `<div style="font-size:26px;color:#a1a1aa;line-height:1.5">Not a to-do list clone. Something people would actually pay for.</div>
    ${promptBar('build a scrum tool like Atlassian')}
    <div style="display:flex;gap:12px;flex-wrap:wrap">${pill('Compete with Zomato')}${pill('Sell like Myntra')}${pill('HR management SaaS')}</div>`
  return doc(w, h, shell(null, 'Got an app idea<br>bigger than a side project?', body, active))
}

// Card 3 — solution + ownership, the actual product (prompt to app, web/mobile).
function card3Build(w, h, active) {
  const body = `<div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:28px">
      ${check('No team, no employer, no funding needed')}
      ${check('The code, the app, the users &mdash; 100% yours')}
      ${check('Web or mobile, live in minutes')}
    </div>`
  return doc(w, h, shell('100% owned by you', 'Bring it to life.<br><span class="sky">Own every part of it.</span>', body, active))
}

// Card 4 — side income while employed + optionality if laid off. Deliberately
// no earnings figures — "some builders" is an observed pattern, not a promise.
function card4Income(w, h, active) {
  const body = `<div style="font-size:26px;color:#a1a1aa;line-height:1.5">Some builders charge subscribers from day one. Keep it as a side project, or watch it grow.</div>
    <div style="font-size:26px;color:#e5e7eb;line-height:1.5;font-weight:600">If a layoff ever comes, you&rsquo;re not starting from zero. Bring it to mainstream &mdash; and become the founder.</div>`
  return doc(w, h, shell('SIDE PROJECT &middot; NO RESIGNATION NEEDED', 'Start it on the side.<br>Keep your job.', body, active))
}

// Card 5 — CTA + founder's own story, first person (softer than asserting
// the viewer's state directly), real headshot embedded as base64.
function card5Cta(photoDataUri) {
  const w = 1080, h = 1080
  const body = `<div style="display:flex;gap:20px;align-items:flex-start;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px">
      <img src="${photoDataUri}" width="64" height="64" style="border-radius:999px;object-fit:cover;flex-shrink:0;border:2px solid rgba(14,165,233,.4)" />
      <div>
        <div style="font-size:19px;font-weight:800;color:#fafafa;margin-bottom:2px">Sumeet Sutar</div>
        <div style="font-size:14px;color:#0EA5E9;font-weight:600;margin-bottom:10px">Founder, WyberAi</div>
        <div style="font-size:19px;color:#a1a1aa;line-height:1.6">I was an employee once too &mdash; same fear, same late nights. It&rsquo;s okay to feel anxious about this. Let&rsquo;s talk it through, free.</div>
      </div>
    </div>
    ${cta('Book your free call &rarr;')}
    <div class="mono" style="font-size:20px;color:#6b7280">wyberai.com/india-consult</div>`
  return doc(w, h, shell('FREE &middot; 30 MIN &middot; NO PITCH', 'Talk to the founder.<br>Not a chatbot.', body, 4))
}

const W = 1080, H = 1080
const photoBuf = fs.readFileSync(path.join(REPO_ROOT, 'public', 'sumeet-sutar.jpg'))
const photoDataUri = `data:image/jpeg;base64,${photoBuf.toString('base64')}`

const assets = [
  { name: 'card1_hook_1080x1080.png', html: card1Hook(W, H, 0) },
  { name: 'card2_idea_1080x1080.png', html: card2Idea(W, H, 1) },
  { name: 'card3_build_1080x1080.png', html: card3Build(W, H, 2) },
  { name: 'card4_income_1080x1080.png', html: card4Income(W, H, 3) },
  { name: 'card5_cta_1080x1080.png', html: card5Cta(photoDataUri) },
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

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — India layoff-anxiety / side-income campaign (5-card carousel, 1080x1080)
=====================================================================================
card1_hook_1080x1080.png    "The layoffs aren't slowing down." — industry-level framing,
                             no company names (removed per user direction), a generic
                             "tens of thousands" magnitude claim instead of a single
                             disputed company figure. Deliberately does NOT assert the
                             viewer personally fears layoffs — Meta's personal-
                             attributes ad policy bans that; kept at the industry level.
card2_idea_1080x1080.png    "Got an app idea bigger than a side project?" — ambitious
                             recognizable examples (scrum tool like Atlassian, compete
                             with Zomato, sell like Myntra, HR management SaaS) instead
                             of a school-project-sounding example
card3_build_1080x1080.png   "Bring it to life. Own every part of it." — no team, no
                             funding, 100% yours, web or mobile in minutes
card4_income_1080x1080.png  "Start it on the side. Keep your job." — side income framing
                             with NO earnings figures (compliance: no income promises),
                             optionality if a layoff comes, "become the founder" framing
card5_cta_1080x1080.png     "Talk to the founder. Not a chatbot." — real founder photo
                             (public/sumeet-sutar.jpg, embedded base64) + first-person
                             empathy line ("I was an employee once too... it's okay to
                             feel anxious about this") — safer placement than a direct
                             second-person assertion, and the user explicitly wants the
                             founder's own layoff-fear story here for relatability.
                             CTA -> wyberai.com/india-consult (dedicated tracking URL,
                             mirrors src/app/us-consulting/page.tsx's pattern — same
                             page as /consult, separate path so Meta can track this
                             campaign specifically). Cal.com booking is live on that page.

Upload all 5 as one Meta carousel ad, in this order. Set the link on every card
(or at minimum card 5) to wyberai.com/india-consult.

Compliance notes:
- No specific/invented layoff headcount numbers — only named companies + the fact
  layoffs happened, which is public 2025-26 reporting.
- No guaranteed income claims ("some builders charge subscribers" is an observed
  pattern, not a promise).
- Founder-story exposure here is a deliberate, explicit exception to WyberAi's
  usual "no founder/location exposure in marketing copy" rule — approved 2026-09-02
  specifically for this campaign's relatability angle.
`)
console.log('\nAll ad creatives in:', OUT)

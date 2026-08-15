// Generate WyberAi Meta/Instagram carousel ad creatives — "Free Founder Call"
// campaign, landing at wyberai.com/us-consulting. Same headless-Chrome +
// brand pattern as scripts/meta-ad-india-skillbuilders.mjs / scripts/
// meta-ad-us-carousel.mjs — pixel-perfect logo straight from the real SVG
// (src/components/shared/WyberLogo.tsx), same dark bg + sky-blue accent
// design system used everywhere else on wyberai.com.
//
// CURRENT STATE: src/app/us-consulting/page.tsx now re-exports
// src/app/consult/page.tsx (same page, second URL, kept separate to track
// Meta campaign traffic) — so this carousel is written to match /consult's
// real copy: "Have an app idea but don't know where to start?", free
// 30-min call, breakdown of credits/tools/MVP scope within 24 hours. No
// identity claim, no earnings claim, no pricing (the $199–799 DFY tiers,
// 50% off through Aug 15 2026 — src/app/pricing/PricingClient.tsx — come up
// on the call itself, never in the creative).
//
// ANGLE HISTORY (condensed — earlier passes targeted a since-retired
// version of /us-consulting that framed the deliverable as a "dashboard"
// for existing small-business owners, 45–50+, automating spreadsheets/
// texts by hand):
//   1. "Become a founder" (identity/aspiration) — dropped on the assumption
//      it would trip Meta's Employment Special Ad Category classifier.
//   2. "Build something worth selling" (earning-adjacent) — dropped on the
//      assumption of FTC Business Opportunity Rule exposure.
//   3. Dashboard/tool-consolidation angle, no identity claim — landed here
//      after re-checking both assumptions in #1–2 against source (neither
//      actually applied to this offer; the one real constraint is just
//      "no unverifiable earnings claims," which stays true below too).
//   4. That angle got re-litigated into an identity pitch, then reverted
//      back to the page's real (dashboard) copy when it drifted from card
//      to card — lesson: verify against the live page text before locking
//      any "theme," since the landing page is the real source of truth,
//      not the ad copy.
//   5. CURRENT — the page itself changed (now mirrors /consult instead of
//      running its own dashboard pitch), so the ad is rewritten to match
//      that, not reworked on its own terms again.
//
// OPEN QUESTION, not decided here: the 45–50+ small-business-owner Meta Ads
// Manager targeting was built for the old dashboard/automation pitch. Now
// that the landing page sells a general "have an app idea" call, that
// targeting may no longer be the right audience — this file doesn't change
// Ads Manager settings, so that's a decision to make separately, in Ads
// Manager, not something this comment resolves.
//
// 3 cards, 1080x1080 (1:1) — Meta's carousel image spec.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-us-founder-call/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-us-founder-call')

// Real founder headshot (Sumeet Sutar) — embedded as base64, same reasoning as the
// webfont links below: a file:// path is one relocated folder away from a broken
// image in headless Chrome, a data URI never breaks.
const FOUNDER_PHOTO_PATH = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'New DP.jpeg')
const founderPhotoDataUri = `data:image/jpeg;base64,${fs.readFileSync(FOUNDER_PHOTO_PATH).toString('base64')}`

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:30px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:22px 40px;letter-spacing:-.01em">${t}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:20px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:10px 20px"><span style="width:8px;height:8px;border-radius:999px;background:#4ade80"></span>${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:14px"><div style="width:28px;height:28px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:17px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:24px;color:#e5e7eb;line-height:1.35">${t}</div></div>`
const dots = (active, total) => `<div style="display:flex;gap:11px;justify-content:center">${Array.from({length:total},(_,i)=>`<div style="width:${i===active?22:9}px;height:9px;border-radius:999px;background:${i===active?'#0EA5E9':'rgba(255,255,255,.25)'}"></div>`).join('')}</div>`

const BG = `background:radial-gradient(1000px 650px at 22% 8%, rgba(14,165,233,.16), transparent 60%), #05060a`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const TOTAL = 3
const shell = (eyebrow, badgeText, headline, body, active) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:68px 72px 58px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(50, 31)}${badgeText ? badge(badgeText) : ''}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px">
      ${eyebrow ? `<div class="mono sky" style="font-size:24px;font-weight:500;letter-spacing:.12em">${eyebrow}</div>` : ''}
      <div style="font-weight:900;font-size:62px;letter-spacing:-0.04em;color:#fafafa;line-height:1.12">${headline}</div>
      ${body}
    </div>
    ${dots(active, TOTAL)}
  </div>`

// Card 1 — hook. /us-consulting now re-exports /consult (src/app/
// us-consulting/page.tsx), so this carousel is rewritten to match THAT
// page's real copy instead — headline is the verbatim H1 ("Have an app
// idea but don't know where to start?"), subhead trimmed from the page's
// own text, checklist pulled from its trust-badge row and subhead
// ("no commitment, no pitch"). The old "dashboard"/30-min small-business
// framing is retired along with the page content it was built to match.
function card1(w, h) {
  const body = `<div style="font-size:27px;color:#a1a1aa;line-height:1.45;max-width:840px">Book a free 30-min call with our Founder. Tell us your idea &mdash; we&rsquo;ll scope it and send you a full breakdown within 24 hours: credits needed, tools required, and a clear MVP plan.</div>
    <div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px">
      ${check('No deck, no brief needed &mdash; just tell us your idea')}
      ${check('Full breakdown within 24 hours &mdash; credits, tools &amp; MVP plan')}
      ${check('No commitment, no pitch &mdash; just the right advice')}
    </div>`
  return doc(w, h, shell('FREE 30-MINUTE CALL', 'Free founder call', 'Have an app idea<br>but don&rsquo;t know<br>where to start?', body, 0))
}

// Card 2 — mechanism, pulled directly from the real WHAT_HAPPENS flow on
// /consult (src/app/consult/page.tsx, now also served at /us-consulting) —
// no invented numbers/testimonials, just the real 30-minute scoping-call
// flow that page actually describes. No pricing on this card.
//
// Trust signal: a large poster-style photo fills the empty right-hand
// space this square format leaves once the headline wraps (first version
// used a 92px circle — too small to register while scrolling). Name/title
// overlay on a bottom gradient rather than sitting beside the photo, so
// the photo itself can run full-size. Trust line is identical verbatim
// text in both /consult (page.tsx:128) and the old /us-consulting
// (page.tsx:141) — didn't need to change when the page did.
function card2(w, h) {
  const photoCard = `<div style="position:relative;flex-shrink:0;width:380px;height:560px;border-radius:28px;overflow:hidden;border:2px solid rgba(14,165,233,.4);box-shadow:0 30px 90px rgba(0,0,0,.55)">
      <img src="${founderPhotoDataUri}" style="width:100%;height:100%;object-fit:cover;display:block" />
      <div style="position:absolute;left:0;right:0;bottom:0;padding:26px 26px 22px;background:linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,0))">
        <div style="font-size:25px;font-weight:800;color:#fff;letter-spacing:-.01em">Sumeet Sutar</div>
        <div style="font-size:18px;color:#38bdf8;font-weight:600;margin-top:2px">Founder &middot; WyberAi</div>
      </div>
    </div>`
  const textCol = `<div style="flex:1;display:flex;flex-direction:column;gap:24px;min-width:0;justify-content:center">
      <div class="mono sky" style="font-size:22px;font-weight:500;letter-spacing:.1em">30 MINUTES &middot; NO PITCH</div>
      <div style="font-weight:900;font-size:46px;letter-spacing:-0.03em;color:#fafafa;line-height:1.16">We&rsquo;ve scoped enough<br>apps to know exactly<br>what to ask.</div>
      <div style="font-size:19px;color:#a1a1aa;line-height:1.5">You&rsquo;re not talking to a sales rep or an AI chatbot &mdash; you&rsquo;re talking directly to the person who built WyberAi.</div>
      <div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px">
        ${check('You describe your idea &mdash; no deck or brief needed')}
        ${check('We ask the right questions &mdash; features, timeline, budget')}
        ${check('A full breakdown within 24 hours &mdash; credits, tools &amp; MVP plan')}
      </div>
    </div>`
  return doc(w, h, `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:68px 72px 58px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(50, 31)}${badge('Talk to our founder')}</div>
    <div style="flex:1;display:flex;align-items:center;gap:44px;margin-top:6px">
      ${textCol}
      ${photoCard}
    </div>
    ${dots(1, TOTAL)}
  </div>`)
}

// Card 3 — CTA. Headline, body, and button text are verbatim from
// /consult's real bottom CTA (page.tsx:152-158) — "Still not sure? Just
// show up." is the actual close on the live page, not an invented line.
function card3(w, h) {
  const body = `<div style="font-size:28px;color:#a1a1aa;line-height:1.4;max-width:820px">The call is free. The worst outcome is 30 minutes and a clear answer on whether your idea is worth building.</div>
    ${cta('Book your free call &rarr;')}
    <div class="mono" style="font-size:19px;color:#6b7280">wyberai.com/us-consulting &middot; Available 24/7 &middot; usually responds same day</div>`
  return doc(w, h, shell('BOOK YOUR FREE CALL', null, 'Still not sure?<br>Just show up.', body, 2))
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

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — US "Free Founder Call" carousel (3 cards, 1080x1080)
============================================================================
card1_hook_1080x1080.png        "Have an app idea but don't know where to start?" (verbatim H1) + checklist: no deck/brief needed, full breakdown within 24 hours, no commitment/no pitch.
card2_howitworks_1080x1080.png  "We've scoped enough apps to know exactly what to ask." (verbatim from the page) — real founder photo (Sumeet Sutar) + the real 30-min scoping-call steps.
card3_cta_1080x1080.png         "Still not sure? Just show up." (verbatim bottom-CTA headline) — "Book your free call →", matching the page's actual button text.

WHY THIS VERSION: src/app/us-consulting/page.tsx now re-exports src/app/
consult/page.tsx (same page, second URL) — the "dashboard"/30-min small-
business-automation pitch this carousel used to carry doesn't exist on the
live page anymore, so every card here is rewritten from /consult's actual
copy instead of reworking the old angle. See the top-of-file comment for
the full history of how the previous angle was built, reworked, and
eventually retired along with the page it was matching.

NO PRICING IN THE AD — by direction. The real Done-For-You tiers ($199/$399/
$799, 50% off through Aug 15 2026 → $99/$199/$399 — src/app/pricing/
PricingClient.tsx, src/lib/consultation-brief.ts) only come up on the call
itself, in the founder's scoping breakdown — not in the creative.

TRUST SIGNAL (card 2): real photo of founder Sumeet Sutar (source:
~/OneDrive/Desktop/Wyber Ai/New DP.jpeg, embedded as base64 — not a stock
photo, not AI-generated), his name, title, and the same "you're talking
directly to the person who built WyberAi" line that's identical, verbatim
text in both /consult (page.tsx:128) and the old /us-consulting (page.tsx:
141) — it didn't need to change when the page did.

STILL OPEN:
- TARGETING MISMATCH: the 45–50+, existing-small-business-owner Meta Ads
  Manager targeting (small business owners, Shopify/Square/QuickBooks
  signals) was built for the old dashboard/automation pitch aimed at people
  already running a business. The live page now sells a general "have an
  app idea" call — that targeting may no longer be the right audience for
  this creative. Not changed here; this is an Ads Manager decision, not a
  creative one, and it's undecided.
- Cards 1 and 3 still carry no face — only card 2 does. The first-seen
  frame in a carousel is card 1, and it's still text-only.
- This exact copy is untested — treat it as a hypothesis to validate with
  a small budget, not a scaled bet.

COPY NOTES:
- Headline, subhead, "What happens" steps, founder-block trust line, and
  bottom-CTA headline/body/button are all pulled directly from the live
  page (src/app/consult/page.tsx, now also served at /us-consulting) — not
  paraphrased from memory.
- "Founder" not "CEO" throughout — matches the real page copy, which titles
  Sumeet Sutar "Founder, WyberAi". No separate CEO title on a sole-founder
  company.
- No income figures, no "side income" language, no identity/aspiration
  claim ("become a founder," etc.) — matches the page's own restraint: it
  sells a scoping call and a breakdown, not a dream.
- Landing link is wyberai.com/us-consulting — a second URL for the same
  /consult content, kept separate so Meta campaign traffic can be tracked
  apart from organic /consult visits.
`)
console.log('\nAll ad creatives in:', OUT)

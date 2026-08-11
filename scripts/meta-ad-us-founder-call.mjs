// Generate WyberAi Meta/Instagram carousel ad creatives — "Free Founder Call"
// campaign targeting US small-business-owner audience (50+). Drives straight
// to a 1:1 scoping call for the MANAGED build service (we build it, not "you
// build it yourself"). FINAL angle (after two reworks — see git history /
// card1() comment for the earlier "become a founder" and "earn income"
// drafts that were tried and moved away from): TIME + TOOL CONSOLIDATION —
// replace the spreadsheets/texts/disconnected-apps a small business owner
// juggles with one real app. No identity claim, no earnings claim, no
// pricing anywhere in the creative. Same headless-Chrome + brand pattern as
// scripts/meta-ad-india-skillbuilders.mjs / scripts/meta-ad-us-carousel.mjs
// — pixel-perfect logo straight from the real SVG (src/components/shared/
// WyberLogo.tsx), same dark bg + sky-blue accent design system used
// everywhere else on wyberai.com.
//
// The real Done-For-You tiers this call is meant to lead into are $199/$399/
// $799 (src/app/pricing/PricingClient.tsx:508-510, same numbers in src/lib/
// consultation-brief.ts:19-22), currently 50% off through Aug 15 2026 — that
// pricing is intentionally NOT shown here; it lives on the call itself
// (per the real /consult page flow) and in the founder's scoping breakdown.
//
// Offer + call mechanics verified against the real /consult page
// (src/app/consult/page.tsx) — NOT invented:
//   - Free · 15 min · Google Meet · Worldwide, no card required — page badges
//   - 3-step flow (describe idea → right questions → breakdown in 24 hrs) —
//     WHAT_HAPPENS array on that page
//   - It's the FOUNDER on the call (Sumeet Sutar), not a "CEO" — the site
//     never uses that title (sole founder, no separate CEO), so the ad says
//     "founder" to match what the landing page actually says.
//
// Deliberately avoids a guaranteed-income claim ("side income", "$X/month")
// — Meta's ad policy (and basic honesty) treats unverifiable earnings claims
// as a compliance risk, especially for an older demographic. The angle
// instead: you already run a business / have domain expertise, our team
// builds the app for you — no developers to hire, no code to learn. No
// dollar income figures, no guarantees.
//
// Audience is NOT age-called-out in copy (identity/psychographic targeting —
// "you already run a business" — reads better than literally saying "for
// people 50+", and avoids ageist-framing risk). Age/interest targeting for
// this is a Meta Ads Manager config, not something baked into the creative.
//
// 3 cards, 1080x1080 (1:1) — Meta's carousel image spec.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-us-founder-call/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-us-founder-call')

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

// Card 1 — hook. Reworked once more per direction: away from the earning
// angle entirely, toward a pure TIME/CONSOLIDATION pitch — replace the pile
// of spreadsheets/texts/disconnected apps a small business owner is
// juggling with one real app. This sidesteps every risk category flagged so
// far: no identity claim ("become a founder"), no earnings claim (so no
// FTC Business Opportunity Rule exposure), no Employment-classifier risk on
// Meta. It's also the most directly true claim of the three drafts — the
// managed build's real mechanism (one custom app, with database/auth/
// integrations, replacing scattered tools) needs no framing gymnastics.
function card1(w, h) {
  const body = `<div style="font-size:29px;color:#a1a1aa;line-height:1.45;max-width:840px">Spreadsheets, texts, sticky notes, three apps that don&rsquo;t talk to each other &mdash; you&rsquo;re already running a business, you don&rsquo;t have time to be your own IT department too. Tell us what you&rsquo;re juggling. Our team builds the one real app that replaces it.</div>
    <div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px">
      ${check('Our team designs &amp; builds it &mdash; not you')}
      ${check('Bookings, records, payments &mdash; all in one place')}
      ${check('Web or mobile, real database &amp; login included')}
    </div>`
  return doc(w, h, shell('TIRED OF JUGGLING FIVE DIFFERENT APPS?', 'Free founder call', 'Stop stitching your<br>business together<br>by hand.', body, 0))
}

// Card 2 — mechanism, pulled directly from the real WHAT_HAPPENS steps on
// /consult (src/app/consult/page.tsx), plus one verified trust line already
// on that same page ("We've scoped enough apps to know exactly what to
// ask.") — no invented numbers/testimonials, just the one real proof
// statement that already exists in the product copy. No pricing on this card.
function card2(w, h) {
  const body = `<div class="mono sky" style="font-size:21px;font-weight:500">We&rsquo;ve scoped enough apps to know exactly what to ask.</div>
    <div style="display:flex;flex-direction:column;gap:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:30px">
      ${check('You describe your idea &mdash; no deck or brief needed')}
      ${check('We ask the right questions &mdash; features, timeline, budget')}
      ${check('You get a full breakdown within 24 hours &mdash; costs, tools, MVP plan')}
    </div>`
  return doc(w, h, shell('15 MINUTES &middot; NO PITCH', 'Talk to our founder', 'A real conversation<br>about what&rsquo;s slowing<br>you down.', body, 1))
}

// Card 3 — CTA. Drops the "become a founder" close from the prior draft —
// ends on the concrete, verifiable offer instead (free, no card, 24-hr
// response) rather than an identity payoff. "Founder" not "CEO" (matches
// the real page — sole founder, no separate CEO title).
function card3(w, h) {
  const body = `<div style="font-size:28px;color:#a1a1aa;line-height:1.4;max-width:820px">Free. No card required. No commitment. Just 15 minutes to map out everything you&rsquo;re juggling &mdash; and see what one app could replace.</div>
    ${cta('Pick your free slot &rarr;')}
    <div class="mono" style="font-size:19px;color:#6b7280">wyberai.com/consult &middot; usually responds same day</div>`
  return doc(w, h, shell('BOOK YOUR FREE CALL', null, 'Let&rsquo;s bring it<br>all together.', body, 2))
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
card1_hook_1080x1080.png        "Stop stitching your business together by hand." + checklist: our team builds it (not you), bookings/records/payments in one place, real database & login. Pure time/consolidation pitch — no identity claim, no earnings claim, no dollar figures.
card2_howitworks_1080x1080.png  "A real conversation about what's slowing you down." — the 3-step call flow + one real trust line ("We've scoped enough apps to know exactly what to ask"), both verbatim from wyberai.com/consult. No pricing on this card.
card3_cta_1080x1080.png         "Let's bring it all together." — free/no-card/no-commitment CTA: "map out everything you're juggling — and see what one app could replace."

FINAL ANGLE (after two reworks): the campaign moved through three distinct
hooks before landing here —
  1. "Become a founder" (identity/aspiration) — dropped: risked Meta's
     Employment/business-opportunity ad classifier silently stripping the
     50+ age targeting via Special Ad Category rules.
  2. "Build something worth selling" (earning-adjacent, no numbers) —
     dropped: pairing a paid offer ($99–399 managed build) with any earning
     angle in the same ad is the exact shape the FTC's Business Opportunity
     Rule and state Seller-Assisted-Marketing-Plan laws (California's is
     strictest) regulate, regardless of whether the claim is true.
  3. TIME + TOOL CONSOLIDATION (current) — replace the spreadsheets/texts/
     disconnected apps a small business owner juggles with one real app.
     No identity claim, no earnings claim, no regulated category at all —
     just a true, concrete description of what the managed build does.
This is also the most directly honest of the three: "one app replaces your
scattered tools" needs no framing gymnastics — it's just what a custom
full-stack build (database, auth, integrations) actually does for someone
currently running their business on spreadsheets and texts.

NO PRICING IN THE AD — by direction. The real Done-For-You tiers ($199/$399/
$799, 50% off through Aug 15 2026 → $99/$199/$399 — src/app/pricing/
PricingClient.tsx, src/lib/consultation-brief.ts) only come up on the call
itself, in the founder's scoping breakdown — not in the creative. If that
promo lapses or changes before the call happens, that's a founder-side
pricing update, not something this ad needs to track.

STILL OPEN / NOT FIXED BY THIS COPY PASS:
- No trust/credibility signal (name, photo, a real verified number) appears
  anywhere in the 3 slides — for a 50+ audience that's warier of scam-shaped
  business ads, that's arguably a bigger lever than any copy angle. Add one
  if/when you have something concrete and true to say (e.g. a real count of
  calls taken, a specific built example) — don't invent a number to fill
  this gap.
- /consult still frames "build it yourself" and "hire us" as equal next
  steps in its FAQ ("Not at all... use the breakdown to build on WyberAi
  yourself, hire someone else, or come back to us"). If this campaign's job
  is 1:1 meetings for the managed build, that page arguably shouldn't offer
  an equally-weighted DIY off-ramp to traffic coming from it.
- This entire angle is untested — treat as a hypothesis to validate with a
  small budget, not a scaled bet.

TARGETING (set this in Meta Ads Manager, not baked into the creative):
  Location: United States only
  Age: 50+ (or 45+ if you want more volume — Meta lets you narrow post-launch)
  Interests/behaviors: small business owners, Shopify/Square/QuickBooks
    (signals an existing operating business, not just an aspiring idea)
  Placements: Feed + Reels carousel (this is a 1:1 carousel spec, not 9:16)
  Audience layer: retarget site visitors + lookalike off existing
    consultation bookers/converted customers if you have enough seed data —
    this is a "book a call" ask, which converts better warm than cold
  Goal: this campaign optimizes for CALL BOOKINGS into the paid managed
    build (DFY), sold on the call — not self-serve signups. Don't route this
    traffic to /signup or the DIY builder in any follow-up creative/landing
    changes.

COPY NOTES:
- Sells the "become a tech founder" identity/aspiration, not a coding lesson
  and not a price point. The call itself is where the managed-build pitch
  and real pricing happen (per your direction — book the meeting, sell the
  dream, price it live).
- "Our team designs & builds it — not you" on card 1 exists specifically so
  the ad doesn't read as a DIY self-serve pitch, while still not mentioning
  price or the DFY product name directly.
- "Founder" not "CEO" throughout — matches the real /consult page copy
  (src/app/consult/page.tsx), which titles Sumeet Sutar "Founder, WyberAi".
  There's no separate CEO title on a sole-founder company; using "founder"
  keeps the ad and the landing page saying the same thing.
- No income figures or "side income" language — earnings claims for an app
  idea are unverifiable and a Meta ad-policy risk, especially targeting an
  older demographic. The ad sells clarity and ownership of an idea, not a
  guaranteed income stream.
- Landing link is wyberai.com/consult (the real page), not a bare Cal.com
  link — that page already handles objections (is this really free? am I
  obligated to hire you?) before the visitor reaches the calendar embed.
`)
console.log('\nAll ad creatives in:', OUT)

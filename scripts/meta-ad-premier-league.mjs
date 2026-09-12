// WyberAi — Wyber Premier League launch carousel (global, indie-hacker /
// build-in-public angle). Same headless-Chrome + brand pattern as
// scripts/meta-ad-india-skillbuilders.mjs / scripts/meta-ad-us-carousel.mjs.
//
// Every fact here is pulled directly from the live page (src/app/premier-league/
// page.tsx) and src/lib/challenge.ts, verified end-to-end on production before
// this was written (real submission + real vote + both emails confirmed
// received 2026-09-10):
//   - Prizes: $1,000 WPL Champion / $500 Fan Favorite / $300 Most Creative —
//     $1,800/month total. WPL Champion + Most Creative are team-picked; ONLY
//     Fan Favorite is community-voted. Card 2 states this precisely — it does
//     NOT claim the top prize is a popularity contest, which would be false.
//   - Free to enter, unlimited entries per person per month, one WIN per
//     person per month (can't sweep multiple slots).
//   - Web apps, websites, and SaaS only this round (no mobile) — stated as a
//     rule, not hidden, so nobody builds a disqualified entry.
//   - Winners announced the 1st of every month (currentWplMonth() in
//     src/lib/challenge.ts — calendar-month cycle).
//   - Entries are PRIVATE by default (never listed in a public gallery) — a
//     genuine, unusual-for-a-contest differentiator, used here as a real
//     selling point on card 3 rather than invented copy.
//
// No fabricated testimonials or "I won" claims — the contest hasn't run a
// cycle yet, so any implied social proof would be false. This carousel sells
// the offer itself, not a fake outcome.
//
// 3 cards, 1080x1080 (1:1) — Meta's carousel image spec.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-premier-league/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-premier-league')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:32px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:22px 42px;letter-spacing:-.01em">${t}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:20px;font-weight:600;color:#fbbf24;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:999px;padding:10px 20px"><span style="width:8px;height:8px;border-radius:999px;background:#fbbf24"></span>${t}</div>`
const pill = (t, accent) => `<div class="mono" style="display:inline-flex;align-items:center;font-size:24px;font-weight:500;color:${accent?'#0EA5E9':'#e5e7eb'};border:1px solid ${accent?'rgba(14,165,233,.4)':'rgba(255,255,255,.14)'};background:${accent?'rgba(14,165,233,.08)':'rgba(255,255,255,.03)'};border-radius:999px;padding:12px 22px;white-space:nowrap">${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:14px"><div style="width:28px;height:28px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:17px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:24px;color:#e5e7eb;line-height:1.35">${t}</div></div>`
const dots = (active, total) => `<div style="display:flex;gap:11px;justify-content:center">${Array.from({length:total},(_,i)=>`<div style="width:${i===active?22:9}px;height:9px;border-radius:999px;background:${i===active?'#0EA5E9':'rgba(255,255,255,.25)'}"></div>`).join('')}</div>`

const BG = `background:radial-gradient(1000px 650px at 22% 8%, rgba(168,85,247,.14), transparent 60%), radial-gradient(800px 500px at 85% 90%, rgba(14,165,233,.1), transparent 60%), #09090b`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const TOTAL = 3
const shell = (eyebrow, badgeText, headline, body, active) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:68px 72px 58px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(50, 31)}${badgeText ? badge(badgeText) : ''}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px">
      ${eyebrow ? `<div class="mono sky" style="font-size:24px;font-weight:500;letter-spacing:.12em">${eyebrow}</div>` : ''}
      <div style="font-weight:900;font-size:64px;letter-spacing:-0.04em;color:#fafafa;line-height:1.1">${headline}</div>
      ${body}
    </div>
    ${dots(active, TOTAL)}
  </div>`

// Card 1 — hook + the offer itself. Real prize figures, real cadence.
function card1(w, h) {
  const prizeCard = (emoji, amount, label, color) => `<div style="flex:1;border:1px solid ${color}45;background:${color}12;border-radius:18px;padding:22px 18px;text-align:center">
    <div style="font-size:30px;margin-bottom:6px">${emoji}</div>
    <div style="font-weight:900;font-size:34px;color:#fafafa;letter-spacing:-0.03em">${amount}</div>
    <div style="font-size:15px;color:#9ca3af;margin-top:4px">${label}</div>
  </div>`
  const body = `<div style="font-size:28px;color:#a1a1aa;line-height:1.45;max-width:840px">One evening. One idea. A real app you actually vibe-coded &mdash; and a shot at real cash, every single month.</div>
    <div style="display:flex;gap:14px">
      ${prizeCard('🏆', '$1,000', 'WPL Champion', '#f59e0b')}
      ${prizeCard('🥈', '$500', 'Fan Favorite', '#0EA5E9')}
      ${prizeCard('🎨', '$300', 'Most Creative', '#a855f7')}
    </div>`
  return doc(w, h, shell('THE VIBE CODING COMPETITION', 'FREE &middot; UNLIMITED ENTRIES', 'Skip Netflix tonight.<br>Vibe code something instead.', body, 0))
}

// Card 2 — how it actually works, precisely matching the real judging split
// (only Fan Favorite is community-voted — the top prize is NOT a popularity
// contest, and this card says so rather than implying otherwise).
function card2(w, h) {
  const body = `<div style="display:flex;flex-direction:column;gap:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:30px">
      ${check('Ship your best web app, website, or SaaS &mdash; vibe-coded on WyberAi')}
      ${check('Enter as many builds as you want &mdash; free every time')}
      ${check('Our team picks WPL Champion &amp; Most Creative')}
      ${check('The community votes Fan Favorite &mdash; share your link for votes')}
    </div>
    <div class="mono" style="font-size:20px;color:#6b7280">One win per person per month &middot; new winners the 1st of every month</div>`
  return doc(w, h, shell('HOW IT WORKS', null, 'Free to enter.<br>Unlimited shots.', body, 1))
}

// Card 3 — the differentiator (private entries, unusual for a contest) + CTA.
// This is a real, verified product fact (src/app/premier-league/page.tsx TRUST
// array), not invented copy — most build contests default to a public
// gallery; this one doesn't.
function card3(w, h) {
  const body = `<div style="font-size:28px;color:#a1a1aa;line-height:1.45;max-width:820px">Your entry is never posted to a public gallery. You get a private link &mdash; you decide who sees it.</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">${pill('Web apps, websites &amp; SaaS',false)}${pill('No code needed',true)}${pill('Global &middot; every country',false)}</div>
    ${cta('Start tonight &rarr; wyberai.com/premier-league')}`
  return doc(w, h, shell('YOUR IDEA STAYS YOURS', null, 'Private by default.<br>Never a public list.', body, 2))
}

const W = 1080, H = 1080
const assets = [
  { name: 'card1_hook_1080x1080.png', html: card1(W, H) },
  { name: 'card2_howitworks_1080x1080.png', html: card2(W, H) },
  { name: 'card3_privacy_cta_1080x1080.png', html: card3(W, H) },
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

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — Wyber Premier League launch carousel (3 cards, 1080x1080)
============================================================================
card1_hook_1080x1080.png          "Build something. Win real cash." + $1,000/$500/$300 prize cards
card2_howitworks_1080x1080.png    "Free to enter. Unlimited shots." — real judging split (team picks 2 slots, community votes Fan Favorite only)
card3_privacy_cta_1080x1080.png   "Private by default." — entries are never public + CTA to wyberai.com/premier-league

Audience: indie-hacker / build-in-public crowd (X, r/SideProject, r/indiehackers)
and the "idea stuck in a notes app" segment — people who will actually SUBMIT,
not just watch. Deliberately not using the layoff-anxiety or founder-call
angles from past campaigns — those were for a consulting funnel, this is a
fast, free, deadline-driven contest entry.

Every fact verified against the live page and a real end-to-end test
(real submission, real vote, both emails received) on 2026-09-10 before this
script was written — see the file header comment for exact source citations.
No fabricated testimonials: the contest hasn't completed a cycle yet, so no
"I won" or "I'm building X" claims are used anywhere in this creative.

Format note: static carousel, not video. A synthetic-influencer testimonial
would have to fabricate an outcome (nobody's won yet) — hold video for after
the first real winners exist (Oct 1), when there's real footage to show.
`)
console.log('\nAll ad creatives in:', OUT)

// Generate WyberAi Meta/Instagram carousel ad creatives (US test campaign) as real PNGs.
// Same headless-Chrome + brand pattern as scripts/meta-ad-india.mjs — pixel-perfect
// logo straight from the real SVG (src/components/shared/WyberLogo.tsx), no AI
// image-gen risk of a hallucinated glyph.
//
// 6 cards now (was 4) — the original set only showed product breadth + a demo +
// a CTA and was missing the actual differentiators wyberai.com leads with in its
// "WHY WYBER" section: self-healing builds, live security scanning, and a real
// full-stack (managed database, not just a frontend). Added two feature cards
// for that; copy pulled verbatim from src/lib/i18n/home-translations.ts
// (proof2Desc, proof3Desc, proof4Desc) — nothing invented.
//
// Copy/stats verified against source, not just the rendered page (which
// auto-localizes by IP — an earlier fetch showed India/UPI pricing). Format:
// 1080x1080 (1:1) — Meta's documented carousel image spec, not 9:16.
// Output: <OneDrive>/Desktop/Wyber Ai/meta-ads-us-carousel/
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'meta-ads-us-carousel')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
const BASE = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}.sky{color:#0EA5E9}.mono{font-family:'JetBrains Mono',ui-monospace,monospace}`
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const lockup = (m, w) => `<div style="display:flex;align-items:center;gap:${Math.round(m*0.24)}px"><div style="display:flex">${MARK(m)}</div><div style="font-weight:800;font-size:${w}px;letter-spacing:-0.04em;color:#f4f4f5;line-height:1">Wyber<span class="sky">Ai</span></div></div>`
const cta = (t) => `<div style="display:inline-flex;align-items:center;gap:12px;font-size:30px;font-weight:800;color:#fff;background:#0EA5E9;border-radius:16px;padding:20px 40px;letter-spacing:-.01em">${t}</div>`
const TOTAL = 8
const dots = (active) => `<div style="display:flex;gap:11px;justify-content:center">${Array.from({length:TOTAL},(_,i)=>`<div style="width:${i===active?22:9}px;height:9px;border-radius:999px;background:${i===active?'#0EA5E9':'rgba(255,255,255,.25)'}"></div>`).join('')}</div>`
const badge = (t) => `<div style="display:inline-flex;align-items:center;gap:9px;font-size:19px;font-weight:600;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:999px;padding:9px 18px"><span style="width:8px;height:8px;border-radius:999px;background:#4ade80"></span>${t}</div>`
const pill = (t) => `<div style="font-size:19px;font-weight:600;color:#e5e7eb;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:10px 20px">${t}</div>`
const check = (t) => `<div style="display:flex;align-items:center;gap:14px"><div style="width:26px;height:26px;border-radius:999px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:16px;font-weight:800;flex-shrink:0">&check;</div><div style="font-size:22px;color:#e5e7eb">${t}</div></div>`

const BG = `background:radial-gradient(1000px 650px at 22% 8%, rgba(14,165,233,.14), transparent 60%), #05060a`
const doc = (w, h, inner) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body style="width:${w}px;height:${h}px;${BG}">${inner}</body></html>`
const shell = (badgeText, headline, body, active) => `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:64px 68px 56px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(48, 30)}${badgeText ? badge(badgeText) : ''}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px">
      <div style="font-weight:900;font-size:58px;letter-spacing:-0.04em;color:#fafafa;line-height:1.12">${headline}</div>
      ${body}
    </div>
    ${dots(active)}
  </div>`

// Card 1 — hero line 1, straight off wyberai.com: "Build any digital product."
// + the product-type row (Web app / Mobile / Website / SaaS) from the same hero.
function cardHero(w, h, active) {
  const body = `<div style="font-size:26px;color:#a1a1aa;line-height:1.4">Web app, mobile app, website, or full SaaS &mdash; describe it once.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">${pill('Web app')}${pill('Mobile')}${pill('Website')}${pill('SaaS')}</div>`
  return doc(w, h, shell('50 free credits', 'Have an app idea?<br>Build any digital product.', body, active))
}

// Card 2 — self-healing builds + live security scanning, verbatim from
// home-translations.ts proof2Desc / proof3Desc ("WHY WYBER" section).
function cardReliability(w, h, active) {
  const iconChip = (bg, fg, glyph) => `<div style="width:38px;height:38px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;color:${fg};font-size:18px;font-weight:800;flex-shrink:0">${glyph}</div>`
  const feature = (glyph, glyphBg, glyphFg, title, desc) => `<div style="display:flex;gap:16px;align-items:flex-start">${iconChip(glyphBg, glyphFg, glyph)}<div><div style="font-size:23px;color:#e5e7eb;font-weight:700;margin-bottom:6px">${title}</div><div style="font-size:20px;color:#a1a1aa;line-height:1.5">${desc}</div></div></div>`
  const body = `<div style="display:flex;flex-direction:column;gap:22px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:28px">
      ${feature('&#8635;', 'rgba(14,165,233,.15)', '#0EA5E9', 'Self-healing builds', 'A broken import or a truncated file doesn&rsquo;t stop the build. WyberAi detects the failure and repairs itself &mdash; no red screen, no manual debugging.')}
      <div style="height:1px;background:rgba(255,255,255,.08)"></div>
      ${feature('&#10003;', 'rgba(34,197,94,.15)', '#4ade80', 'Live security scanning', 'Every publish is probed the same way an attacker would &mdash; real database testing, not a linter guessing at your schema.')}
    </div>`
  return doc(w, h, shell('Zero manual debugging', 'It builds itself.<br>And fixes itself.', body, active))
}

// Card 3 — full-stack out of the box, verbatim from proof4Desc / productWebBullet2.
function cardFullstack(w, h, active) {
  const body = `<div style="font-size:26px;color:#a1a1aa;line-height:1.4">Auth, database, API routes, file uploads &mdash; generated and wired up.</div>
    <div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:28px">
      ${check('WyberCloud &mdash; free managed database for 2 years')}
      ${check('No vendor sign-up, no separate database bill')}
      ${check('Your own live URL, ready to share')}
    </div>`
  return doc(w, h, shell(null, 'Not just a pretty<br>frontend.', body, active))
}

// Card 4 — terminal mockup using the ACTUAL build-log copy from wyberai.com's
// "IGNITION - BUILD" section (PROMPT RECEIVED / GENERATING REACT CODE / etc.),
// not invented code.
function cardTerminal(w, h, active) {
  const line = (label, sub, color) => `<div style="margin-bottom:16px"><div class="mono" style="font-size:16px;letter-spacing:.06em;color:${color||'#6b7280'}">${label}</div><div style="font-size:18px;color:#e5e7eb;margin-top:2px">${sub}</div></div>`
  return doc(w, h, `<div style="width:100%;height:100%;display:flex;flex-direction:column;padding:64px 68px 56px">
    <div style="display:flex;justify-content:space-between;align-items:center">${lockup(48, 30)}${badge('Live in minutes')}</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:22px;margin-top:6px">
      <div style="font-weight:900;font-size:42px;letter-spacing:-0.03em;color:#fafafa;line-height:1.15">AI builds it &mdash; live.</div>
      <div style="border-radius:20px;border:1px solid rgba(255,255,255,.1);background:#0b0d12;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)">
        <div style="display:flex;align-items:center;gap:10px;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.08)">
          <div style="width:12px;height:12px;border-radius:999px;background:#ef4444"></div>
          <div style="width:12px;height:12px;border-radius:999px;background:#f59e0b"></div>
          <div style="width:12px;height:12px;border-radius:999px;background:#22c55e"></div>
          <div class="mono" style="margin-left:8px;font-size:17px;color:#6b7280">wyberai.com &mdash; live build</div>
        </div>
        <div style="padding:24px 26px 4px">
          ${line('PROMPT RECEIVED', '"Build a CRM with pipeline view"', '#0EA5E9')}
          ${line('GENERATING REACT CODE', '14 files &middot; Supabase schema')}
          ${line('SECURITY SCAN', 'No leaks found &middot; all policies verified', '#22c55e')}
          ${line('DEPLOYING TO VERCEL', 'crm-abc123.vercel.app')}
        </div>
      </div>
    </div>
    ${dots(active)}
  </div>`)
}

// Card 5 — hero line 2 + the real stats bar from wyberai.com (800+ apps built,
// 30s avg build time, 4.9/5 rating) — no invented numbers.
function cardShip(w, h, active) {
  const stat = (n, l) => `<div style="flex:1;text-align:center"><div style="font-size:36px;font-weight:900;color:#fafafa;letter-spacing:-0.02em">${n}</div><div style="font-size:15px;color:#6b7280;margin-top:4px">${l}</div></div>`
  const body = `<div style="display:flex;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px 12px">
      ${stat('800+', 'apps built')}
      ${stat('30s', 'avg build time')}
      ${stat('4.9/5', 'user rating')}
    </div>`
  return doc(w, h, shell(null, 'Ship it in minutes.<br><span class="sky">Become a Tech Founder.</span>', body, active))
}

// Card 6 — "done-for-you" builds, the real /setup-call service (Cal.com
// booking, $99 scoping call credited toward the build, delivery from 24h to
// 1 week). This card's per-card link should point at wyberai.com/setup-call
// specifically, not the homepage — set that when wiring up the ad in Meta.
function cardDoneForYou(w, h, active) {
  const body = `<div style="font-size:26px;color:#a1a1aa;line-height:1.4">Skip the prompting. Book a 60-min call &mdash; our team scopes it, quotes it, and builds it for you.</div>
    <div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:28px">
      ${check('$99 scoping call &mdash; credited toward your build')}
      ${check('Delivery from 24 hours to 1 week')}
      ${check('GitHub repo &middot; live URL &middot; 7-day support')}
    </div>
    ${cta('Book your call &rarr;')}
    <div class="mono" style="font-size:22px;color:#6b7280">wyberai.com/setup-call</div>`
  return doc(w, h, shell('Done-for-you', 'Vibe coding feels hectic?<br><span class="sky">Let our team build it.</span>', body, active))
}

// Card 7 (of 8) — the real MCP server, copy verbatim from home-translations.ts
// (mcpHeadingPre/Emphasis, mcpLead, mcpTool1-6Desc). Note: this is a
// developer-facing feature (Claude/Cursor/Claude Code integration) inside a
// carousel otherwise targeted at a non-IT audience — added at explicit user
// request despite that mismatch.
function cardMcp(w, h, active) {
  const body = `<div style="font-size:24px;color:#a1a1aa;line-height:1.4">WyberAi ships a real MCP server &mdash; 34 tools. Create projects, run builds, inspect files, run SQL, scan for security holes, and publish live apps &mdash; without leaving your AI editor.</div>
    <div style="display:flex;flex-direction:column;gap:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:26px">
      ${check('Start a new app')}
      ${check('Kick off a build')}
      ${check('Audit for data leaks')}
      ${check('Ship it live')}
    </div>
    <div class="mono" style="font-size:20px;color:#6b7280">No other app builder lets you do this.</div>`
  return doc(w, h, shell('20 MCP tools', 'Drive it from<br><span class="sky">Claude, Cursor &amp; Claude Code.</span>', body, active))
}

// Card 8 — CTA, matching the site's own "50 FREE CREDITS · NO CARD · FROM
// {price}/MO" line (creditsLine in home-translations.ts).
function cardCta(w, h, active) {
  const body = `<div style="display:flex;flex-direction:column;gap:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:20px;padding:28px">
      ${check('50 free credits &middot; no card needed')}
      ${check('Web, mobile, website &amp; SaaS')}
      ${check('From $29/mo after your free credits')}
    </div>
    ${cta('Build it &mdash; free &rarr;')}
    <div class="mono" style="font-size:22px;color:#6b7280">wyberai.com</div>`
  return doc(w, h, shell(null, 'Build any digital product.<br><span style="color:#a1a1aa">Ship it in minutes.</span>', body, active))
}

const W = 1080, H = 1080
const assets = [
  { name: 'card1_hero_1080x1080.png', html: cardHero(W, H, 0) },
  { name: 'card2_reliability_1080x1080.png', html: cardReliability(W, H, 1) },
  { name: 'card3_fullstack_1080x1080.png', html: cardFullstack(W, H, 2) },
  { name: 'card4_terminal_1080x1080.png', html: cardTerminal(W, H, 3) },
  { name: 'card5_ship_1080x1080.png', html: cardShip(W, H, 4) },
  { name: 'card6_doneforyou_1080x1080.png', html: cardDoneForYou(W, H, 5) },
  { name: 'card7_mcp_1080x1080.png', html: cardMcp(W, H, 6) },
  { name: 'card8_cta_1080x1080.png', html: cardCta(W, H, 7) },
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

// Clean up stale files from earlier passes (wrong dimension, wrong card count/names).
for (const stale of [
  'card1_problem_1080x1920.png', 'card2_solution_1080x1920.png', 'card3_terminal_1080x1920.png', 'card4_cta_1080x1920.png',
  'card1_hero_1080x1080_old.png', 'card2_ship_1080x1080.png', 'card3_terminal_1080x1080.png', 'card4_cta_1080x1080.png',
  'card6_cta_1080x1080.png', 'card7_cta_1080x1080.png',
]) {
  const p2 = path.join(OUT, stale)
  if (fs.existsSync(p2)) fs.unlinkSync(p2)
}

fs.writeFileSync(path.join(OUT, 'README.txt'), `WyberAi — US test campaign carousel (8 cards, 1080x1080 — Meta's carousel spec)
====================================================================
card1_hero_1080x1080.png         "Have an app idea? Build any digital product." + Web/Mobile/Website/SaaS pills
card2_reliability_1080x1080.png  "It builds itself. And fixes itself." — self-healing builds + live security scanning
card3_fullstack_1080x1080.png    "Not just a pretty frontend." — WyberCloud managed database, 2 years free
card4_terminal_1080x1080.png     "AI builds it — live." terminal mockup using the actual build-log copy from wyberai.com
card5_ship_1080x1080.png         "Ship it in minutes. Become a Tech Founder." + real stats (800+ apps built, 30s avg build, 4.9/5)
card6_doneforyou_1080x1080.png   "Vibe coding feels hectic? Let our team build it." — the real /setup-call service
                                 (Cal.com booking, $99 scoping call credited toward build, 24h–1wk delivery).
                                 SET THIS CARD'S LINK TO wyberai.com/setup-call, not the homepage, when wiring the ad.
card7_mcp_1080x1080.png          "Drive it from Claude, Cursor & Claude Code." — real MCP server, 20 tools.
                                 NOTE: developer-facing feature in an otherwise non-IT-targeted carousel — added
                                 at explicit user request despite the audience mismatch. The MCP server itself
                                 is live/shipped, but the user flagged it needs security tightening (separate,
                                 unrelated work planned for later) — this card does not depend on that.
card8_cta_1080x1080.png          "Build any digital product. Ship it in minutes." + 50 free credits + Build it — free CTA

Copy pulled directly from wyberai.com's source (src/lib/i18n/home-translations.ts,
src/app/setup-call/page.tsx) — no invented claims, no "you don't need a developer"
agitation framing. Logo rendered from the real SVG (src/components/shared/WyberLogo.tsx)
— pixel-perfect, no AI image-gen risk.
`)
console.log('\nAll ad creatives in:', OUT)

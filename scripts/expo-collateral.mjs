// Tech Expo Gujarat collateral for the Xpro exhibitor profile: brochure (PDF), visiting card, product/service tiles.
// Usage: node scripts/expo-collateral.mjs [outDir]
import puppeteer from 'puppeteer-core'
import QRCode from 'qrcode'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve(process.argv[2] || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'xpro'))
fs.mkdirSync(OUT, { recursive: true })
const pub = p => pathToFileURL(path.resolve('public', p)).href
const ICON = pub('brand/wyberai-icon-512.png')
const URL_BROCHURE = 'https://wyberai.com/gujaratexpo?utm_source=brochure&utm_campaign=teg2026'
const URL_CARD = 'https://wyberai.com/gujaratexpo?utm_source=card&utm_campaign=teg2026'
const qr = async (u, dark = '#05060a', light = '#ffffff') => QRCode.toDataURL(u, { margin: 1, width: 400, color: { dark, light } })

const FONT = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">`
const BASE = `*{box-sizing:border-box}body{margin:0;background:#05060a;color:#f2f4f8;font-family:Inter,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sky{color:#0ea5e9}.mono{font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:.12em}
.logo{display:flex;align-items:center;gap:14px;font-weight:900;letter-spacing:-.03em}.logo img{border-radius:14px}.logo b{color:#0ea5e9}`

const TYPES = [
  { tag: 'WEBSITE', title: 'Your business, online', p: 'A shop, clinic, studio or firm, live by tonight with a WhatsApp enquiry button.' },
  { tag: 'WEB APP', title: 'Tools for your team', p: 'Trackers, approvals, invoices and dashboards that replace sheets and chat threads.' },
  { tag: 'MOBILE APP', title: 'An app people install', p: 'Orders, attendance or delivery proof on a phone, for your team or your customers.' },
  { tag: 'SAAS', title: 'A product you sell', p: 'Logins, a database and a link customers can sign up on. Ready to put in front of buyers.' },
]
const SERVICES = [
  { tag: 'SERVICE', slug: 'live-build', title: 'Live build at booth S23', p: 'Bring one problem. Watch WyberAi build the first screen in about 15 minutes.' },
  { tag: 'SERVICE', slug: 'automation', title: 'Business automation', p: 'Replace daily sheet and WhatsApp work with a tool built from your own description.' },
  { tag: 'SERVICE', slug: 'website-launch', title: 'Website launch', p: 'Describe your business and get a live website with a WhatsApp enquiry button.' },
  { tag: 'SERVICE', slug: 'client-prototype', title: 'Prototypes for client pitches', p: 'Win the pitch with a working prototype, not a deck. Real code you keep.' },
]
const EXAMPLES = [
  ['WEB APP', 'Job-work challan tracker', 'See what is out with each job worker and get a warning before the one-year return limit.'],
  ['WEB APP', 'GSTR-2B reconciliation', 'Upload both files, match by supplier GSTIN and invoice number, and get a list of suppliers to chase.'],
  ['MOBILE APP', 'Delivery proof on a phone', 'Drivers photograph the signed LR copy and the office sees delivered or pending live.'],
  ['WEB APP', 'Timesheet to invoice', 'Hours per developer, per client, then a monthly invoice in USD with the rupee value.'],
  ['WEBSITE', 'Wedding website with RSVP', 'An invitation page for each event, a venue map, an RSVP form and a live headcount.'],
  ['MOBILE APP', 'Placement season tracker', 'Companies, rounds, dates, results and prep notes in one place.'],
]
const STEPS = [['SAY IT', 'Describe it in plain words. An AI agent plans the build before it writes a line.'], ['SEE IT', 'Fresh code, never a template. A live preview.'], ['SHAPE IT', 'Change anything by chatting. It repairs its own failures.'], ['CHECK IT', 'Six checks run, including a data leak test right after you publish.'], ['SHIP IT', 'Push to your own GitHub and use your own domain.']]
const POWERS = [
  ['Data leak test', 'We probe your live database like an attacker, right after you publish, and flag a critical leak the moment we find it.'],
  ['Secret-key guard', 'If a secret key or service password is exposed in your code, publishing and export stop until it is removed.'],
  ['Security checklist', 'Run a full security checklist from the editor at any time, against the files WyberAi actually wrote.'],
  ['AI slop remover', 'Rules against the generic made-by-AI look are built into the builder, and a scanner quotes every sign it finds.'],
  ['Not a template', 'A design direction chosen for your kind of business, so it does not look like anyone else\u2019s.'],
  ['SEO + AEO friendly', 'On websites, an SEO pass with automatic fixes and an AI-readable copy of every page, for Google and AI answer engines.'],
]
const CARD = 'border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px 16px;background:rgba(255,255,255,.03)'

const brochure = async () => {
  const q = await qr(URL_BROCHURE, '#05060a', '#ffffff')
  const page = (inner) => `<section style="width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:16mm 16mm;background:#05060a">${inner}</section>`
  const p1 = page(`
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 45% at 70% 8%,rgba(14,165,233,.22),transparent 65%)"></div>
    <div style="position:relative">
      <div class="logo" style="font-size:26px"><img src="${ICON}" width="44" height="44"><span>Wyber<b>Ai</b></span></div>
      <div class="mono sky" style="margin-top:26mm;font-size:12px">TECH EXPO GUJARAT 2026 · BOOTH S23</div>
      <h1 style="margin:10px 0 0;font-size:66px;line-height:1;font-weight:900;letter-spacing:-.045em">Vibe coding<br><span class="sky">with superpowers.</span></h1>
      <p style="margin:18px 0 0;font-size:19px;line-height:1.5;font-weight:700;max-width:178mm">Vibe coding gives you a base. WyberAi gives you the whole app.</p>
      <p style="margin:8px 0 0;font-size:15px;line-height:1.55;color:#9aa4b5;max-width:150mm">An AI agent plans it, builds it, repairs it and checks it, with login, database and API wired up. Saves <b style="color:#f2f4f8">hundreds of hours</b> of research and vibe coding.</p>
      <div class="mono" style="margin-top:12mm;font-size:11px;color:#6b7488">WHAT YOU CAN BUILD</div>
      <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${TYPES.map(t => `<div style="${CARD}"><div class="mono" style="font-size:10px;color:#6b7488">${t.tag}</div><div style="font-size:18px;font-weight:900;letter-spacing:-.03em;margin-top:6px">${t.title}</div><div style="font-size:12px;line-height:1.5;color:#9aa4b5;margin-top:6px">${t.p}</div></div>`).join('')}
      </div>
      <div style="margin-top:10px;border:1px solid rgba(14,165,233,.5);background:rgba(14,165,233,.1);border-radius:14px;padding:14px 18px"><div class="mono sky" style="font-size:10px">REPLACE YOUR SAAS</div><div style="font-size:18px;font-weight:900;letter-spacing:-.03em;margin-top:6px">Your own, in-house.</div><div style="font-size:12.5px;line-height:1.5;color:#c3cbd8;margin-top:6px">Swap a SaaS you pay for with your own version, built around the features you actually use. You own the code.</div></div>
      <div style="position:absolute;left:0;right:0;top:232mm">
        <div class="mono" style="font-size:11px;color:#6b7488">HOW IT WORKS</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px">
          ${STEPS.map(([a, b], i) => `<div><div class="mono sky" style="font-size:10px">0${i + 1}</div><div style="font-weight:900;font-size:14px;margin-top:4px">${a}</div><div style="font-size:10.5px;line-height:1.45;color:#9aa4b5;margin-top:4px">${b}</div></div>`).join('')}
        </div>
      </div>
    </div>`)
  const p2 = page(`
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 40% at 20% 100%,rgba(14,165,233,.16),transparent 65%)"></div>
    <div style="position:relative">
      <div class="mono sky" style="font-size:12px">SIX SUPERPOWERS, BUILT IN</div>
      <h2 style="margin:8px 0 0;font-size:42px;line-height:1.02;font-weight:900;letter-spacing:-.04em">Vibe coding, <span class="sky">checked.</span></h2>
      <div style="margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${POWERS.map(([a, b], i) => `<div style="${CARD}"><div class="mono sky" style="font-size:10px">0${i + 1}</div><div style="font-size:17px;font-weight:900;letter-spacing:-.03em;margin-top:6px">${a}</div><div style="font-size:12px;line-height:1.5;color:#9aa4b5;margin-top:6px">${b}</div></div>`).join('')}
      </div>
      <p style="font-size:10px;color:#6b7488;margin:10px 0 0">The data leak test runs right after you publish. SEO + AEO applies to websites. Free public checks at wyberai.com/tools.</p>
      <div style="margin-top:10mm">
        <div class="mono" style="font-size:11px;color:#6b7488">AND THE BASICS</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;margin-top:10px">
          ${[['Real code, every time.', 'Real React and Tailwind written from scratch for every project.'], ['Self-healing builds.', 'A broken import or a cut-off file is repaired in the same run.'], ['Your code. Zero lock-in.', 'Push to your own GitHub repo and connect your own domain.']].map(([a, b]) => `<div><div style="font-weight:900;font-size:14px">${a}</div><div style="font-size:11.5px;line-height:1.5;color:#9aa4b5;margin-top:3px">${b}</div></div>`).join('')}
        </div>
      </div>
      <div style="position:absolute;left:0;right:0;top:218mm;display:flex;align-items:center;gap:18px;border:1px solid rgba(14,165,233,.5);background:rgba(14,165,233,.1);border-radius:18px;padding:16px 20px">
        <img src="${q}" width="96" height="96" style="border-radius:8px;background:#fff">
        <div><div style="font-size:24px;font-weight:900;letter-spacing:-.03em">Come and see it at booth S23.</div>
        <div style="font-size:13px;color:#9aa4b5;margin-top:4px">Tech Expo Gujarat · 27–29 Nov 2026 · from 9:30 AM<br>Gujarat University Convention and Exhibition Centre, Ahmedabad</div>
        <div class="mono sky" style="font-size:12px;margin-top:8px">WYBERAI.COM · HELLO@WYBERAI.COM</div></div>
      </div>
      <div style="position:absolute;left:0;right:0;top:279mm;font-size:9px;color:#6b7488">WyberAi is a product of Signalpulse Technologies LLC. Vibe coding with superpowers.</div>
    </div>`)
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>@page{size:A4;margin:0}${BASE}</style></head><body>${p1}${p2}</body></html>`
}

const card = async side => {
  const q = await qr(URL_CARD, '#05060a', '#ffffff')
  const front = `<div class="logo" style="position:absolute;left:70px;top:70px;font-size:50px"><img src="${ICON}" width="76" height="76"><span>Wyber<b>Ai</b></span></div>
    <div style="position:absolute;left:70px;top:230px;font-size:50px;line-height:1.02;font-weight:900;letter-spacing:-.045em">Build any digital product.<br><span class="sky">Ship it in minutes.</span></div>
    <div class="mono" style="position:absolute;left:70px;bottom:62px;font-size:22px;color:#0ea5e9;letter-spacing:.14em">DESCRIBE IT. SHIP IT.</div>`
  const back = `<div class="mono sky" style="position:absolute;left:70px;top:70px;font-size:22px">TECH EXPO GUJARAT 2026</div>
    <div style="position:absolute;left:70px;top:120px;font-size:84px;font-weight:900;letter-spacing:-.05em;line-height:1">Booth <span class="sky">S23</span></div>
    <div style="position:absolute;left:70px;top:250px;font-size:24px;line-height:1.5;color:#9aa4b5">27–29 Nov 2026 · from 9:30 AM<br>Gujarat University Convention<br>and Exhibition Centre, Ahmedabad</div>
    <div class="mono" style="position:absolute;left:70px;bottom:62px;font-size:24px;line-height:1.6">WYBERAI.COM<br><span class="sky">HELLO@WYBERAI.COM</span></div>
    <img src="${q}" width="190" height="190" style="position:absolute;right:70px;bottom:62px;border-radius:12px;background:#fff">`
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${BASE}html,body{width:1050px;height:600px;overflow:hidden}.c{position:relative;width:1050px;height:600px;background:radial-gradient(ellipse 70% 90% at 95% 5%,rgba(14,165,233,.25),transparent 65%),#05060a}</style></head><body><div class="c">${side === 'front' ? front : back}</div></body></html>`
}

const tile = t => `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${BASE}html,body{width:1000px;height:1000px;overflow:hidden}.c{position:relative;width:1000px;height:1000px;background:radial-gradient(ellipse 70% 60% at 85% 0%,rgba(14,165,233,.28),transparent 65%),#05060a}</style></head><body><div class="c">
  <div class="logo" style="position:absolute;left:80px;top:80px;font-size:44px"><img src="${ICON}" width="68" height="68"><span>Wyber<b>Ai</b></span></div>
  <div class="mono" style="position:absolute;left:80px;top:340px;font-size:28px;color:#0ea5e9">${t.tag}</div>
  <div style="position:absolute;left:80px;top:390px;width:840px;font-size:84px;font-weight:900;letter-spacing:-.045em;line-height:1.02">${t.title}</div>
  <div style="position:absolute;left:80px;top:640px;width:830px;font-size:32px;line-height:1.45;color:#9aa4b5">${t.p}</div>
  <div class="mono" style="position:absolute;left:80px;bottom:70px;font-size:22px;color:#6b7488">BOOTH S23 · TECH EXPO GUJARAT</div></div></body></html>`

const thumb = () => `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${BASE}html,body{width:1000px;height:1000px;overflow:hidden}.c{position:relative;width:1000px;height:1000px;background:radial-gradient(ellipse 80% 60% at 85% 0%,rgba(14,165,233,.3),transparent 65%),#05060a}</style></head><body><div class="c">
  <div class="logo" style="position:absolute;left:80px;top:80px;font-size:48px"><img src="${ICON}" width="72" height="72"><span>Wyber<b>Ai</b></span></div>
  <div class="mono" style="position:absolute;left:80px;top:340px;font-size:26px;color:#0ea5e9">BROCHURE</div>
  <div style="position:absolute;left:80px;top:390px;width:850px;font-size:88px;font-weight:900;letter-spacing:-.045em;line-height:1">Vibe coding<br><span class="sky">with superpowers.</span></div>
  <div class="mono" style="position:absolute;left:80px;bottom:80px;font-size:24px;color:#6b7488">BOOTH S23 · TECH EXPO GUJARAT</div></div></body></html>`

const cardSquare = async () => {
  const q = await qr(URL_CARD, '#05060a', '#ffffff')
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${BASE}html,body{width:1200px;height:1200px;overflow:hidden}.c{position:relative;width:1200px;height:1200px;background:radial-gradient(ellipse 80% 55% at 90% 0%,rgba(14,165,233,.3),transparent 65%),#05060a}</style></head><body><div class="c">
  <div class="logo" style="position:absolute;left:90px;top:90px;font-size:56px"><img src="${ICON}" width="84" height="84"><span>Wyber<b>Ai</b></span></div>
  <div style="position:absolute;left:90px;top:260px;width:1000px;font-size:84px;font-weight:900;letter-spacing:-.045em;line-height:1">Build any digital product.<br><span class="sky">Ship it in minutes.</span></div>
  <div class="mono" style="position:absolute;left:90px;top:520px;font-size:26px;color:#0ea5e9;letter-spacing:.14em">DESCRIBE IT. SHIP IT.</div>
  <div style="position:absolute;left:90px;right:90px;top:640px;height:2px;background:rgba(255,255,255,.14)"></div>
  <div class="mono sky" style="position:absolute;left:90px;top:690px;font-size:24px">TECH EXPO GUJARAT 2026</div>
  <div style="position:absolute;left:90px;top:730px;font-size:96px;font-weight:900;letter-spacing:-.05em;line-height:1">Booth <span class="sky">S23</span></div>
  <div style="position:absolute;left:90px;top:850px;font-size:26px;line-height:1.5;color:#9aa4b5">27–29 Nov 2026 · from 9:30 AM<br>Gujarat University Convention<br>and Exhibition Centre, Ahmedabad</div>
  <div class="mono" style="position:absolute;left:90px;bottom:80px;font-size:26px;line-height:1.7">WYBERAI.COM<br><span class="sky">HELLO@WYBERAI.COM</span></div>
  <img src="${q}" width="210" height="210" style="position:absolute;right:90px;bottom:80px;border-radius:14px;background:#fff">
</div></body></html>`
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
const tmp = path.join(OUT, '_tmp.html')
const load = async html => { fs.writeFileSync(tmp, html); await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready) }

await load(await brochure())
await page.pdf({ path: path.join(OUT, 'wyberai-brochure-A4.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
console.log('pdf brochure')
if (process.env.PREVIEW) { await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 }); await page.screenshot({ path: path.join(process.env.PREVIEW, 'brochure-preview.png'), fullPage: true }) }
if (process.env.ONLY !== 'brochure') {
await page.setViewport({ width: 1050, height: 600, deviceScaleFactor: 1 })
for (const side of ['front', 'back']) { await load(await card(side)); await page.screenshot({ path: path.join(OUT, `wyberai-visiting-card-${side}.png`) }); console.log('png card', side) }
for (const t of SERVICES) { await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 }); await load(tile(t)); await page.screenshot({ path: path.join(OUT, `service-${t.slug}.png`) }); console.log('png service', t.slug) }
await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 })
await load(await cardSquare()); await page.screenshot({ path: path.join(OUT, 'wyberai-visiting-card-1x1.png') }); console.log('png card square')
}
await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 })
await load(thumb()); await page.screenshot({ path: path.join(OUT, 'wyberai-brochure-thumbnail-1x1.png') }); console.log('png thumb')
await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1 })
if (process.env.ONLY !== 'brochure') for (const t of TYPES) { await load(tile(t)); const n = t.tag.toLowerCase().replace(/\s+/g, '-'); await page.screenshot({ path: path.join(OUT, `tile-${n}.png`) }); console.log('png tile', n) }
fs.rmSync(tmp, { force: true })
await browser.close()

// WyberAi — BYOS announcement: 7-slide carousel (4:5), X set (1:1), WhatsApp status (9:16) + copy.
// Brand: tokens + logo from OneDrive\Desktop\Wyber Ai\Brand Kit\ — the icon
// PNG is embedded as base64; fonts come from Google Fonts and are verified per render.
// Renders 7 slides at 1080x1350 (LinkedIn multi-image post / Instagram /
// Facebook) and a 4-slide 1080x1080 set for X.
// Output: OneDrive\Desktop\Wyber Ai\campaign-byos\
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const DESK = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai')
const OUT = path.join(DESK, 'campaign-byos')

// ---- brand tokens (Brand Kit reference sheet) -------------------------------
const T = {
  bg: '#05060a', raised: '#0a0c14', overlay: '#10131f',
  accent: '#0ea5e9', hot: '#38bdf8', dim: '#0369a1',
  text: '#e6edf6', textDim: '#8b94a7', faint: '#545c6e',
  ok: '#4ade80',
}
const b64 = (p) => fs.readFileSync(p).toString('base64')
// Google Fonts over the network. The sandpack Inter woff2 files fail to
// decode in Chrome (status "error" → silent Times/Arial fallback), so local
// embedding is not an option for Inter; render() verifies each face loaded.
const FONT_LINK = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=block" rel="stylesheet">`
const ICON = `data:image/png;base64,${b64(path.join(DESK, 'Brand Kit', 'wyberai-icon-256.png'))}`

const BASE = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:${T.text};background:${T.bg}}
.mono{font-family:'JetBrains Mono',monospace;font-weight:500}
.acc{color:${T.accent}}.hot{color:${T.hot}}.dimt{color:${T.textDim}}.faint{color:${T.faint}}.ok{color:${T.ok}}`

const lockup = (m) => `<div style="display:flex;align-items:center;gap:${Math.round(m * 0.3)}px">
  <img src="${ICON}" style="width:${m}px;height:${m}px;border-radius:${Math.round(m * 0.22)}px">
  <div style="font-weight:800;font-size:${Math.round(m * 0.7)}px;letter-spacing:-0.04em;line-height:1">Wyber<span class="acc">Ai</span></div></div>`

// Corner-tick frame — the same device as the brand's terminal UI cards.
const ticks = (w, h, inset) => {
  const L = 26, s = `position:absolute;width:${L}px;height:${L}px;border-color:${T.faint};border-style:solid;border-width:0`
  return `<div style="${s};left:${inset}px;top:${inset}px;border-left-width:2px;border-top-width:2px"></div>
<div style="${s};right:${inset}px;top:${inset}px;border-right-width:2px;border-top-width:2px"></div>
<div style="${s};left:${inset}px;bottom:${inset}px;border-left-width:2px;border-bottom-width:2px"></div>
<div style="${s};right:${inset}px;bottom:${inset}px;border-right-width:2px;border-bottom-width:2px"></div>`
}

const card = (k, inner, extra = '') =>
  `<div style="background:${T.raised};border:1px solid rgba(230,237,246,0.08);border-radius:${Math.round(22 * k)}px;padding:${Math.round(30 * k)}px;${extra}">${inner}</div>`

const termHead = (k, title) => `<div style="display:flex;align-items:center;gap:${Math.round(9 * k)}px;margin-bottom:${Math.round(22 * k)}px">
  ${['#f87171', '#fbbf24', '#4ade80'].map(c => `<span style="width:${Math.round(13 * k)}px;height:${Math.round(13 * k)}px;border-radius:50%;background:${c};opacity:.85"></span>`).join('')}
  <span class="mono faint" style="font-size:${Math.round(17 * k)}px;margin-left:${Math.round(10 * k)}px">${title}</span></div>`

// ---- slide scaffold (k scales everything: 1 = 4:5, 0.84 = 1:1) -------------
const scaffold = (w, h, k, s, index, total) => {
  const p = Math.round(86 * k)
  const dots = index != null ? `<div style="display:flex;gap:10px">${Array.from({ length: total }, (_, i) =>
    `<div style="width:${i === index ? 34 : 10}px;height:10px;border-radius:5px;background:${i === index ? T.accent : 'rgba(230,237,246,0.14)'}"></div>`).join('')}</div>` : '<div></div>'
  const right = s.cta ? '' : (index != null && index < total - 1
    ? `<div class="mono" style="font-size:${Math.round(20 * k)}px;color:${T.textDim};letter-spacing:.08em">SWIPE →</div>`
    : `<div class="mono faint" style="font-size:${Math.round(20 * k)}px">wyberai.com</div>`)
  return `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${BASE}</style></head>
<body style="width:${w}px;height:${h}px;position:relative;background:${T.bg};background-image:radial-gradient(ellipse 80% 38% at 50% 0%, rgba(14,165,233,0.13), transparent 65%)">
${ticks(w, h, Math.round(30 * k))}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:${p}px ${p}px ${Math.round(p * 0.82)}px">
  <div style="display:flex;align-items:center;justify-content:space-between">
    ${lockup(Math.round(54 * k))}
    ${index != null ? `<div class="mono faint" style="font-size:${Math.round(20 * k)}px">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>` : ''}
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:${Math.round(30 * k)}px">
    ${s.kicker ? `<div class="mono" style="font-size:${Math.round(21 * k)}px;letter-spacing:.18em;color:${T.accent}">${s.kicker}</div>` : ''}
    <div style="font-weight:800;font-size:${Math.round(84 * k * (s.hk ?? 1))}px;letter-spacing:-0.04em;line-height:1.04">${s.headline}</div>
    ${s.sub ? `<div class="dimt" style="font-size:${Math.round(32 * k)}px;line-height:1.48;max-width:${Math.round(860 * k)}px">${s.sub}</div>` : ''}
    ${s.visual ? `<div style="margin-top:${Math.round(10 * k)}px">${s.visual(k)}</div>` : ''}
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between">${dots}${right}</div>
</div></body></html>`
}

// ---- visuals ----------------------------------------------------------------
const chip = (k, t, on) => `<span class="mono" style="font-size:${Math.round(17 * k)}px;color:${on ? '#fff' : T.hot};background:${on ? T.accent : 'rgba(14,165,233,0.09)'};border:1px solid ${on ? T.accent : 'rgba(14,165,233,0.25)'};border-radius:${Math.round(8 * k)}px;padding:${Math.round(7 * k)}px ${Math.round(13 * k)}px">${t}</span>`
const label = (k, t) => `<div class="mono dimt" style="font-size:${Math.round(16 * k)}px;letter-spacing:.08em;margin-top:${Math.round(16 * k)}px">${t}</div>`


// ---- visuals ----------------------------------------------------------------
const WARN = '#f59e0b', BAD = '#f87171'
const tag = (k, color, t) => `<span class="mono" style="font-size:${Math.round(15 * k)}px;letter-spacing:.06em;color:${color};border:1px solid ${color}55;background:${color}14;border-radius:${Math.round(7 * k)}px;padding:${Math.round(5 * k)}px ${Math.round(11 * k)}px;white-space:nowrap">${t}</span>`
const row = (k, on, name, tg) => `<div style="display:flex;align-items:center;gap:${Math.round(18 * k)}px;padding:${Math.round(17 * k)}px 0;border-top:1px solid rgba(230,237,246,0.07)">
  <div style="flex:0 0 ${Math.round(34 * k)}px;height:${Math.round(34 * k)}px;border-radius:${Math.round(9 * k)}px;border:2px solid ${on ? T.accent : T.faint};background:${on ? T.accent : 'transparent'};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${Math.round(22 * k)}px">${on ? '✓' : ''}</div>
  <div style="flex:1;font-weight:700;font-size:${Math.round(29 * k)}px;letter-spacing:-0.02em;color:${on ? T.text : T.textDim}">${name}</div>${tg || ''}</div>`

// 100 cells, 5 lit: the whole pitch as one picture.
const LIT = new Set([11, 23, 34, 58, 77])
const cellsHtml = (cell, radius, glow) => Array.from({ length: 100 }, (_, i) => LIT.has(i)
  ? `<div style="width:${cell}px;height:${cell}px;border-radius:${radius}px;background:${T.accent};box-shadow:0 0 ${glow}px rgba(14,165,233,0.55)"></div>`
  : `<div style="width:${cell}px;height:${cell}px;border-radius:${radius}px;border:1.5px solid rgba(230,237,246,0.11)"></div>`).join('')
const gridVisual = (k) => {
  const cell = Math.round(60 * k), gap = Math.round(9 * k)
  return `<div style="display:grid;grid-template-columns:repeat(10,${cell}px);gap:${gap}px;justify-content:start">${cellsHtml(cell, Math.round(11 * k), Math.round(26 * k))}</div>`
}

const pasteVisual = (k) => card(k, termHead(k, 'wyberai.com/byos') + `
  <div class="mono" style="font-size:${Math.round(25 * k)}px;line-height:1.9">
    <div><span class="faint">$</span> paste <span class="hot">pipedrive.com</span></div>
    <div class="dimt">reading public pages…</div>
    <div style="margin-top:${Math.round(10 * k)}px"><span class="ok">✓</span> 33 features found</div>
    <div><span class="ok">✓</span> 12 modules mapped</div>
    <div><span class="ok">✓</span> fit checked, feature by feature</div>
  </div>`)

const pickVisual = (k) => card(k, `
  ${row(k, true, 'Kanban sales pipeline', tag(k, T.ok, 'WE BUILD IT'))}
  ${row(k, true, 'Email templates', tag(k, T.ok, 'WE BUILD IT'))}
  ${row(k, true, 'Sales dashboards and reports', tag(k, T.ok, 'WE BUILD IT'))}
  ${row(k, false, 'Calling and power dialer', tag(k, WARN, 'NEEDS TWILIO'))}
  ${row(k, false, 'Encrypted data and SOC 2', tag(k, BAD, 'WE CAN’T'))}`, 'padding-top:10px;padding-bottom:10px')

const honestVisual = (k) => `<div style="display:flex;flex-direction:column;gap:${Math.round(16 * k)}px">
  ${[[T.ok, 'WE BUILD IT', 'Kanban pipeline, email templates, dashboards, CSV import.'],
     [WARN, 'NEEDS AN OUTSIDE SERVICE', 'Bulk email needs Amazon SES. We write the code, you open the account.'],
     [BAD, 'WE CAN’T BUILD IT', 'SOC 2 certification. And Slack itself: “a platform, not a feature list.”']].map(([c, h, d]) =>
    `<div style="display:flex;gap:${Math.round(22 * k)}px;align-items:flex-start;background:${T.raised};border:1px solid ${c}40;border-left:${Math.round(6 * k)}px solid ${c};border-radius:${Math.round(14 * k)}px;padding:${Math.round(22 * k)}px ${Math.round(26 * k)}px">
      <div><div class="mono" style="font-size:${Math.round(17 * k)}px;letter-spacing:.12em;color:${c}">${h}</div>
      <div style="font-size:${Math.round(27 * k)}px;line-height:1.4;margin-top:${Math.round(8 * k)}px">${d}</div></div></div>`).join('')}</div>`

const ownVisual = (k) => card(k, [
  ['KEYS', 'Tools run on your own accounts and API keys.'],
  ['DATA', 'Goes in your own Supabase. Starts with sample data.'],
  ['DOMAIN', 'Deploy to a domain you own.'],
].map(([a, b], i) => `<div style="display:flex;gap:${Math.round(26 * k)}px;align-items:baseline;padding:${Math.round(22 * k)}px 0;${i ? 'border-top:1px solid rgba(230,237,246,0.07)' : ''}">
  <div class="mono acc" style="flex:0 0 ${Math.round(120 * k)}px;font-size:${Math.round(19 * k)}px;letter-spacing:.14em">${a}</div>
  <div style="font-size:${Math.round(30 * k)}px;line-height:1.38;font-weight:600;letter-spacing:-0.01em">${b}</div></div>`).join(''), 'padding-top:6px;padding-bottom:6px')

const statVisual = (k) => `<div style="display:flex;gap:${Math.round(22 * k)}px">
  ${[['under 10 min', '6 to 12 features, measured on real builds'], ['about 160', 'credits for a typical build, quoted before you start']].map(([n, d]) =>
    `<div style="flex:1;background:${T.raised};border:1px solid rgba(230,237,246,0.08);border-radius:${Math.round(20 * k)}px;padding:${Math.round(30 * k)}px">
      <div style="font-weight:900;font-size:${Math.round(58 * k)}px;letter-spacing:-0.045em;line-height:1" class="acc">${n}</div>
      <div class="dimt" style="font-size:${Math.round(24 * k)}px;line-height:1.4;margin-top:${Math.round(14 * k)}px">${d}</div></div>`).join('')}</div>`

const ctaVisual = (k) => `<div style="display:flex;flex-direction:column;gap:${Math.round(26 * k)}px;align-items:flex-start">
  <div style="background:${T.accent};color:#fff;font-weight:800;font-size:${Math.round(52 * k)}px;border-radius:${Math.round(20 * k)}px;padding:${Math.round(28 * k)}px ${Math.round(50 * k)}px;box-shadow:0 0 54px rgba(14,165,233,0.38)">wyberai.com/byos</div>
  <div class="mono dimt" style="font-size:${Math.round(21 * k)}px;line-height:1.7">EARLY. TRY IT ON A TOOL YOU PAY FOR<br>AND TELL US WHAT BREAKS.</div></div>`

// ---- slides -----------------------------------------------------------------
const SLIDES = [
  { kicker: 'BYOS · BUILD YOUR OWN SOFTWARE', headline: `You pay for 100 features.<br><span class="acc">You use 5.</span>`, hk: 0.9, sub: 'So build only the 5.', visual: gridVisual },
  { kicker: '01 · PASTE', headline: 'Paste the tool<br>you pay for.', sub: 'We read its public pages and list every feature.', visual: pasteVisual },
  { kicker: '02 · PICK', headline: 'Tick what<br>your team uses.', sub: 'Leave the rest. That is the whole idea.', visual: pickVisual },
  { kicker: '03 · THE HONEST PART', headline: 'We tell you what<br>we can’t build.', hk: 0.92, visual: honestVisual },
  { kicker: '04 · YOURS', headline: 'Your keys.<br>Your data.<br>Your domain.', hk: 0.92, visual: ownVisual },
  { kicker: '05 · PRICED FIRST', headline: 'You see the price<br>before we build.', hk: 0.92, visual: statVisual },
  { kicker: 'YOUR MOVE', headline: `Paste a tool.<br><span class="acc">Keep the 5.</span>`, hk: 1.05, visual: ctaVisual, cta: true },
]
const X_PICKS = [0, 3, 5, 6]

// ---- render -----------------------------------------------------------------
const D45 = path.join(OUT, 'linkedin-ig-fb-4x5'), D11 = path.join(OUT, 'x-1x1')
fs.mkdirSync(D45, { recursive: true }); fs.mkdirSync(D11, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()

async function shot(html, w, h, out) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  const ok = await page.evaluate(() => [document.fonts.check('800 40px Inter'), document.fonts.check('400 30px Inter'), document.fonts.check('500 20px JetBrains Mono')])
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } })
  console.log('✓', path.relative(OUT, out), ok.every(Boolean) ? '(fonts ✓)' : `(FONT FALLBACK ⚠ ${ok})`)
}

for (let i = 0; i < SLIDES.length; i++)
  await shot(scaffold(1080, 1350, 1, SLIDES[i], i, SLIDES.length), 1080, 1350, path.join(D45, `wyberai-byos-${String(i + 1).padStart(2, '0')}.png`))
for (const [n, i] of X_PICKS.entries()) {
  const s = { ...SLIDES[i], kicker: SLIDES[i].kicker?.replace(/^\d+ · /, '') }
  await shot(scaffold(1080, 1080, 0.84, s, n, X_PICKS.length), 1080, 1080, path.join(D11, `wyberai-byos-x-${n + 1}.png`))
}

// WhatsApp status 1080x1920: one vertical image; content kept inside WhatsApp's top/bottom overlays.
{
  const html = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${BASE}</style></head>
<body style="width:1080px;height:1920px;position:relative;background:${T.bg};background-image:radial-gradient(ellipse 90% 30% at 50% 8%, rgba(14,165,233,0.16), transparent 65%)">
${ticks(1080, 1920, 34)}
<div style="position:absolute;left:84px;right:84px;top:240px;bottom:270px;display:flex;flex-direction:column">
  ${lockup(64)}
  <div class="mono" style="margin-top:64px;font-size:24px;letter-spacing:.18em;color:${T.accent}">BYOS · BUILD YOUR OWN SOFTWARE</div>
  <div style="font-weight:800;font-size:96px;letter-spacing:-0.045em;line-height:1.02;margin-top:24px">You pay for 100 features.<br><span class="acc">You use 5.</span></div>
  <div style="display:grid;grid-template-columns:repeat(10,52px);gap:8px;margin-top:44px;justify-content:start">${cellsHtml(52, 9, 22)}</div>
  <div class="dimt" style="font-size:31px;line-height:1.5;margin-top:40px">Paste the tool you pay for. Tick what your team uses. We tell you what we can’t build, then build the rest in under 10 minutes.</div>
  <div style="flex:1"></div>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="background:${T.accent};color:#fff;font-weight:800;font-size:40px;border-radius:18px;padding:24px 44px;box-shadow:0 0 44px rgba(14,165,233,0.35)">wyberai.com/byos</div>
    <div class="mono faint" style="font-size:21px;line-height:1.6;text-align:right">YOUR KEYS<br>YOUR DATA</div>
  </div>
</div></body></html>`
  await shot(html, 1080, 1920, path.join(OUT, 'whatsapp-status-1080x1920.png'))
}
await browser.close()
console.log('\nAll assets in:', OUT)

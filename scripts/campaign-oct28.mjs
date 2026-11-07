// WyberAi — Oct 28 campaign: Launch Kit (QR code, share card, launch posts)
// plus two builder upgrades (queued messages, builds that survive a drop).
// Brand: tokens + logo from OneDrive\Desktop\Wyber Ai\Brand Kit\ — the icon
// PNG is embedded as base64; fonts come from Google Fonts and are verified per render.
// Renders 7 slides at 1080x1350 (LinkedIn multi-image post / Instagram /
// Facebook) and a 4-slide 1080x1080 set for X.
// Output: OneDrive\Desktop\Wyber Ai\campaign-oct28\
import puppeteer from 'puppeteer-core'
import QRCode from 'qrcode'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const DESK = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai')
const OUT = path.join(DESK, 'campaign-oct28')

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

// Cover: the three things, as a publish-flow checklist.
const coverVisual = (k) => card(k, termHead(k, 'publish & share') + [
  ['QR code', 'for your counter, poster or menu'],
  ['Share card', 'a proper preview on WhatsApp, LinkedIn and X'],
  ['Launch posts', 'written for 5 platforms, ready to edit'],
].map(([a, b]) => `<div style="display:flex;align-items:baseline;gap:${Math.round(16 * k)}px;font-size:${Math.round(26 * k)}px;line-height:2.05">
  <span class="ok mono">✓</span><span style="font-weight:700">${a}</span><span class="dimt" style="font-size:${Math.round(22 * k)}px">${b}</span></div>`).join(''))

const qrVisual = async (k) => {
  const qr = await QRCode.toString('https://wyberai.com', { type: 'svg', margin: 1, color: { dark: '#05060a', light: '#ffffff' } })
  const q = Math.round(300 * k)
  return `<div style="display:flex;gap:${Math.round(26 * k)}px;align-items:center">
    ${card(k, `<div style="width:${q}px;height:${q}px;background:#fff;border-radius:${Math.round(14 * k)}px;padding:${Math.round(12 * k)}px">${qr.replace('<svg', '<svg width="100%" height="100%"')}</div>
      <div style="text-align:center;font-weight:700;font-size:${Math.round(24 * k)}px;margin-top:${Math.round(16 * k)}px">Scan to try DayPlan</div>`, 'flex:0 0 auto')}
    <div style="display:flex;flex-direction:column;gap:${Math.round(16 * k)}px">
      ${['Shop counters', 'Posters & flyers', 'Menus & table cards', 'Events & stalls'].map(t => `<div style="display:flex;align-items:center;gap:${Math.round(14 * k)}px;font-size:${Math.round(25 * k)}px"><span class="acc mono">→</span>${t}</div>`).join('')}
      ${label(k, 'DOWNLOAD · PRINT · STICK IT UP')}
    </div></div>`
}

// Share card: a chat thread with a link preview, the way it lands on WhatsApp.
const shareVisual = (k) => card(k, `
  <div style="max-width:${Math.round(640 * k)}px;margin-left:auto;background:${T.overlay};border-radius:${Math.round(18 * k)}px;overflow:hidden;border:1px solid rgba(230,237,246,0.08)">
    <div style="height:${Math.round(250 * k)}px;background:linear-gradient(135deg,${T.dim},${T.accent});padding:${Math.round(26 * k)}px;display:flex;flex-direction:column;justify-content:flex-end">
      <div style="font-weight:800;font-size:${Math.round(46 * k)}px;letter-spacing:-0.03em">DayPlan</div>
      <div style="font-size:${Math.round(21 * k)}px;opacity:.9;margin-top:${Math.round(6 * k)}px">Plan your day, finish what matters.</div>
    </div>
    <div style="padding:${Math.round(16 * k)}px ${Math.round(20 * k)}px">
      <div style="font-weight:600;font-size:${Math.round(21 * k)}px">DayPlan</div>
      <div class="mono faint" style="font-size:${Math.round(16 * k)}px;margin-top:${Math.round(4 * k)}px">wyberai.com/app/dayplan</div>
    </div>
    <div style="padding:0 ${Math.round(20 * k)}px ${Math.round(16 * k)}px;font-size:${Math.round(21 * k)}px">Just launched my planner app — try it 👇</div>
  </div>` + label(k, 'YOUR NAME. YOUR COLOURS. NOT A RAW URL.'))

// Launch posts: the platform tabs + one draft.
const postsVisual = (k) => card(k, `
  <div style="display:flex;flex-wrap:wrap;gap:${Math.round(10 * k)}px;margin-bottom:${Math.round(22 * k)}px">
    ${['WhatsApp', 'LinkedIn', 'X', 'Instagram', 'Product Hunt'].map((p, i) => chip(k, p, i === 1)).join('')}</div>
  <div style="background:${T.overlay};border-radius:${Math.round(14 * k)}px;padding:${Math.round(22 * k)}px ${Math.round(24 * k)}px;font-size:${Math.round(22 * k)}px;line-height:1.55">
    I built DayPlan, a simple planner for getting through the day: tasks, categories and a dark mode for late nights.<br><br>
    It's free to try, and I'd love feedback from anyone who lives in their to-do list.<br>
    <span class="acc">wyberai.com/app/dayplan</span>
  </div>
  <div style="display:flex;gap:${Math.round(12 * k)}px;margin-top:${Math.round(18 * k)}px">${chip(k, 'Copy')}${chip(k, 'Copy & open LinkedIn', true)}</div>`)

const queueVisual = (k) => card(k, `
  <div style="display:flex;justify-content:flex-end;margin-bottom:${Math.round(16 * k)}px"><div style="background:${T.accent};color:#fff;border-radius:${Math.round(16 * k)}px;padding:${Math.round(14 * k)}px ${Math.round(22 * k)}px;font-size:${Math.round(23 * k)}px;font-weight:500">add a dark mode toggle</div></div>
  <div style="display:flex;align-items:center;gap:${Math.round(12 * k)}px;margin-bottom:${Math.round(26 * k)}px;font-size:${Math.round(21 * k)}px" class="dimt">
    <span style="width:${Math.round(16 * k)}px;height:${Math.round(16 * k)}px;border-radius:50%;border:2.5px solid rgba(14,165,233,0.22);border-top-color:${T.accent};display:inline-block"></span>Updating your app</div>
  <div style="border:1px solid rgba(230,237,246,0.1);border-radius:${Math.round(18 * k)}px;background:${T.overlay};padding:${Math.round(16 * k)}px">
    <div style="display:flex;align-items:center;gap:${Math.round(14 * k)}px;background:${T.raised};border:1px solid rgba(14,165,233,0.35);border-radius:${Math.round(12 * k)}px;padding:${Math.round(12 * k)}px ${Math.round(16 * k)}px;font-size:${Math.round(20 * k)}px">
      <span class="acc" style="font-weight:700">Up next</span><span style="flex:1">add colored category tags and a filter</span><span class="faint">Edit</span><span class="faint">×</span></div>
    <div class="faint" style="font-size:${Math.round(20 * k)}px;padding:${Math.round(18 * k)}px ${Math.round(6 * k)}px ${Math.round(6 * k)}px">Type your next change — it runs as soon as this one finishes</div>
  </div>`)

const dropVisual = (k) => {
  const node = (sym, sub, color, dashed) => `<div style="flex:1;text-align:center">
    <div style="margin:0 auto ${Math.round(14 * k)}px;width:${Math.round(66 * k)}px;height:${Math.round(66 * k)}px;border-radius:50%;border:2px ${dashed ? 'dashed' : 'solid'} ${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(28 * k)}px;color:${color}">${sym}</div>
    <div class="mono" style="font-size:${Math.round(17 * k)}px;color:${T.textDim}">${sub}</div></div>`
  const line = (dashed) => `<div style="flex:0 0 ${Math.round(70 * k)}px;height:2px;margin-top:${Math.round(33 * k)}px;background:${dashed ? `repeating-linear-gradient(90deg,${T.faint} 0 8px,transparent 8px 16px)` : T.accent}"></div>`
  return card(k, `<div style="display:flex;align-items:flex-start">
      ${node('↑', 'YOU ASK', T.accent)}${line(true)}${node('✕', 'SIGNAL DROPS', T.faint, true)}${line(false)}${node('⚙', 'WE KEEP BUILDING', T.accent)}${line(false)}${node('✓', 'IT LANDS', T.ok)}
    </div>
    <div style="margin-top:${Math.round(30 * k)}px;background:${T.overlay};border-radius:${Math.round(14 * k)}px;padding:${Math.round(20 * k)}px ${Math.round(24 * k)}px;font-size:${Math.round(22 * k)}px;line-height:1.5">
      Built it — App, Tasks and Shell are live. Tell me what to change next.</div>`)
}

const ctaVisual = (k) => `<div style="display:flex;flex-direction:column;gap:${Math.round(24 * k)}px;align-items:flex-start">
  <div style="background:${T.accent};color:#fff;font-weight:800;font-size:${Math.round(32 * k)}px;border-radius:${Math.round(16 * k)}px;padding:${Math.round(22 * k)}px ${Math.round(40 * k)}px;box-shadow:0 0 ${Math.round(40 * k)}px rgba(14,165,233,0.35)">Start free → wyberai.com</div>
  <div class="mono faint" style="font-size:${Math.round(20 * k)}px;letter-spacing:.06em">FREE CREDITS ON SIGNUP · NO CARD NEEDED</div>
  <div style="display:flex;align-items:center;gap:${Math.round(14 * k)}px;margin-top:${Math.round(10 * k)}px;padding:${Math.round(16 * k)}px ${Math.round(22 * k)}px;border:1px solid rgba(245,158,11,0.35);border-radius:${Math.round(14 * k)}px;background:rgba(245,158,11,0.06);font-size:${Math.round(22 * k)}px">
    <span style="font-size:${Math.round(26 * k)}px">🏆</span><span>Then enter it in the <b>Wyber Premier League</b>. New winners every month.</span></div></div>`

// ---- slides -----------------------------------------------------------------
// Leads with what's new (Launch Kit + builder upgrades); the Premier League gets
// one line on the closing slide. No prize amounts (₹ vs $ by region).
const SLIDES = [
  { kicker: 'LAUNCH KIT · NEW', headline: `You built it.<br>Nobody saw it.<br><span class="acc">Fixed.</span>`, sub: 'Every app you publish on WyberAi now ships with a QR code, a share card and launch posts. No more launching into silence.', visual: coverVisual, hk: 1.02 },
  { kicker: '01 · QR CODE', headline: 'Nobody types your URL.', sub: 'Print the QR. Slap it on the counter, the poster, the menu. Scan. Done.', qr: true },
  { kicker: '02 · SHARE CARD', headline: 'Raw links look like spam.', sub: 'Yours lands on WhatsApp, LinkedIn and X with your name and your colours. People tap products. They scroll past URLs.', visual: shareVisual },
  { kicker: '03 · LAUNCH POSTS', headline: 'The launch post is already written.', sub: 'Five of them, about your app: WhatsApp, LinkedIn, X, Instagram, Product Hunt. Copy. Post. Move on.', visual: postsVisual, hk: 0.92 },
  { kicker: 'ALSO NEW · BUILDER', headline: 'Stop babysitting the AI.', sub: 'Type your next change while it’s still building. It queues and fires the second it’s free.', visual: queueVisual },
  { kicker: 'ALSO NEW · BUILDER', headline: 'Signal died. Build didn’t.', sub: 'The work keeps going on our side and lands in your editor. Nothing to redo.', visual: dropVisual },
  { kicker: 'YOUR MOVE', headline: `Build it. Launch it.<br><span class="acc">Make them look.</span>`, hk: 1.05, sub: 'Web apps, mobile apps, websites and SaaS, from one sentence.', visual: ctaVisual, cta: true },
]
const X_PICKS = [0, 2, 3, 6] // cover, share card, launch posts, CTA (with the WPL line)

// ---- render -----------------------------------------------------------------
const D45 = path.join(OUT, 'linkedin-ig-fb-4x5'), D11 = path.join(OUT, 'x-1x1')
fs.mkdirSync(D45, { recursive: true }); fs.mkdirSync(D11, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()

async function shot(html, w, h, out) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  const ok = await page.evaluate(() => [document.fonts.check("800 40px Inter"), document.fonts.check("400 30px Inter"), document.fonts.check("500 20px JetBrains Mono")])
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } })
  console.log('✓', path.relative(OUT, out), ok.every(Boolean) ? '(fonts ✓)' : `(FONT FALLBACK ⚠ ${ok})`)
}

const qr = await qrVisual(1), qrX = await qrVisual(0.84)
for (let i = 0; i < SLIDES.length; i++) {
  const s = { ...SLIDES[i] }
  if (s.qr) s.visual = () => qr
  await shot(scaffold(1080, 1350, 1, s, i, SLIDES.length), 1080, 1350, path.join(D45, `wyberai-oct28-${String(i + 1).padStart(2, '0')}.png`))
}
for (const [n, i] of X_PICKS.entries()) {
  const s = { ...SLIDES[i], kicker: SLIDES[i].kicker?.replace(/^\d+ · /, '') }
  if (s.qr) s.visual = () => qrX
  await shot(scaffold(1080, 1080, 0.84, s, n, X_PICKS.length), 1080, 1080, path.join(D11, `wyberai-oct28-x-${n + 1}.png`))
}
// ---- WhatsApp status (1080x1920) ---------------------------------------------
// One vertical image summing up the post. WhatsApp overlays its progress bar +
// name at the top and the reply bar at the bottom, so content sits inside a
// ~230px top / ~260px bottom safe area.
{
  const k = 1.12
  const row = (icon, title, desc) => `<div style="display:flex;gap:${Math.round(22 * k)}px;align-items:flex-start;padding:${Math.round(22 * k)}px 0;border-top:1px solid rgba(230,237,246,0.07)">
    <div style="flex:0 0 ${Math.round(58 * k)}px;height:${Math.round(58 * k)}px;border-radius:${Math.round(14 * k)}px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);display:flex;align-items:center;justify-content:center;font-size:${Math.round(28 * k)}px">${icon}</div>
    <div><div style="font-weight:800;font-size:${Math.round(32 * k)}px;letter-spacing:-0.02em">${title}</div>
    <div class="dimt" style="font-size:${Math.round(23 * k)}px;line-height:1.4;margin-top:${Math.round(4 * k)}px">${desc}</div></div></div>`
  const html = `<!doctype html><html><head><meta charset="utf-8">${FONT_LINK}<style>${BASE}</style></head>
<body style="width:1080px;height:1920px;position:relative;background:${T.bg};background-image:radial-gradient(ellipse 90% 30% at 50% 8%, rgba(14,165,233,0.16), transparent 65%)">
${ticks(1080, 1920, 34)}
<div style="position:absolute;left:84px;right:84px;top:240px;bottom:270px;display:flex;flex-direction:column">
  ${lockup(64)}
  <div class="mono" style="margin-top:70px;font-size:24px;letter-spacing:.18em;color:${T.accent}">NEW IN WYBERAI · LAUNCH KIT</div>
  <div style="font-weight:800;font-size:112px;letter-spacing:-0.045em;line-height:1.02;margin-top:26px">You built it.<br>Nobody saw it.<br><span class="acc">Fixed.</span></div>
  <div class="dimt" style="font-size:31px;line-height:1.45;margin-top:30px">Every app you publish now ships with:</div>
  <div style="margin-top:18px">
    ${row('▦', 'QR code', 'Print it for your counter, poster or menu.')}
    ${row('🔗', 'Share card', 'Your link shows your app’s name and colours on WhatsApp.')}
    ${row('✍️', 'Launch posts', 'Written for WhatsApp, LinkedIn, X, Instagram & Product Hunt.')}
  </div>
  <div class="dimt" style="font-size:24px;line-height:1.5;padding-top:22px;border-top:1px solid rgba(230,237,246,0.07)"><span class="mono acc" style="font-size:19px;letter-spacing:.14em">ALSO NEW&nbsp;&nbsp;</span>Queue your next change while it builds. Builds finish even if your signal drops.</div>
  <div style="flex:1"></div>
  <div style="display:flex;align-items:center;gap:16px;padding:20px 24px;border:1px solid rgba(245,158,11,0.35);border-radius:16px;background:rgba(245,158,11,0.06);font-size:26px">
    <span style="font-size:30px">🏆</span><span>Then enter it in the <b>Wyber Premier League</b>. New winners every month.</span></div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:30px">
    <div style="background:${T.accent};color:#fff;font-weight:800;font-size:40px;border-radius:18px;padding:24px 44px;box-shadow:0 0 44px rgba(14,165,233,0.35)">wyberai.com</div>
    <div class="mono faint" style="font-size:21px;line-height:1.6;text-align:right">FREE CREDITS<br>NO CARD NEEDED</div>
  </div>
</div></body></html>`
  const out = path.join(OUT, 'whatsapp-status-1080x1920.png')
  await shot(html, 1080, 1920, out)
}
await browser.close()
console.log('\nAll assets in:', OUT)

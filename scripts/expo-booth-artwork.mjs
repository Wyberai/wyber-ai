// Tech Expo Gujarat 2026, Startup Booth (2 x 2 m) branding artwork, made at ACTUAL SIZE as vector PDFs.
// Sizes come from the organiser's Exhibitor Manual (Startup Booth, Section 2):
//   Backdrop 6 x 6 ft, table front 4 x 2.6 ft, table side (x2) 2.5 x 2 ft. "Print-ready artwork at actual size (PDF / AI / CDR)".
// Run: node scripts/expo-booth-artwork.mjs   (needs Google Chrome; writes to the Gujarat Tech Expo folder on the Desktop)
// Look: the same palette and type as scripts/expo-collateral.mjs (#05060a ground, #0ea5e9 accent, Inter + JetBrains Mono).
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'booth-artwork')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FT = 304.8 // mm in a foot

const BG = '#05060a', INK = '#f2f4f8', SKY = '#0ea5e9', MUTED = '#9aa4b5', DIM = '#6b7488'
const FONT = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">`

// The QR is the one the organiser issued for our stall (Xpro "Generate QR": WyberAi, Startup Booth - S23, "Scan QR to view stall details").
// It arrives as a 300 dpi picture, so its 37 x 37 module grid is read once (scripts/expo-organiser-qr.mjs, verified pixel for pixel) and
// redrawn here as vector squares: sharp at any size, same code.
const QR = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./expo-organiser-qr.json', import.meta.url)), 'utf8'))
const qrSvg = async () => {
  const d = QR.rows.map((row, y) => { let out = '', x = 0; while (x < row.length) { if (row[x] === '1') { let e = x; while (e < row.length && row[e] === '1') e++; out += 'M' + x + ' ' + y + 'h' + (e - x) + 'v1h-' + (e - x) + 'z'; x = e } else x++ } return out }).join('')
  return '<svg viewBox="0 0 ' + QR.size + ' ' + QR.size + '" style="width:100%;height:100%;display:block" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet"><path d="' + d + '" fill="' + BG + '"/></svg>'
}

// The WyberAi mark, as vector (same shapes as the app's logo).
const mark = (mm) => `<svg width="${mm}mm" height="${mm}mm" viewBox="0 0 32 32" fill="none" style="display:block"><rect width="32" height="32" rx="8" fill="${SKY}"/><path d="M20 7L11 16L20 25" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>`
const logo = (m, word) => `<div style="display:flex;align-items:center;gap:${m * 0.28}mm">${mark(m)}<div style="font-weight:900;font-size:${word}mm;letter-spacing:-0.03em;line-height:1">Wyber<span style="color:${SKY}">Ai</span></div></div>`
const qrPlate = (size, svg) => `<div style="width:${size}mm;height:${size}mm;background:#fff;border-radius:${size * 0.05}mm;padding:${size * 0.1}mm;box-sizing:border-box">${svg}</div>`
const mono = (size, color, extra = '') => `font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:.12em;font-size:${size}mm;color:${color};${extra}`

function page(wMM, hMM, inner) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>
@page{size:${wMM}mm ${hMM}mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;width:${wMM}mm;height:${hMM}mm;background:${BG};color:${INK};font-family:Inter,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;overflow:hidden}
.c{position:relative;width:${wMM}mm;height:${hMM}mm;overflow:hidden;background:${BG}}
.abs{position:absolute}
.sky{color:${SKY}}
</style></head><body><div class="c">${inner}</div></body></html>`
}

// ---------- Backdrop 6 x 6 ft = 1828.8 mm square ----------
async function backdrop() {
  const W = 6 * FT, M = 110
  const qr = await qrSvg()
  // Key content sits in the top 60%: the table stands in front of the lower part of the backdrop.
  // Six superpowers, each held to what the code does (see src/app/gujaratexpo/data.ts POWERS).
  const WHAT = [
    ['X-ray vision', 'We probe your live database like an attacker, right after you publish.'],
    ['Key lock', 'An exposed secret key stops a publish.'],
    ['Security armour', 'A full security checklist, any time.'],
    ['Be seen', 'Readable by Google and by AI assistants.'],
    ['Anti-slop radar', 'Flags the made-by-AI look.'],
    ['Two forms', 'A website and a mobile app from one prompt.'],
  ]
  const ICON = {
    'X-ray vision': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'Key lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'Security armour': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    'Be seen': '<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>',
    'Anti-slop radar': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12L19 5"/>',
    'Two forms': '<rect x="2" y="5" width="14" height="10" rx="1.5"/><rect x="17.5" y="8" width="4.5" height="11" rx="1.2"/>',
  }
  const icon = (t, size) => `<svg width="${size}mm" height="${size}mm" viewBox="0 0 24 24" fill="none" stroke="${SKY}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block">${ICON[t]}</svg>`
  const tw = (1609 - 2 * 28) / 3
  const tiles = WHAT.map(([t, d]) => `<div style="width:${tw}mm;height:314mm;border-radius:20mm;background:#0e131c;border:2mm solid #1d2638;padding:26mm 28mm;box-sizing:border-box;position:relative">${icon(t, 64)}<div style="font-weight:900;font-size:50mm;letter-spacing:-0.03em;margin-top:14mm">${t}</div><div style="font-size:30mm;line-height:1.34;color:${MUTED};margin-top:8mm">${d}</div></div>`).join('')
  return page(W, W, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(150, 118)}</div>
    <div class="abs" style="right:${M}mm;top:${M}mm;width:330mm">${qrPlate(330, qr)}
      <div style="${mono(24, MUTED, 'margin-top:20mm;line-height:1.45;text-align:center')}">SCAN QR TO VIEW<br>STALL DETAILS</div>
      <div style="${mono(30, SKY, 'margin-top:14mm;text-align:center;letter-spacing:.05em')}">wyberai.com</div></div>
    <div class="abs" style="left:${M}mm;top:470mm;font-weight:900;font-size:172mm;line-height:.98;letter-spacing:-0.045em">Vibe coding.<br><span class="sky">Plus superpowers.</span></div>
    <div class="abs" style="left:${M}mm;top:860mm;font-size:62mm;font-weight:600;color:${MUTED};letter-spacing:-0.01em">The checks plain vibe coding skips.</div>
    <div class="abs" style="left:${M}mm;top:990mm;width:1609mm;display:flex;flex-wrap:wrap;gap:28mm">${tiles}</div>
    <div class="abs" style="left:${M}mm;top:1700mm;background:${SKY};color:#03111c;border-radius:60mm;padding:22mm 56mm;${mono(40, '#03111c', 'letter-spacing:.08em')}">TELL US YOUR PAIN POINTS</div>`)
}

// ---------- Backdrop B (alternative): lead with what WyberAi does, in the words on the Xpro portal ----------
async function backdropB() {
  const W = 6 * FT, M = 110
  const qr = await qrSvg()
  const tiles = ['Website', 'Web app', 'Mobile app', 'SaaS']
  const tw = (1609 - 3 * 30) / 4
  const tileHtml = tiles.map((t, i) => `<div style="width:${tw}mm;height:250mm;border-radius:22mm;background:${i === 0 ? SKY : '#121722'};border:2mm solid ${i === 0 ? SKY : '#1b2230'};display:flex;align-items:flex-end;padding:30mm;box-sizing:border-box"><div style="font-weight:900;font-size:50mm;letter-spacing:-0.03em;color:${i === 0 ? '#04121c' : INK}">${t}</div></div>`).join('')
  return page(W, W, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(150, 118)}</div>
    <div class="abs" style="right:${M}mm;top:${M}mm;width:330mm">${qrPlate(330, qr)}
      <div style="${mono(24, MUTED, 'margin-top:20mm;line-height:1.45;text-align:center')}">SCAN QR TO VIEW<br>STALL DETAILS</div>
      <div style="${mono(30, SKY, 'margin-top:14mm;text-align:center;letter-spacing:.05em')}">wyberai.com</div></div>
    <div class="abs" style="left:${M}mm;top:440mm;font-weight:900;font-size:168mm;line-height:.98;letter-spacing:-0.045em">Build any<br>digital product.<br><span class="sky">Ship it<br>in minutes.</span></div>
    <div class="abs" style="left:${M}mm;top:1130mm;width:1400mm;font-size:52mm;line-height:1.32;font-weight:500;color:${MUTED}">Describe what you need in plain words. WyberAi builds the website, web app, mobile app or SaaS.</div>
    <div class="abs" style="left:${M}mm;top:1440mm;width:1609mm;display:flex;gap:30mm">${tileHtml}</div>
    <div class="abs" style="left:${M}mm;top:1728mm;${mono(34, DIM)}">DESCRIBE IT. SHIP IT.</div>`)
}

// ---------- Table front 4 x 2.6 ft = 1219.2 x 792.5 mm ----------
async function tableFront() {
  const W = 4 * FT, H = 2.6 * FT, M = 62
  const qr = await qrSvg()
  return page(W, H, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(86, 66)}</div>
    <div class="abs" style="right:${M}mm;top:${M}mm;width:292mm">${qrPlate(292, qr)}
      <div style="${mono(18, MUTED, 'margin-top:12mm;text-align:center')}">SCAN QR TO VIEW STALL DETAILS</div></div>
    <div class="abs" style="left:${M}mm;top:380mm;font-weight:900;font-size:112mm;line-height:.99;letter-spacing:-0.04em">Vibe coding.<br><span class="sky">Plus superpowers.</span></div>
    <div class="abs" style="left:${M}mm;bottom:${M}mm;background:${SKY};color:#03111c;border-radius:40mm;padding:13mm 34mm;${mono(24, '#03111c', 'letter-spacing:.08em')}">TELL US YOUR PAIN POINT</div>
    <div class="abs" style="right:${M}mm;bottom:${M + 10}mm;${mono(26, SKY, 'letter-spacing:.06em')}">wyberai.com</div>`)
}

// ---------- Table side (x2) 2.5 x 2 ft = 762 x 609.6 mm ----------
async function tableSide() {
  const W = 2.5 * FT, H = 2 * FT, M = 48
  return page(W, H, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(70, 54)}</div>
    <div class="abs" style="left:${M}mm;top:215mm;font-weight:900;font-size:72mm;line-height:1;letter-spacing:-0.04em">Vibe coding.<br><span class="sky">Plus superpowers.</span></div>
    <div class="abs" style="left:${M}mm;bottom:${M}mm;background:${SKY};color:#03111c;border-radius:30mm;padding:9mm 24mm;${mono(18, '#03111c', 'letter-spacing:.08em')}">TELL US YOUR PAIN POINT</div>
    <div class="abs" style="right:${M}mm;bottom:${M + 5}mm;${mono(20, SKY, 'letter-spacing:.06em')}">wyberai.com</div>`)
}

const PIECES = [
  ['01-backdrop-6x6ft', 6 * FT, 6 * FT, backdrop],
  ['01b-backdrop-6x6ft-ALT-capability', 6 * FT, 6 * FT, backdropB],
  ['02-table-front-4x2.6ft', 4 * FT, 2.6 * FT, tableFront],
  ['03-table-side-2.5x2ft', 2.5 * FT, 2 * FT, tableSide],
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
try {
  for (const [name, wMM, hMM, make] of PIECES) {
    const html = await make()
    fs.writeFileSync(path.join(OUT, name + '.html'), html)
    const pg = await browser.newPage()
    await pg.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
    await pg.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 600))
    await pg.pdf({ path: path.join(OUT, name + '.pdf'), width: `${wMM}mm`, height: `${hMM}mm`, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
    // A small preview image (not for print).
    const pxW = Math.round(wMM / 25.4 * 96), pxH = Math.round(hMM / 25.4 * 96)
    await pg.setViewport({ width: pxW, height: pxH, deviceScaleFactor: 1200 / pxW })
    await pg.screenshot({ path: path.join(OUT, name + '-preview.png') })
    await pg.close()
    console.log('wrote', name)
  }
  // Comparison sheet (not for print).
  const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64')
  const A = b64('01-backdrop-6x6ft-preview.png'), B = b64('01b-backdrop-6x6ft-ALT-capability-preview.png')
  const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#e9edf3;font-family:Inter,Arial,sans-serif;color:#10151f;width:1700px}
    .row{display:flex;gap:40px;padding:40px 50px 0}.col{flex:1}
    h2{margin:0 0 6px;font-size:30px}p{margin:0 0 16px;font-size:19px;color:#4a5568}
    img.big{width:100%;display:block;border:1px solid #c5ccd8}
    .far{display:flex;gap:40px;padding:36px 50px 50px;align-items:flex-end}.far div{flex:1}
    .far img{width:190px;display:block;border:1px solid #c5ccd8}.far span{font-size:17px;color:#4a5568;display:block;margin-top:8px}
  </style></head><body>
  <div class="row"><div class="col"><h2>A. The problem</h2><p>"Your software has 100 features. You use 5." then "Build your own software."</p><img class="big" src="${A}"></div>
  <div class="col"><h2>B. What it does</h2><p>"Build any digital product. Ship it in minutes." (the Xpro portal wording)</p><img class="big" src="${B}"></div></div>
  <div class="far"><div><img src="${A}"><span>A from far away (a 6 ft backdrop seen from about 8 m)</span></div><div><img src="${B}"><span>B from far away</span></div></div>
  </body></html>`
  const pg = await browser.newPage()
  await pg.setViewport({ width: 1700, height: 1300 })
  await pg.setContent(sheet, { waitUntil: 'load' })
  await pg.screenshot({ path: path.join(OUT, 'COMPARE-A-vs-B.png'), fullPage: true })
  await pg.close()
  console.log('wrote COMPARE-A-vs-B.png')
} finally { await browser.close() }

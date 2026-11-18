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
  const cell = (1609 - 9 * 18) / 10
  const lit = new Set([3, 7, 12, 18])
  const grid = Array.from({ length: 20 }, (_, i) => `<div style="width:${cell}mm;height:${cell}mm;border-radius:14mm;background:${lit.has(i) ? SKY : '#121722'};border:2mm solid ${lit.has(i) ? SKY : '#1b2230'}"></div>`).join('')
  return page(W, W, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(150, 118)}</div>
    <div class="abs" style="right:${M}mm;top:${M}mm;width:330mm">${qrPlate(330, qr)}
      <div style="${mono(24, MUTED, 'margin-top:20mm;line-height:1.45;text-align:center')}">SCAN QR TO VIEW<br>STALL DETAILS</div>
      <div style="${mono(30, SKY, 'margin-top:14mm;text-align:center;letter-spacing:.05em')}">wyberai.com</div></div>
    <div class="abs" style="left:${M}mm;top:440mm;font-weight:900;font-size:176mm;line-height:.98;letter-spacing:-0.045em">Your CRM has<br>100 features.<br>You use <span class="sky">5.</span></div>
    <div class="abs" style="left:${M}mm;top:985mm;font-size:66mm;font-weight:500;color:${MUTED};letter-spacing:-0.01em">And the one you need isn&rsquo;t there.</div>
    <div class="abs" style="left:${M}mm;top:1115mm;font-weight:900;font-size:90mm;line-height:1.02;letter-spacing:-0.035em">Tell us your pain points.<br><span class="sky">Build your own software.</span></div>
    <div class="abs" style="left:${M}mm;top:1420mm;width:1609mm;display:grid;grid-template-columns:repeat(10,${cell}mm);gap:18mm">${grid}</div>
    <div class="abs" style="left:${M}mm;top:1757mm;${mono(26, DIM)}">STARTUP BOOTH &middot; S23 &middot; TECH EXPO GUJARAT &middot; 27&ndash;29 NOV 2026 &middot; DESCRIBE IT. SHIP IT.</div>`)
}

// ---------- Table front 4 x 2.6 ft = 1219.2 x 792.5 mm ----------
async function tableFront() {
  const W = 4 * FT, H = 2.6 * FT, M = 62
  const qr = await qrSvg()
  return page(W, H, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(86, 66)}</div>
    <div class="abs" style="right:${M}mm;top:${M}mm;width:292mm">${qrPlate(292, qr)}
      <div style="${mono(18, MUTED, 'margin-top:12mm;text-align:center')}">SCAN QR TO VIEW STALL DETAILS</div></div>
    <div class="abs" style="left:${M}mm;top:250mm;font-weight:900;font-size:102mm;line-height:.99;letter-spacing:-0.04em">Build your own<br><span class="sky">software.</span></div>
    <div class="abs" style="left:${M}mm;top:505mm;font-size:46mm;font-weight:500;color:${MUTED}">Tell us your pain points.</div>
    <div class="abs" style="left:${M}mm;top:585mm;${mono(26, SKY)}">DESCRIBE IT. SHIP IT.</div>
    <div class="abs" style="left:${M}mm;bottom:${M}mm;${mono(26, SKY, 'letter-spacing:.06em')}">wyberai.com</div>
    <div class="abs" style="right:${M}mm;bottom:${M}mm;${mono(22, DIM)}">STARTUP BOOTH &middot; S23</div>`)
}

// ---------- Table side (x2) 2.5 x 2 ft = 762 x 609.6 mm ----------
async function tableSide() {
  const W = 2.5 * FT, H = 2 * FT, M = 48
  return page(W, H, `
    <div class="abs" style="left:${M}mm;top:${M}mm">${logo(70, 54)}</div>
    <div class="abs" style="left:${M}mm;top:215mm;font-weight:900;font-size:74mm;line-height:1;letter-spacing:-0.04em">Build your<br>own <span class="sky">software.</span></div>
    <div class="abs" style="left:${M}mm;bottom:${M}mm;${mono(22, SKY, 'letter-spacing:.06em')}">wyberai.com</div>
    <div class="abs" style="right:${M}mm;bottom:${M}mm;${mono(18, DIM)}">STARTUP BOOTH &middot; S23</div>`)
}

const PIECES = [
  ['01-backdrop-6x6ft', 6 * FT, 6 * FT, backdrop],
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
} finally { await browser.close() }

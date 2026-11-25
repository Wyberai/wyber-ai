// Reads the module grid of the organiser's QR (the Xpro stall card, a 300 dpi picture inside Startup Booth_S23.pdf) so it can be redrawn
// as a vector. Usage: node scripts/expo-organiser-qr.mjs <card.png> <out.json>
// It finds the QR's bounding box, takes the module size from the first finder pattern (7 modules wide), samples every module centre,
// then redraws the grid at the same scale and compares it pixel by pixel with the original. It refuses to write the file unless that
// comparison is clean.
import sharp from 'sharp'
import fs from 'node:fs'

const [src, out] = process.argv.slice(2)
const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const dark = (x, y) => data[y * W + x] < 110

// The QR sits in the lower-middle plate. Search a window that excludes the logo and the text above and below it.
const y0 = Math.round(H * 0.34), y1 = Math.round(H * 0.82), x0 = Math.round(W * 0.15), x1 = Math.round(W * 0.85)
let minX = W, maxX = 0, minY = H, maxY = 0
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (dark(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
// The plate border is light grey (above the threshold), so these are QR modules only.
const bw = maxX - minX + 1, bh = maxY - minY + 1
// First finder pattern: along the top edge the first dark run is 7 modules wide.
let run = 0; while (dark(minX + run, minY + 2)) run++
const mod = run / 7
const N = Math.round(bw / mod)
console.log({ box: [minX, minY, bw, bh], run, module: +mod.toFixed(2), modules: N })
if (Math.abs(bw - bh) > 3 || N < 21 || (N - 17) % 4 !== 0) throw new Error('unexpected QR geometry: modules ' + N)

const rows = []
for (let r = 0; r < N; r++) {
  let line = ''
  for (let c = 0; c < N; c++) line += dark(Math.round(minX + (c + 0.5) * bw / N), Math.round(minY + (r + 0.5) * bh / N)) ? '1' : '0'
  rows.push(line)
}
// Verify: redraw the grid at the original scale and count differing pixels inside the box.
let diff = 0, total = 0
for (let y = minY; y < minY + bh; y++) for (let x = minX; x < minX + bw; x++) {
  const c = Math.min(N - 1, Math.floor((x - minX) * N / bw)), r = Math.min(N - 1, Math.floor((y - minY) * N / bh))
  const want = rows[r][c] === '1'
  // ignore the anti-aliased edge pixels of each module (within 1 px of a module boundary)
  const fx = ((x - minX) * N / bw) % 1, fy = ((y - minY) * N / bh) % 1
  const edge = fx * mod < 1.2 || fx * mod > mod - 1.2 || fy * mod < 1.2 || fy * mod > mod - 1.2
  if (edge) continue
  total++; if (dark(x, y) !== want) diff++
}
console.log('compared', total, 'interior pixels, differing:', diff)
if (diff > 0) throw new Error('redrawn grid does not match the original')
fs.writeFileSync(out, JSON.stringify({ source: 'Startup Booth_S23.pdf (Tech Expo Gujarat 2026 organiser QR card, WyberAi, Startup Booth S23)', size: N, rows }, null, 1))
console.log('wrote', out, `${N}x${N}`)

import fs from 'node:fs'
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]) }
const [src, outDir] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const buf = fs.readFileSync(src), s = buf.toString('latin1')
const re = /(\d+)\s+0\s+obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g
let m, n = 0
while ((m = re.exec(s))) {
  const d = m[2]; if (!/\/Subtype\s*\/Image/.test(d)) continue
  const start = m.index + m[0].length
  const len = +(d.match(/\/Length\s+(\d+)/)?.[1] ?? 0)
  const data = buf.subarray(start, start + len)
  const w = +d.match(/\/Width\s+(\d+)/)[1], h = +d.match(/\/Height\s+(\d+)/)[1]
  const gray = /DeviceGray/.test(d)
  const pred = +(d.match(/\/Predictor\s+(\d+)/)?.[1] ?? 1)
  console.log('image', n, w + 'x' + h, gray ? 'gray' : 'rgb', 'predictor', pred)
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = gray ? 0 : 2
  fs.writeFileSync(`${outDir}/pdfimg${n}.png`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', data), chunk('IEND', Buffer.alloc(0))]))
  n++
}

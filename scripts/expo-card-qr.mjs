// Draws the QR for wyberai.com/card (save contact + brochure). Usage: node scripts/expo-card-qr.mjs <out-folder>
import QRCode from 'qrcode'
import fs from 'node:fs'
const out = process.argv[2]
const url = 'https://wyberai.com/card'
const opts = { errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#000000', light: '#ffffff' } }
fs.mkdirSync(out, { recursive: true })
await QRCode.toFile(`${out}/wyberai-card-qr.png`, url, { ...opts, width: 2000 })
fs.writeFileSync(`${out}/wyberai-card-qr.svg`, await QRCode.toString(url, { ...opts, type: 'svg' }))
console.log('wrote QR for', url)

// Builds a manual WhatsApp outreach sheet (one-click wa.me links) from a lead CSV.
// Usage: node scripts/gujarat-expo-whatsapp.mjs <leads.csv> <out.csv>
// Only Indian mobile numbers are kept (10 digits starting 6-9); landlines cannot receive WhatsApp.
import fs from 'node:fs'

const SENDER = 'Sumeet' // edit to change the sign-off in every prefilled message
const [inFile, outFile] = process.argv.slice(2)

const parse = line => line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')).slice(0, 16)
const rows = fs.readFileSync(inFile, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(parse)
const head = rows.shift()
const col = n => head.indexOf(n)

const msg = first =>
  `Hi ${first}, this is ${SENDER} from WyberAi. Quick question: is there one thing your current software can't do that you wish it did? ` +
  `We'll be at the Gujarat Tech Expo on 27-29 Nov and will build that as your own software for you to try at our booth. ` +
  `If it's not relevant, no worries, I won't message again.`

const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`
const out = [['First Name', 'Company', 'Job Title', 'WhatsApp Number', 'Click to open WhatsApp', 'Sent (date)', 'Replied', 'Slot booked', 'Notes']]
let skipped = 0
for (const r of rows) {
  const digits = (r[col('Phone Number')] || '').replace(/\D/g, '').replace(/^91/, '')
  if (!/^[6-9]\d{9}$/.test(digits)) { skipped++; continue }
  const first = r[col('First Name')]
  out.push([first, r[col('Company Name')], r[col('job_title')], `+91${digits}`, `https://wa.me/91${digits}?text=${encodeURIComponent(msg(first))}`, '', '', '', ''])
}
fs.writeFileSync(outFile, '﻿' + out.map(r => r.map(q).join(',')).join('\r\n'))
console.log(`${out.length - 1} mobile numbers ready, ${skipped} skipped (no phone or landline)`)

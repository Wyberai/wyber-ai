// One-off: prove an AI employee can send mail FROM its own provisioned address.
// No auth, no DB — just the Continuum send path the run-engine uses.
// NOTE: employees.wyberai.com must be a verified sending domain in Continuum first.
// Run: node scripts/test-employee-email.mjs
import fs from 'node:fs'
import { sendEmail } from './lib/continuum-send.mjs'

// Load CONTINUUM_API_KEY from .env.local (dev convenience; not used in prod).
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const FROM_NAME = 'Marcus (Marketing Manager)'
const FROM_ADDR = 'marcus.test@employees.wyberai.com'
const TO = 'admin@reconsignal.com'

const res = await sendEmail({
  from: `${FROM_NAME} <${FROM_ADDR}>`,
  to: TO,
  subject: 'Hi — your new Marketing Manager here',
  text: "Hi! I'm Marcus, your new AI Marketing Manager. My mailbox is live and I'm ready to start. Reply to this and I'll pick it up. — Marcus",
})

console.log(JSON.stringify(res, null, 2))
console.log(`\n✅ Sent from ${FROM_ADDR} → ${TO} (Continuum id: ${res.id})`)

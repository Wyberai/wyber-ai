// One-off: prove an AI employee can send mail FROM its own provisioned address.
// No auth, no DB — just the Resend send path the run-engine uses.
// Run: node scripts/test-employee-email.mjs
import fs from 'node:fs'
import { Resend } from 'resend'

// Load RESEND_API_KEY from .env.local (dev convenience; not used in prod).
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_NAME = 'Marcus (Marketing Manager)'
const FROM_ADDR = 'marcus.test@employees.wyberai.com'
const TO = 'admin@reconsignal.com'

const res = await resend.emails.send({
  from: `${FROM_NAME} <${FROM_ADDR}>`,
  to: TO,
  subject: 'Hi — your new Marketing Manager here',
  text: "Hi! I'm Marcus, your new AI Marketing Manager. My mailbox is live and I'm ready to start. Reply to this and I'll pick it up. — Marcus",
})

console.log(JSON.stringify(res, null, 2))
if (res.error) { console.error('SEND FAILED'); process.exit(1) }
console.log(`\n✅ Sent from ${FROM_ADDR} → ${TO} (Resend id: ${res.data?.id})`)

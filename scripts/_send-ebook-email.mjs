// One-off: send the "Vibe Coding 101" ebook to all real signups, excluding
// internal/test accounts and anyone opted out. Attaches the PDF, personalizes
// the greeting, includes a real signed unsubscribe link per recipient.
// Usage: node scripts/_send-ebook-email.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'
import fs from 'fs'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
const FROM = 'WyberAi <hello@wyberai.com>'
const SECRET = process.env.SECRETS_ENCRYPTION_KEY || process.env.SUPABASE_WEBHOOK_SECRET || 'wyber-unsub'

function unsubscribeUrl(email) {
  const token = crypto.createHmac('sha256', SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
  return `${APP_URL}/unsubscribe?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${token}`
}

function wrap(content, unsubUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>WyberAi</title></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Inter',system-ui,sans-serif;color:#f0f0f4">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 20px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="padding-bottom:28px;text-align:center">
        <a href="${APP_URL}" style="text-decoration:none">
          <img src="${APP_URL}/email-logo.png" width="40" height="40" alt="" style="display:block;margin:0 auto 10px;border-radius:10px"/>
          <span style="font-size:22px;font-weight:700;color:#f0f0f4;letter-spacing:-0.03em">Wyber<span style="color:#0EA5E9">Ai</span></span>
        </a>
      </td></tr>
      <tr><td style="background:#141416;border:1px solid #2e2e38;border-radius:14px;padding:40px">
        ${content}
      </td></tr>
      <tr><td style="padding-top:28px;text-align:center">
        <p style="font-size:12px;color:#555566;margin:0">
          © ${new Date().getFullYear()} WyberAi &nbsp;·&nbsp;
          <a href="${APP_URL}" style="color:#0EA5E9;text-decoration:none">wyberai.com</a>
          &nbsp;·&nbsp;
          <a href="${unsubUrl}" style="color:#555566;text-decoration:none">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function h1(text) { return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#f0f0f4;letter-spacing:-0.04em;line-height:1.15">${text}</h1>` }
function p(text) { return `<p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">${text}</p>` }

function buildEmail(firstName, unsubUrl) {
  const content = `
    ${h1('I wrote you a short ebook')}
    ${p(`Hey ${firstName},`)}
    ${p(`I've been building WyberAi for a while now, and I put together something short — <strong style="color:#f0f0f4">Vibe Coding 101</strong>. Five pages, no fluff: what WyberAi actually is, what it costs, and five real ways people in India are using it to make money this week — with the exact Google Maps searches and outreach lines.`)}
    ${p(`Attached as a PDF. Should take you about four minutes.`)}
    ${p(`If you read it, hit reply and tell me what you think — I read every one myself.`)}
    ${p('— Sumeet<br>Founder, WyberAi')}
  `
  return wrap(content, unsubUrl)
}

const PDF_PATH = 'C:/Users/sumit/OneDrive/Desktop/Wyber Ai/Vibe Coding 101 - WyberAi Ebook.pdf'
const pdfBuffer = fs.readFileSync(PDF_PATH)
const pdfBase64 = pdfBuffer.toString('base64')
console.log(`PDF loaded: ${(pdfBuffer.length / 1024).toFixed(0)} KB`)

const INTERNAL_DOMAINS = /@(wyberai\.com|signalpulsehq\.com)$/i

// Founder's own/personal addresses ("sutar" surname), other-product admin
// accounts, and QA/test fixtures that aren't real users — not "everyone".
const EXTRA_EXCLUDE = new Set([
  'sumit.sutar@yahoo.com',
  'sumit.sutar259@gmail.com',
  'radhisutar@gmail.com',
  'sumeet.sutar@tryreconsignal.com',
  'sumeet@continuumapi.com',
  'admin@reconsignal.com',
  'testuser@example.com',
  'test@test-org.com',
  'otp-test-verify@example.com',
  'launch-readiness-qa-check@example.com',
  'gtm-e2e@wyberai-smoke.test',
  'gtm-e2e2@wyberai-smoke.test',
  'wybertest11540@web-library.net',
])

const { data: profiles, error } = await sb
  .from('profiles')
  .select('email, full_name, email_opt_out')
  .eq('email_opt_out', false)

if (error) { console.error('profiles query failed:', error.message); process.exit(1) }

const recipients = profiles.filter(p => p.email && !INTERNAL_DOMAINS.test(p.email) && !EXTRA_EXCLUDE.has(p.email.toLowerCase()))
console.log(`${profiles.length} opted-in profiles, ${recipients.length} after excluding internal/test domains${DRY_RUN ? ' (DRY RUN — nothing will be sent)' : ''}\n`)

let sent = 0, failed = 0
for (const r of recipients) {
  const firstName = (r.full_name || r.email.split('@')[0]).split(' ')[0]
  const unsubUrl = unsubscribeUrl(r.email)
  const html = buildEmail(firstName, unsubUrl)

  if (DRY_RUN) {
    console.log(`  would send → ${r.email} (${firstName})`)
    continue
  }

  try {
    const { error: sendErr } = await resend.emails.send({
      from: FROM,
      to: r.email,
      subject: 'I wrote you a short ebook — Vibe Coding 101',
      html,
      attachments: [{ filename: 'Vibe Coding 101 - WyberAi Ebook.pdf', content: pdfBase64 }],
    })
    if (sendErr) { console.warn(`  ! failed ${r.email}: ${sendErr.message}`); failed++ }
    else { console.log(`  sent → ${r.email}`); sent++ }
  } catch (e) {
    console.warn(`  ! failed ${r.email}: ${e.message}`); failed++
  }
  await new Promise(res => setTimeout(res, 350))
}

console.log(`\n── summary ──`)
console.log(`recipients: ${recipients.length}  |  sent: ${sent}  |  failed: ${failed}${DRY_RUN ? '  (dry run)' : ''}`)

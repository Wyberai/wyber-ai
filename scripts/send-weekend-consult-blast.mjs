// One-shot: email all signed-up users (excluding already-booked) about
// weekend founder consultation slots. Run with: node scripts/send-weekend-consult-blast.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load env from .env.local ──────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY      = env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY   = env.RESEND_API_KEY
const APP_URL          = 'https://wyberai.com'

if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
  console.error('Missing env vars'); process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Email design (matches WyberAi design system) ──────────────────────────────
function emailHtml(firstName) {
  const preheader = 'I have a few open slots this weekend — 15 minutes, just us.'
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>WyberAi</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Inter',system-ui,sans-serif;color:#f0f0f4">
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 20px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

      <!-- Logo -->
      <tr><td style="padding-bottom:28px;text-align:center">
        <a href="${APP_URL}" style="text-decoration:none">
          <img src="${APP_URL}/email-logo.png" width="40" height="40" alt="" style="display:block;margin:0 auto 10px;border-radius:10px"/>
          <span style="font-size:22px;font-weight:700;color:#f0f0f4;letter-spacing:-0.03em">Wyber<span style="color:#0EA5E9">Ai</span></span>
        </a>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#141416;border:1px solid #2e2e38;border-radius:14px;padding:40px">

        <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#f0f0f4;letter-spacing:-0.04em;line-height:1.15">
          Hey ${firstName}, got 15 minutes this weekend?
        </h1>

        <p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">
          You signed up for WyberAi, which means you have something you want to build. I'd like to hear it.
        </p>

        <p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">
          I'm doing back-to-back founder calls this weekend — open slots, just you and me. No deck, no brief, no prep. Tell me what you want to build in plain English. I'll tell you exactly what it takes, how to get started, and give you a real plan before the call ends.
        </p>

        <p style="margin:0 0 28px;font-size:15px;color:#8888a0;line-height:1.65">
          These slots are going fast. If you've been sitting on the idea, this is the push.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
          <tr><td style="border-radius:9px;background:#0EA5E9">
            <a href="${APP_URL}/consult" style="display:inline-block;background:#0EA5E9;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:9px;letter-spacing:-0.01em">
              Book your slot this weekend →
            </a>
          </td></tr>
        </table>

        <hr style="border:none;border-top:1px solid #2e2e38;margin:24px 0"/>

        <p style="margin:0;font-size:14px;color:#555566;line-height:1.6">
          — Sumeet<br/>
          Founder, WyberAi<br/>
          <a href="https://x.com/sumeet259" style="color:#0EA5E9;text-decoration:none">@sumeet259</a>
        </p>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:28px;text-align:center">
        <p style="font-size:12px;color:#555566;margin:0">
          © ${new Date().getFullYear()} WyberAi &nbsp;·&nbsp;
          <a href="${APP_URL}" style="color:#0EA5E9;text-decoration:none">wyberai.com</a>
          &nbsp;·&nbsp;
          <a href="${APP_URL}/unsubscribe" style="color:#555566;text-decoration:none">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Get already-booked emails
  const { data: booked } = await supabase
    .from('consultation_meetings')
    .select('attendee_email')
  const bookedEmails = new Set((booked ?? []).map(r => r.attendee_email.toLowerCase()))
  console.log(`Already booked: ${bookedEmails.size} emails excluded`)

  // 2. Get all auth users (paginated, max 1000/page)
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error('listUsers error:', error); process.exit(1) }
    if (!data.users.length) break
    users.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }
  console.log(`Total users: ${users.length}`)

  // 3. Filter: confirmed email, not already booked
  const targets = users.filter(u =>
    u.email &&
    u.email_confirmed_at &&
    !bookedEmails.has(u.email.toLowerCase())
  )
  console.log(`Sending to: ${targets.length} users`)

  if (targets.length === 0) { console.log('Nothing to send.'); return }

  // 4. Send via Resend in batches of 100
  let sent = 0, failed = 0
  const BATCH = 100
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH).map(u => {
      const firstName = (u.user_metadata?.full_name ?? u.email.split('@')[0])
        .split(' ')[0]
        .replace(/[^a-zA-Z]/g, '') || 'there'
      return {
        from: 'Sumeet from WyberAi <hello@wyberai.com>',
        to: u.email,
        subject: 'Got 15 minutes this weekend? (founder call)',
        html: emailHtml(firstName),
      }
    })

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    const result = await res.json()
    if (!res.ok) {
      console.error(`Batch ${i / BATCH + 1} failed:`, JSON.stringify(result))
      failed += batch.length
    } else {
      sent += batch.length
      console.log(`Batch ${i / BATCH + 1}: sent ${batch.length} (total sent: ${sent})`)
    }

    // Brief pause between batches
    if (i + BATCH < targets.length) await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`)
}

main().catch(e => { console.error(e); process.exit(1) })

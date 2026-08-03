// One-off manual send: 4 Meta-ads signups from Jul 23-25. Uses the REAL
// lifecycle templates (sendGettingStartedNudgeEmail / sendPublishNudgeEmail
// logic, copied inline to avoid TS path-alias issues in a plain script) so
// these read exactly like the automated drip would send later — just early,
// because 4 people is worth a manual nudge instead of waiting on the 2-3 day
// cron threshold. Also writes to email_events so the real cron doesn't
// re-send these once the threshold passes.
//
// Run: node scripts/_manual-nudge-jul25.mjs --dry-run   (preview only)
//      node scripts/_manual-nudge-jul25.mjs              (actually sends)
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
const FROM = 'WyberAi <hello@wyberai.com>'

const BUILT_EMAILS = ['sujithpurmesh2244@gmail.com', 'dailyhustlelab.in@gmail.com', 'notion0832@gmail.com']
const NOT_BUILT_EMAILS = ['pankajarajaputa485@gmail.com']
const BONUS_CREDITS = 50

// ── unsubscribe token (mirrors src/lib/email/unsubscribe.ts) ─────────────────
const SECRET = process.env.SECRETS_ENCRYPTION_KEY || process.env.SUPABASE_WEBHOOK_SECRET || 'wyber-unsub'
function unsubscribeUrl(email) {
  const token = crypto.createHmac('sha256', SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
  return `${APP_URL}/unsubscribe?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${token}`
}

// ── email design primitives (mirrors src/lib/email/index.ts) ─────────────────
function wrap(content, preheader, unsubUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>WyberAi</title></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Inter',system-ui,sans-serif;color:#f0f0f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 20px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="padding-bottom:28px;text-align:center"><a href="${APP_URL}" style="text-decoration:none">
<img src="${APP_URL}/email-logo.png" width="40" height="40" alt="" style="display:block;margin:0 auto 10px;border-radius:10px"/>
<span style="font-size:22px;font-weight:700;color:#f0f0f4;letter-spacing:-0.03em">Wyber<span style="color:#0EA5E9">Ai</span></span></a></td></tr>
<tr><td style="background:#141416;border:1px solid #2e2e38;border-radius:14px;padding:40px">${content}</td></tr>
<tr><td style="padding-top:28px;text-align:center"><p style="font-size:12px;color:#555566;margin:0">
© ${new Date().getFullYear()} WyberAi &nbsp;·&nbsp; <a href="${APP_URL}" style="color:#0EA5E9;text-decoration:none">wyberai.com</a>
&nbsp;·&nbsp; <a href="${unsubUrl ?? `${APP_URL}/unsubscribe`}" style="color:#555566;text-decoration:none">Unsubscribe</a></p></td></tr>
</table></td></tr></table></body></html>`
}
function btn(label, url, color = '#0EA5E9') {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:9px;letter-spacing:-0.01em">${label}</a>`
}
function h1(text) { return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#f0f0f4;letter-spacing:-0.04em;line-height:1.15">${text}</h1>` }
function p(text) { return `<p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">${text}</p>` }
function memeImg(file, alt) {
  return `<div style="text-align:center;margin:0 0 24px"><img src="${APP_URL}/email-memes/${file}" alt="${alt}" width="480" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto"/></div>`
}

// ── the two real lifecycle templates ──────────────────────────────────────
async function sendGettingStartedNudgeEmail(to, name, unsubUrl) {
  const html = wrap(`
    ${memeImg('waiting-skeleton.gif', 'Skeleton waiting at a computer')}
    ${h1('Your free credits are still unspent')}
    ${p(`Hey ${name}, you signed up but haven't built anything yet. Your credits have been sitting there so long they've gone full skeleton. Building the first app takes about 60 seconds — less time than it took to read this far.`)}
    ${p(`We also just added <strong style="color:#f0f0f4">${BONUS_CREDITS} bonus credits</strong> to your account — that's 100 to play with, on us.`)}
    ${p('Type one sentence, get a working app:')}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">"A CRM to track my freelance clients and invoices"</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">"A landing page for my bakery with an order form"</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0">"A habit tracker with streaks and charts"</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">${btn('Build your first app →', `${APP_URL}/dashboard`)}</div>
    ${p('Stuck or skeptical? Reply to this email and tell us what you want to build — a human reads every reply.')}
  `, 'Your free credits are waiting', unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: 'Your 50 free credits are still waiting ⚡', html })
}

async function sendPublishNudgeEmail(to, projectName, projectId, unsubUrl) {
  const html = wrap(`
    ${memeImg('leo-pointing.gif', 'Leonardo DiCaprio pointing at the screen')}
    ${h1(`${projectName} is done — but nobody can see it`)}
    ${p(`That's us, pointing at <strong style="color:#f0f0f4">${projectName}</strong>. You built a real app and it's been sitting unpublished like a movie that never premiered. Publishing is one click and completely free — you get a live link you can share anywhere.`)}
    ${p(`We also just added <strong style="color:#f0f0f4">${BONUS_CREDITS} bonus credits</strong> to your account — plenty to polish it up before you go live.`)}
    <div style="text-align:center;margin:28px 0">${btn('Publish it now →', `${APP_URL}/project/${projectId}`)}</div>
    ${p('You can also connect your own domain, push to GitHub, or export the full source as a ZIP.')}
  `, `${projectName} is one click from live`, unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: `${projectName} is one click from being live`, html })
}

// ── driver ─────────────────────────────────────────────────────────────────
async function markSent(userId, kind) {
  const { data: prev } = await sb.from('email_events').select('sent_count').eq('user_id', userId).eq('kind', kind).maybeSingle()
  await sb.from('email_events').upsert({ user_id: userId, kind, sent_count: (prev?.sent_count ?? 0) + 1, last_sent_at: new Date().toISOString() })
}

const allEmails = [...BUILT_EMAILS, ...NOT_BUILT_EMAILS]
const { data: profiles, error: profErr } = await sb.from('profiles').select('id, email, full_name, email_opt_out, credits').in('email', allEmails)
if (profErr) { console.error('profiles query failed:', profErr.message); process.exit(1) }

const results = []
for (const email of allEmails) {
  const prof = profiles.find(p => p.email?.toLowerCase() === email.toLowerCase())
  if (!prof) { results.push({ email, status: 'SKIPPED — profile not found' }); continue }
  if (prof.email_opt_out) { results.push({ email, status: 'SKIPPED — opted out of email' }); continue }

  const firstName = (prof.full_name || '').split(' ')[0] || email.split('@')[0]
  const unsub = unsubscribeUrl(email)

  if (BUILT_EMAILS.includes(email)) {
    const { data: proj } = await sb.from('projects').select('id, name').eq('user_id', prof.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!proj) { results.push({ email, status: 'SKIPPED — no project found (expected one)' }); continue }
    if (DRY_RUN) {
      results.push({ email, status: `WOULD GRANT +${BONUS_CREDITS} (${prof.credits} → ${prof.credits + BONUS_CREDITS}) AND SEND publish-nudge for "${proj.name}"` })
    } else {
      await sb.from('profiles').update({ credits: (prof.credits ?? 0) + BONUS_CREDITS }).eq('id', prof.id)
      await sendPublishNudgeEmail(email, proj.name || 'Your app', proj.id, unsub)
      await markSent(prof.id, 'publish-nudge')
      results.push({ email, status: `GRANTED +${BONUS_CREDITS} credits, SENT publish-nudge for "${proj.name}"` })
    }
  } else {
    if (DRY_RUN) {
      results.push({ email, status: `WOULD GRANT +${BONUS_CREDITS} (${prof.credits} → ${prof.credits + BONUS_CREDITS}) AND SEND getting-started nudge as "${firstName}"` })
    } else {
      await sb.from('profiles').update({ credits: (prof.credits ?? 0) + BONUS_CREDITS }).eq('id', prof.id)
      await sendGettingStartedNudgeEmail(email, firstName, unsub)
      await markSent(prof.id, 'getting-started')
      results.push({ email, status: `GRANTED +${BONUS_CREDITS} credits, SENT getting-started nudge as "${firstName}"` })
    }
  }
}

console.log(DRY_RUN ? '\n[DRY RUN — nothing sent]\n' : '\n[LIVE RUN]\n')
for (const r of results) console.log(`${r.email.padEnd(35)} ${r.status}`)

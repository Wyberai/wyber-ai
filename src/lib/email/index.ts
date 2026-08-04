import { Resend } from 'resend'
import { memeImg } from './memes'
import { formatPrice, type Currency } from '@/lib/currency'
import { PLAN_VALUE, PLAN_VALUE_INR } from '@/lib/pricing-values'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM       = 'WyberAi <hello@wyberai.com>'
const FROM_NOTIF = 'WyberAi <hello@wyberai.com>'
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
const FOUNDER_X_URL        = 'https://x.com/sumeet259'
const FOUNDER_LINKEDIN_URL = 'https://www.linkedin.com/in/sumeetsutar/'

// ── Design primitives ─────────────────────────────────────────────────────────

function wrap(content: string, preheader = '', unsubUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>WyberAi</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Inter',system-ui,sans-serif;color:#f0f0f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
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
          <a href="${unsubUrl ?? `${APP_URL}/unsubscribe`}" style="color:#555566;text-decoration:none">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(label: string, url: string, color = '#0EA5E9'): string {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:9px;letter-spacing:-0.01em">${label}</a>`
}

// Top-up options block. TABLE-based (not flex/grid — Gmail/Outlook strip those,
// which collapsed the card spacing). Currency-aware: pass 'INR' to show rupee
// price points to Indian users; defaults to USD so existing callers are unchanged.
const TOPUPS: [label: string, key: string][] = [
  ['200 credits', 'topup_200'],
  ['600 credits', 'topup_600'],
  ['2,000 credits', 'topup_2000'],
]
function topUpBlock(currency: Currency = 'USD'): string {
  const prices = currency === 'INR' ? PLAN_VALUE_INR : PLAN_VALUE
  const rows = TOPUPS.map(([label, key]) => `
      <tr><td style="padding-bottom:10px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:8px">
          <tr>
            <td style="padding:14px 16px;font-size:14px;color:#f0f0f4;font-weight:500">${label}</td>
            <td align="right" style="padding:14px 16px"><a href="${APP_URL}/pricing#topup" style="font-size:14px;font-weight:600;color:#0EA5E9;text-decoration:none">${formatPrice(prices[key], currency)} →</a></td>
          </tr>
        </table>
      </td></tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px">${rows}</table>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#f0f0f4;letter-spacing:-0.04em;line-height:1.15">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">${text}</p>`
}

function infoBox(rows: [string, string][], borderColor = '#2e2e38'): string {
  return `<div style="background:#1a1a1e;border:1px solid ${borderColor};border-radius:10px;padding:20px;margin:0 0 24px">
    ${rows.map(([label, value]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
        <span style="font-size:13px;color:#8888a0">${label}</span>
        <span style="font-size:13px;color:#f0f0f4;font-weight:500">${value}</span>
      </div>`).join('<hr style="border:none;border-top:1px solid #2e2e38;margin:4px 0"/>')}
  </div>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #2e2e38;margin:24px 0"/>`
}

// ── 1. Welcome (on signup) ────────────────────────────────────────────────────
// `source` branches the opener so a Meta-ad / referral signup doesn't read
// identical to organic — the rest of the email (credits, feature list,
// referral pitch) stays the same, only the hook line changes.
export type WelcomeSource = 'organic' | 'paid-ads' | 'referral'
const WELCOME_HOOKS: Record<WelcomeSource, (name: string) => string> = {
  organic:    (name) => `Hey ${name}, you're in. Your ideas + our AI — this is the handshake.`,
  'paid-ads': (name) => `Hey ${name}, you're in. You clicked an ad — respect for making it this far through 2026's attention economy. Let's make it worth it.`,
  referral:   (name) => `Hey ${name}, you're in — and someone already vouched for WyberAi by inviting you. Let's see if they were right.`,
}
function welcomeHook(source: WelcomeSource, name: string): string {
  return WELCOME_HOOKS[source](name)
}
export async function sendWelcomeEmail(to: string, name?: string, source: WelcomeSource = 'organic') {
  const displayName = name ?? to.split('@')[0]
  const html = wrap(`
    ${memeImg('welcome')}
    ${h1('Welcome to WyberAi ⚡')}
    ${p(welcomeHook(source, displayName))}
    ${p('You have <strong style="color:#f0f0f4">50 free credits</strong> to start building — no credit card needed. Describe any app in plain English and watch WyberAi generate fresh code in real time.')}
    ${p('Here\'s what you can do:')}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;Build a <strong style="color:#f0f0f4">web app</strong> — just describe it in plain English</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;Build a <strong style="color:#f0f0f4">mobile app</strong> — preview on your phone via QR code</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;Paste a <strong style="color:#f0f0f4">screenshot or Figma file</strong> to clone any UI</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0">→ &nbsp;Connect <strong style="color:#f0f0f4">Supabase, Stripe, OpenAI</strong> and 24 more integrations</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Start building →', `${APP_URL}/dashboard`)}
    </div>
    ${divider()}
    ${p('<strong style="color:#f0f0f4">Bring a friend, you both win</strong> — share your invite link from Settings → Referrals. You get 50 credits per signup, they start with 50 free too.')}
    ${p(`I'm building WyberAi in the open — every feature, every number, real. <a href="${FOUNDER_X_URL}" style="color:#0EA5E9">Follow along on X</a> or <a href="${FOUNDER_LINKEDIN_URL}" style="color:#0EA5E9">LinkedIn</a> if that's useful to you.`)}
    ${p('Questions? Just reply — this goes straight to me.')}
    ${p('— Sumeet, founder')}
  `, 'Your 50 free credits are ready')

  return resend.emails.send({ from: FROM, to, subject: 'Welcome to WyberAi ⚡', html })
}

// ── 2. Magic link / OTP ───────────────────────────────────────────────────────
export async function sendMagicLinkEmail(to: string, link: string) {
  const html = wrap(`
    ${h1('Your login link')}
    ${p('Click below to sign in to WyberAi. This link expires in 1 hour and can only be used once.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('Sign in to WyberAi', link)}
    </div>
    ${p("If you didn't request this, you can safely ignore this email.")}
    <p style="margin:16px 0 0;font-size:13px;color:#555566">Or copy this link: <a href="${link}" style="color:#0EA5E9;word-break:break-all">${link}</a></p>
  `, 'Sign in to WyberAi')

  return resend.emails.send({ from: FROM, to, subject: 'Your WyberAi login link', html })
}

// ── Internal owner alerts (new signup / new payment) ──────────────────────────
const ADMIN_NOTIFY = process.env.ADMIN_NOTIFY_EMAIL || 'hello@wyberai.com'

export async function sendAdminSignupAlert(userEmail: string, provider?: string) {
  const html = wrap(`
    ${h1('New signup 🎉')}
    ${p(`<strong style="color:#f0f0f4">${userEmail}</strong> just created a WyberAi account${provider ? ` via ${provider}` : ''}.`)}
    ${infoBox([['Email', userEmail], ['Method', provider || 'email'], ['When', new Date().toUTCString()]])}
  `, `New signup: ${userEmail}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `🎉 New signup: ${userEmail}`, html })
}

export async function sendAdminMcpProjectAlert(userEmail: string, projectName: string, framework: string) {
  const html = wrap(`
    ${h1('Built via Claude MCP ⚡')}
    ${p(`<strong style="color:#f0f0f4">${userEmail}</strong> just created a project through the Claude MCP connector — someone is building WyberAi apps from inside Claude.`)}
    ${infoBox([['Project', projectName], ['Framework', framework], ['User', userEmail], ['When', new Date().toUTCString()]])}
  `, `MCP build: ${projectName}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `⚡ MCP build: ${projectName} — ${userEmail}`, html })
}

export async function sendAdminPaymentAlert(userEmail: string, description: string, amount?: string) {
  // Internal-only email to the founder — money printer goes brrr.
  const html = wrap(`
    ${memeImg('admin-money')}
    ${h1('New payment 💰 brrrrr')}
    ${p(`<strong style="color:#f0f0f4">${userEmail}</strong> just paid.`)}
    ${infoBox([['Customer', userEmail], ['Purchase', description], ...(amount ? [['Amount', amount] as [string, string]] : []), ['When', new Date().toUTCString()]], '#3dd68c44')}
  `, `Payment from ${userEmail}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `💰 Payment: ${description} — ${userEmail}`, html })
}

export async function sendAdminContentReport(opts: {
  slug: string
  reason: string
  details?: string
  projectId?: string
}) {
  // A viewer flagged a published app. Goes to the founder so it can be triaged
  // (and unpublished if needed) within the 24h window both app stores require.
  const appUrl = `${APP_URL}/app/${opts.slug}`
  const html = wrap(`
    ${h1('⚠️ Content reported')}
    ${p(`A published app was reported by a viewer. Review it and take it offline if it violates policy.`)}
    ${infoBox([
      ['App', opts.slug],
      ['Reason', opts.reason],
      ...(opts.details ? [['Details', opts.details] as [string, string]] : []),
      ...(opts.projectId ? [['Project ID', opts.projectId] as [string, string]] : []),
      ['When', new Date().toUTCString()],
    ], '#ef444455')}
    <div style="text-align:center;margin:24px 0 0">${btn('View reported app →', appUrl)}</div>
  `, `Content reported: ${opts.slug}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `⚠️ Content reported: ${opts.slug}`, html })
}

export async function sendAdminPaperLeakTip(opts: {
  examName: string
  state?: string
  year?: number
  description: string
  sourceUrl?: string
  reporterEmail?: string
}) {
  // A visitor to /app/paper-leaks suggested an incident. Nothing auto-publishes —
  // this just gets it in front of the founder to verify against real sources
  // before it's added to src/lib/paper-leaks/data.ts.
  const html = wrap(`
    ${h1('📝 Paper leak tip submitted')}
    ${p('A visitor suggested an incident for the Paper Leaks Dashboard. Verify against real sources before adding it.')}
    ${infoBox([
      ['Exam', opts.examName],
      ...(opts.state ? [['State', opts.state] as [string, string]] : []),
      ...(opts.year ? [['Year', String(opts.year)] as [string, string]] : []),
      ['Description', opts.description],
      ...(opts.sourceUrl ? [['Source', opts.sourceUrl] as [string, string]] : []),
      ...(opts.reporterEmail ? [['Reporter email', opts.reporterEmail] as [string, string]] : []),
      ['When', new Date().toUTCString()],
    ], '#0EA5E955')}
  `, `Paper leak tip: ${opts.examName}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `📝 Paper leak tip: ${opts.examName}`, html })
}

export async function sendChallengeWinnerEmail(to: string, placeLabel: string, credits: number, newBalance?: number) {
  const html = wrap(`
    ${h1(`You won ${placeLabel} 🏆`)}
    ${p(`Your build took <strong style="color:#f0f0f4">${placeLabel}</strong> in this week's WyberAi Build Challenge. Real app, real win — congratulations.`)}
    ${infoBox([
      ['Prize', `${credits.toLocaleString()} credits`],
      ...(typeof newBalance === 'number' ? [['New balance', newBalance.toLocaleString()] as [string, string]] : []),
      ['Credited', 'Instantly — already in your account'],
    ], '#f59e0b55')}
    <div style="text-align:center;margin:0 0 24px">${btn('Keep building →', `${APP_URL}/dashboard`)}</div>
    ${p('Enter again next week — new challenge every Monday, winners every Sunday.')}
  `, `You won ${placeLabel} — ${credits} credits added`)
  return resend.emails.send({ from: FROM, to, subject: `🏆 You won ${placeLabel} — ${credits} credits added`, html })
}

export async function sendCommunityRewardEmail(to: string, programLabel: string, credits: number, discountNote?: string, discountCode?: string) {
  const reward = credits > 0 ? `${credits.toLocaleString()} credits` : (discountNote || 'your reward')
  const useIt: [string, string] = credits > 0
    ? ['Credited', 'Instantly — already in your account']
    : discountCode
      ? ['Your code', `Use <strong style="color:#f0f0f4">${discountCode}</strong> at checkout`]
      : ['How to use it', 'Applied to your next payment — reply if you need a hand']
  const html = wrap(`
    ${h1(`Your ${programLabel} reward is approved ✅`)}
    ${p(`We reviewed your <strong style="color:#f0f0f4">${programLabel}</strong> submission — you're approved. Thanks for being part of the community.`)}
    ${infoBox([['Reward', reward], useIt], '#0EA5E955')}
    <div style="text-align:center;margin:0 0 24px">${btn('Go to your dashboard →', `${APP_URL}/dashboard`)}</div>
  `, `Your ${programLabel} reward is approved`)
  return resend.emails.send({ from: FROM, to, subject: `✅ Your ${programLabel} reward is approved`, html })
}

export async function sendCommunityApplicationAlert(a: { programLabel: string; userEmail: string; proofUrl?: string | null; proofText?: string | null }) {
  // Internal-only: every community-program application lands in the founder's
  // inbox so nothing sits unseen in the queue — click through to /admin/community.
  const html = wrap(`
    ${h1('New community application 🎁')}
    ${p(`Someone applied for <strong style="color:#f0f0f4">${a.programLabel}</strong>.`)}
    ${infoBox([
      ['Program', a.programLabel],
      ['User', a.userEmail],
      ...(a.proofText && !a.proofUrl ? [['Note', a.proofText] as [string, string]] : []),
    ], '#0EA5E944')}
    ${a.proofUrl ? `<div style="text-align:center;margin:0 0 8px">${btn('Open proof ↗', a.proofUrl)}</div>` : ''}
    <div style="text-align:center;margin:0 0 24px">${btn('Review in admin →', `${APP_URL}/admin/community`)}</div>
  `, `New application: ${a.programLabel}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `🎁 ${a.programLabel} application — ${a.userEmail}`, html })
}

export async function sendChallengeEntryAlert(entry: {
  userEmail: string
  title: string
  description: string
  handle?: string | null
  liveUrl?: string | null
  week: string
}) {
  // Internal-only: every contest submission lands in the founder's inbox, so
  // entries are never a hashtag scavenger hunt — this is the canonical feed.
  const html = wrap(`
    ${h1('New challenge entry 🏆')}
    ${p(`<strong style="color:#f0f0f4">${entry.title}</strong> was just submitted to the Weekly Build Challenge.`)}
    ${infoBox([
      ['Builder', entry.userEmail],
      ['Handle', entry.handle || '—'],
      ['Week', entry.week],
      ['Pitch', entry.description],
      ...(entry.liveUrl ? [['Live', entry.liveUrl] as [string, string]] : [['Live link', 'not shared (screenshot only)'] as [string, string]]),
    ], '#0EA5E944')}
    ${entry.liveUrl ? `<div style="text-align:center;margin:0 0 8px">${btn('Open the build ↗', entry.liveUrl)}</div>` : ''}
  `, `New entry: ${entry.title}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `🏆 Challenge entry: ${entry.title} — ${entry.userEmail}`, html })
}

// ── 2a. Free-scanner lead magnet (/tools) ─────────────────────────────────────
// Visitor ran a security/SEO scan and asked us to email the full report. This is
// the lead-magnet delivery — it honours the "email me the report" promise AND
// drops them into the funnel with a CTA to build the fixed app on WyberAi.
export async function sendScannerReport(to: string, opts: {
  tool: 'security' | 'seo'
  domain: string
  score: number
  findingsCount: number
  topSeverity?: string
}) {
  const isSec = opts.tool === 'security'
  const label = isSec ? 'Security scan' : 'SEO audit'
  const verdict = opts.score >= 80 ? 'Strong' : opts.score >= 50 ? 'Needs work' : 'At risk'
  const issueWord = isSec ? 'leak' : 'issue'
  const issues = `${opts.findingsCount} ${issueWord}${opts.findingsCount === 1 ? '' : 's'}`
  const cta = isSec
    ? 'Every app you build on WyberAi is scanned for these leaks before it can publish. Build the fixed version — web + mobile — in minutes.'
    : 'Apps built on WyberAi ship SEO-ready out of the box. Rebuild it findable — web + mobile — in minutes.'
  const html = wrap(`
    ${h1(`Your ${label} results`)}
    ${p(`Here's the summary for <strong style="color:#f0f0f4">${opts.domain}</strong>. Keep this email — it's your snapshot.`)}
    ${infoBox([
      ['Score', `${opts.score} / 100 · ${verdict}`],
      [isSec ? 'Leaks found' : 'Issues found', issues],
      ...(opts.topSeverity && opts.topSeverity !== 'good' ? [['Most serious', opts.topSeverity] as [string, string]] : []),
    ], opts.score >= 80 ? '#10b98155' : opts.score >= 50 ? '#f59e0b55' : '#ef444455')}
    ${p(cta)}
    <div style="text-align:center;margin:8px 0 24px">${btn('Build a safe app free →', `${APP_URL}/?utm_source=scanner_email&utm_campaign=${opts.tool}`)}</div>
    ${p(`<span style="color:#555566">Run it again anytime at ${APP_URL}/tools</span>`)}
  `, `Your ${label}: ${opts.score}/100 (${issues})`)
  return resend.emails.send({ from: FROM, to, subject: `Your ${label} — ${opts.score}/100`, html })
}

export async function sendScannerLeadAlert(opts: {
  email: string
  tool: 'security' | 'seo'
  domain: string
  score: number
  findingsCount: number
}) {
  // Internal-only: every scanner lead lands in the founder's inbox so inbound
  // interest is followed up fast — this is the wedge-tool → outbound handoff.
  const label = opts.tool === 'security' ? 'security scan' : 'SEO audit'
  const html = wrap(`
    ${h1('New scanner lead 🎯')}
    ${p(`<strong style="color:#f0f0f4">${opts.email}</strong> ran a ${label} and asked for the report.`)}
    ${infoBox([
      ['Email', opts.email],
      ['Tool', label],
      ['Scanned', opts.domain],
      ['Score', `${opts.score} / 100`],
      ['Findings', String(opts.findingsCount)],
      ['When', new Date().toUTCString()],
    ], '#0EA5E944')}
  `, `New scanner lead: ${opts.email}`)
  return resend.emails.send({ from: FROM_NOTIF, to: ADMIN_NOTIFY, subject: `🎯 Scanner lead: ${opts.email} (${label})`, html })
}

// ── 2b. Auth emails (Supabase Send Email Hook) ────────────────────────────────
// One branded template for every auth action so login/signup/reset match the
// rest of WyberAi instead of Supabase's default look.
type AuthAction = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'reauthentication' | string
export async function sendAuthEmail(to: string, action: AuthAction, url: string, token?: string) {
  const cfg: Record<string, { subject: string; heading: string; body: string; cta: string }> = {
    signup:          { subject: 'Confirm your WyberAi account',        heading: 'Confirm your email',      body: 'Welcome to WyberAi! Confirm your email to activate your account and claim your 50 free credits.', cta: 'Confirm email' },
    magiclink:       { subject: 'Your WyberAi login link',             heading: 'Your login link',          body: 'Click below to sign in to WyberAi. This link expires in 1 hour and can only be used once.',       cta: 'Sign in to WyberAi' },
    recovery:        { subject: 'Reset your WyberAi password',         heading: 'Reset your password',      body: "Click below to choose a new password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.", cta: 'Reset password' },
    invite:          { subject: "You're invited to WyberAi",          heading: "You're invited to WyberAi", body: "You've been invited to WyberAi. Click below to accept and set up your account.",                  cta: 'Accept invite' },
    email_change:    { subject: 'Confirm your new email — WyberAi',    heading: 'Confirm your new email',   body: 'Confirm this address to finish updating the email on your WyberAi account.',                       cta: 'Confirm new email' },
    reauthentication:{ subject: 'Your WyberAi verification code',      heading: 'Verification code',        body: 'Use the code below to continue. It expires shortly.',                                              cta: '' },
  }
  // Safe default for any unrecognized action type: a neutral account email,
  // never a misleading "login link".
  const fallback = { subject: 'WyberAi account notification', heading: 'Account notification', body: 'There was an update related to your WyberAi account.', cta: url ? 'Open WyberAi' : '' }
  const c = cfg[action] ?? fallback

  const html = wrap(`
    ${h1(c.heading)}
    ${p(c.body)}
    ${c.cta && url ? `<div style="text-align:center;margin:28px 0">${btn(c.cta, url)}</div>` : ''}
    ${token ? `<div style="text-align:center;margin:0 0 8px"><span style="display:inline-block;font-size:26px;font-weight:700;letter-spacing:0.3em;color:#f0f0f4;background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:14px 24px">${token}</span></div><p style="text-align:center;font-size:12px;color:#555566;margin:8px 0 0">Your verification code</p>` : ''}
    ${c.cta && url ? `<p style="margin:16px 0 0;font-size:12px;color:#555566">Or copy this link: <a href="${url}" style="color:#0EA5E9;word-break:break-all">${url}</a></p>` : ''}
  `, c.heading)

  return resend.emails.send({ from: FROM, to, subject: c.subject, html })
}

// ── 3. Plan upgrade confirmed ─────────────────────────────────────────────────
// Meme matrix: DJ Khaled "Suffering from Success" — congratulate them on
// unlocking god-mode.
export async function sendUpgradeConfirmEmail(to: string, plan: string, credits: number) {
  const html = wrap(`
    ${memeImg('upgrade-success')}
    ${h1(`Suffering from Success? Welcome to ${plan} 🏆`)}
    ${p(`Your upgrade to <strong style="color:#f0f0f4">WyberAi ${plan}</strong> is confirmed and active <em>right now</em>. You officially have too much power. Try not to break the internet with it.`)}
    ${infoBox([
      ['Monthly credits', credits.toLocaleString()],
      ['Credit rollover', '✓ Unused credits carry forward'],
      ['Features', '✓ Every feature unlocked — web, mobile, deploy & more'],
    ], '#0EA5E944')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Open dashboard →', `${APP_URL}/dashboard`)}
    </div>
    ${p('To manage billing or cancel anytime, go to Settings → Billing.')}
  `, `Your ${plan} plan is active`)

  return resend.emails.send({ from: FROM, to, subject: `Suffering from Success? Welcome to ${plan} 🏆 (confirmed)`, html })
}

// ── 4. Subscription renewed ───────────────────────────────────────────────────
// DJ Khaled again, but this time: "Another one."
export async function sendRenewalEmail(to: string, plan: string, creditsAdded: number, rollover: number) {
  const html = wrap(`
    ${memeImg('renewal')}
    ${h1('Another one. 🔑')}
    ${p(`Your <strong style="color:#f0f0f4">WyberAi ${plan}</strong> subscription renewed and a fresh month of credits just landed. Major key to success: not having to think about this at all.`)}
    ${infoBox([
      ['New monthly credits', creditsAdded.toLocaleString()],
      ['Rolled over from last month', rollover > 0 ? `+${rollover}` : '0'],
      ['Total balance', (creditsAdded + rollover).toLocaleString()],
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Keep building →', `${APP_URL}/dashboard`)}
    </div>
  `, `${creditsAdded} credits added to your account`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Another one. ${plan} renewed — ${creditsAdded} credits added 🔑`, html })
}

// ── 5. Subscription cancelled ─────────────────────────────────────────────────
// Ben Affleck smoking outside. We're not mad. We're just processing.
export async function sendCancellationEmail(to: string, plan: string) {
  const html = wrap(`
    ${memeImg('cancelled')}
    ${h1("We're not mad. We're just standing outside for a bit.")}
    ${p(`Your <strong style="color:#f0f0f4">WyberAi ${plan}</strong> subscription has been cancelled. We took it like absolute champions (see above).`)}
    ${p('Your account moves to the Free plan. Any unused credits from your plan are removed, but any one-time top-up credits you purchased are kept — those are yours forever.')}
    ${p("Seriously though — what made you cancel? Hit reply and tell us. 30 seconds, a human reads it, and it genuinely shapes what we build next.")}
    ${divider()}
    ${p('Changed your mind? You can resubscribe anytime — your projects and history are still there.')}
    <div style="text-align:center;margin:24px 0">
      ${btn('Resubscribe', `${APP_URL}/pricing`, '#3d3d4a')}
    </div>
  `, 'Your subscription has ended')

  return resend.emails.send({ from: FROM, to, subject: `WyberAi ${plan} cancelled`, html })
}

// ── 6. Credit top-up confirmed ────────────────────────────────────────────────
// Stonks. Line goes up.
export async function sendTopupEmail(to: string, credits: number, newBalance: number) {
  const html = wrap(`
    ${memeImg('topup')}
    ${h1(`${credits} credits added 📈`)}
    ${p('Purchase confirmed. Credit balance: <strong style="color:#3dd68c">stonks</strong>. And unlike your actual portfolio, these never go down on their own — they never expire.')}
    ${infoBox([
      ['Credits purchased', `+${credits}`],
      ['New balance', newBalance.toLocaleString()],
      ['Expiry', 'Never — top-up credits never expire'],
    ], '#3dd68c44')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Start building →', `${APP_URL}/dashboard`)}
    </div>
  `, `${credits} credits added to your account`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `${credits} credits added to WyberAi ✓`, html })
}

// ── 6a2. Goodwill bonus credits (admin-granted, no purchase) ─────────────────
export async function sendBonusCreditEmail(to: string, credits: number, newBalance: number) {
  const html = wrap(`
    ${h1(`${credits} credits, on us 🎁`)}
    ${p(`Thanks for building with WyberAi early on — we've added <strong style="color:#f0f0f4">${credits} bonus credits</strong> to your account, no strings attached.`)}
    ${infoBox([
      ['Bonus credits', `+${credits}`],
      ['New balance', newBalance.toLocaleString()],
    ], '#0EA5E944')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Back to your project →', `${APP_URL}/dashboard`)}
    </div>
  `, `${credits} bonus credits added to your account`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `A little something extra — ${credits} credits on us 🎁`, html })
}

// ── 6b. Payment failed (dunning) ──────────────────────────────────────────────
// Meme matrix: Hulk Hogan's twin-referee meltdown — "they took the belt right
// off our waist!" The bank ran a dirty finish on the transaction.
export async function sendPaymentFailedEmail(to: string, plan?: string, attemptNumber = 1) {
  const planLabel = plan ? `WyberAi ${plan}` : 'your WyberAi subscription'
  const variants = [
    {
      subject: `Whose belt is this anyway?! (Your WyberAi payment failed)`,
      heading: 'THEY TOOK THE BELT RIGHT OFF OUR WAIST 😭',
      meme: 'payment-failed' as const,
      body: `Okay, deep breaths. Your bank just ran a <em>dirty finish</em> on the latest payment for <strong style="color:#f0f0f4">${planLabel}</strong> — usually an expired card or insufficient funds, occasionally just your bank being dramatic.`,
      cta: 'Reclaim the belt →',
    },
    {
      subject: `Still no belt (payment retry #2 failed)`,
      heading: 'Second retry, same result',
      meme: undefined,
      body: `We tried again and it still didn't go through for <strong style="color:#f0f0f4">${planLabel}</strong>. Worth double-checking your card hasn't expired or hit its limit.`,
      cta: 'Update payment method →',
    },
    {
      subject: `Final notice — your plan pauses soon`,
      heading: 'One more try before we have to pause things',
      meme: undefined,
      body: `Third attempt, still failed. If payment doesn't go through on the next retry, <strong style="color:#f0f0f4">${planLabel}</strong> moves to the Free plan automatically — your projects and history are never touched, only the paid features pause.`,
      cta: 'Fix it before then →',
    },
  ]
  const v = variants[Math.min(Math.max(attemptNumber - 1, 0), variants.length - 1)]
  const html = wrap(`
    ${v.meme ? memeImg(v.meme) : ''}
    ${h1(v.heading)}
    ${p(v.body)}
    ${p('Update your payment method and we\'ll retry automatically. The championship belt (your plan and credits) goes right back around your waist.')}
    <div style="text-align:center;margin:28px 0">
      ${btn(v.cta, `${APP_URL}/settings?tab=billing`, '#f0a429')}
    </div>
    ${p('If we can\'t collect payment, your account moves to the Free plan — but your projects and history stay exactly where you left them. Nobody touches those.')}
    ${p('Think the charge itself is wrong? Just reply — hello@wyberai.com goes straight to a human referee.')}
  `, v.subject)

  return resend.emails.send({ from: FROM, to, subject: v.subject, html })
}

// ── 6c. Refund processed ──────────────────────────────────────────────────────
export async function sendRefundEmail(to: string, amount?: string) {
  const html = wrap(`
    ${h1('Your refund is on the way')}
    ${p(`We've processed a refund${amount ? ` of <strong style="color:#f0f0f4">${amount}</strong>` : ''} to your original payment method.`)}
    ${p('Depending on your bank, it can take 5–10 business days to appear on your statement.')}
    ${p('We\'re sorry to see you go. If there\'s anything we could have done better, hit reply — we read every message.')}
    <div style="text-align:center;margin:24px 0">
      ${btn('Back to WyberAi', `${APP_URL}`, '#3d3d4a')}
    </div>
  `, 'Your WyberAi refund has been processed')

  return resend.emails.send({ from: FROM, to, subject: 'Your WyberAi refund has been processed', html })
}

// ── 7. Running low on credits ─────────────────────────────────────────────────
// "This is fine." — dog, burning room. The balance is the room.
export async function sendCreditLowEmail(to: string, remaining: number, currency: Currency = 'USD') {
  const prices = currency === 'INR' ? PLAN_VALUE_INR : PLAN_VALUE
  const html = wrap(`
    ${memeImg('credits-low')}
    ${h1('This is fine. 🔥')}
    ${p(`Everything is fine. Totally fine. You have <strong style="color:#f0a429">${remaining} credits</strong> left, which is roughly ${remaining >= 30 ? 'one build' : 'a few edits'} before the room is fully on fire.`)}
    ${p('Top up before the flames reach the desk — top-up credits never expire and are yours forever.')}
    ${topUpBlock(currency)}
    ${p('Or upgrade to the <a href="' + APP_URL + '/pricing" style="color:#0EA5E9">Builder plan</a> — 500 credits/month at ' + formatPrice(prices.builder_monthly, currency) + '.')}
  `, `${remaining} credits remaining`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `This is fine — ${remaining} credits remaining 🔥`, html })
}

// ── 7b. Out of credits — recurring drip (cron: /api/cron/email-drip) ─────────
// sendNumber varies the copy so nudge #3 doesn't read like nudge #1 verbatim.
// Marketing email → always carries the recipient's signed unsubscribe link.
export async function sendCreditsExhaustedEmail(to: string, sendNumber: number, unsubUrl: string, currency: Currency = 'USD') {
  // Meme matrix: nudge 1 = Wonka "You get nothing!", nudge 3 = Ben Affleck
  // smoking (peak exhaustion). Nudge 4 stays meme-free — a respectful goodbye
  // reads wrong with a GIF on top.
  const prices = currency === 'INR' ? PLAN_VALUE_INR : PLAN_VALUE
  const variants: { subject: string; heading: string; body: string; meme?: Parameters<typeof memeImg>[0] }[] = [
    {
      subject: "You lose! Good day, sir! 🍫 (You're out of credits)",
      heading: 'You get nothing! Good day, sir!',
      body: "You ran through those credits faster than Charlie went through the chocolate factory. Builds and edits are paused — but unlike Wonka, we're bluffing: your projects are saved exactly where you left them, and one top-up reopens the gates.",
      meme: 'out-of-credits',
    },
    {
      subject: 'Your projects are waiting on WyberAi',
      heading: 'Still there. Still saved.',
      body: `Everything you built is safe in your dashboard — it just needs credits to keep evolving. 200 credits is ${formatPrice(prices.topup_200, currency)} and they never expire.`,
    },
    {
      subject: 'Your credits are still at zero and honestly... same 🚬',
      heading: "We're not mad. We're just standing outside.",
      body: "Your balance has been at zero for a while and your half-finished app knows it. We're out here doing our best Ben Affleck impression about it. Most ideas die at 80% done — yours doesn't have to. One top-up covers roughly 6 full builds or 100 edits, and unused credits never expire.",
      meme: 'nudge-exhausted',
    },
    {
      subject: 'Last nudge from us — your credits are still at zero',
      heading: "We'll stop nudging after this one",
      body: "This is the last reminder we'll send about your empty balance — no hard feelings either way. If you ever want to finish those projects, they'll be waiting.",
    },
  ]
  const v = variants[Math.min(Math.max(sendNumber - 1, 0), variants.length - 1)]
  const html = wrap(`
    ${v.meme ? memeImg(v.meme) : ''}
    ${h1(v.heading)}
    ${p(v.body)}
    ${topUpBlock(currency)}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Or go monthly — plans from ' + formatPrice(prices.starter_monthly, currency) + ' →', `${APP_URL}/pricing`)}
    </div>
    ${p('Every plan includes every feature. Unused credits roll over; top-ups never expire.')}
  `, v.heading, unsubUrl)
  return resend.emails.send({ from: FROM_NOTIF, to, subject: v.subject, html })
}

// ── 7c. Never-built nudge (signed up, never generated an app) ────────────────
export async function sendGettingStartedNudgeEmail(to: string, name: string, unsubUrl: string) {
  const html = wrap(`
    ${memeImg('still-waiting')}
    ${h1('Your 50 free credits are still unspent')}
    ${p(`Hey ${name}, you signed up but haven't built anything yet. Your credits have been sitting there so long they've gone full skeleton. Building the first app takes about 60 seconds — less time than it took to read this far.`)}
    ${p('Type one sentence, get a working app:')}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">“A CRM to track my freelance clients and invoices”</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">“A landing page for my bakery with an order form”</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0">“A habit tracker with streaks and charts”</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Build your first app →', `${APP_URL}/dashboard`)}
    </div>
    ${p('Stuck or skeptical? Reply to this email and tell us what you want to build — a human reads every reply.')}
  `, 'Your free credits are waiting', unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: 'Your 50 free credits are still waiting ⚡', html })
}

// ── 7d. Built-but-never-published nudge — 2-touch (was one-shot only) ───────
export async function sendPublishNudgeEmail(to: string, projectName: string, projectId: string, unsubUrl: string, sendNumber = 1) {
  const variants = [
    {
      subject: `${projectName} is one click from being live`,
      heading: `${projectName} is done — but nobody can see it`,
      meme: 'publish-nudge' as const,
      body: `That's us, pointing at <strong style="color:#f0f0f4">${projectName}</strong>. You built a real app and it's been sitting unpublished like a movie that never premiered. Publishing is one click and completely free — you get a live link you can share anywhere.`,
    },
    {
      subject: `Second reminder: ${projectName} is still unpublished`,
      heading: `Okay, one more nudge`,
      meme: undefined,
      body: `${projectName} is still sitting there, finished and unpublished. Last time we'll bring it up — publishing takes one click, costs nothing, and gives you a real link to send people instead of a screen recording.`,
    },
  ]
  const v = variants[Math.min(sendNumber - 1, variants.length - 1)]
  const html = wrap(`
    ${v.meme ? memeImg(v.meme) : ''}
    ${h1(v.heading)}
    ${p(v.body)}
    <div style="text-align:center;margin:28px 0">
      ${btn('Publish it now →', `${APP_URL}/project/${projectId}`)}
    </div>
    ${p('You can also connect your own domain, push to GitHub, or export the full source as a ZIP.')}
  `, v.subject, unsubUrl)
  return resend.emails.send({ from: FROM_NOTIF, to, subject: v.subject, html })
}

// ── 8. App deployed successfully ──────────────────────────────────────────────
// Jonah Hill losing his mind — pure, unfiltered hype. It's the user's biggest
// moment on the platform; the email should scream a little.
export async function sendDeploySuccessEmail(to: string, projectName: string, url: string) {
  const html = wrap(`
    ${memeImg('deployed')}
    ${h1("IT'S HAPPENING — your app is LIVE 💥")}
    ${p(`<strong style="color:#f0f0f4">${projectName}</strong> is on the internet. Right now. With a real URL. We couldn't even keep our cool writing this email.`)}
    <div style="background:#1a1a1e;border:1px solid #3dd68c33;border-radius:10px;padding:18px 20px;margin:0 0 24px">
      <span style="color:#3dd68c;font-size:14px">● Live &nbsp;</span>
      <a href="${url}" style="color:#3dd68c;font-size:14px;text-decoration:none;word-break:break-all;font-weight:500">${url}</a>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View live app ↗', url, '#3dd68c')}
    </div>
    ${p("Keep iterating — every generation auto-saves. Connect GitHub to commit changes automatically.")}
  `, `${projectName} is live`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `IT'S HAPPENING — ${projectName} is live 💥`, html })
}

// ── 9. Security / deploy blocked ─────────────────────────────────────────────
export async function sendSecurityAlertEmail(to: string, projectName: string, flags: string[]) {
  const html = wrap(`
    ${h1('Deploy blocked: security review')}
    ${p(`We blocked a deployment of <strong style="color:#f0f0f4">${projectName}</strong> because our security scanner detected potential issues.`)}
    <div style="background:#1a1a1e;border:1px solid #f0525233;border-radius:10px;padding:18px 20px;margin:0 0 24px">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#f05252;text-transform:uppercase;letter-spacing:0.06em">Flags detected</p>
      <ul style="margin:0;padding-left:16px;color:#8888a0;font-size:14px;line-height:1.9">
        ${flags.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    ${p("False positive? Reply to this email with your project name and we'll review it within 24 hours.")}
    ${p('WyberAi does not permit phishing, credential harvesting, or malware distribution.')}
  `, `Deploy blocked on ${projectName}`)

  return resend.emails.send({ from: FROM, to, subject: `Deployment blocked: ${projectName}`, html })
}

// ── 10. Team / collaborator invite ───────────────────────────────────────────
export async function sendTeamInviteEmail(to: string, inviterName: string, projectName: string, inviteUrl: string) {
  const html = wrap(`
    ${h1(`${inviterName} invited you`)}
    ${p(`You've been invited to collaborate on <strong style="color:#f0f0f4">${projectName}</strong> on WyberAi.`)}
    <div style="text-align:center;margin:28px 0">
      ${btn('Accept invitation →', inviteUrl)}
    </div>
    ${p("This invitation expires in 7 days. If you weren't expecting this, you can ignore it.")}
  `, `You're invited to ${projectName}`)

  return resend.emails.send({ from: FROM, to, subject: `${inviterName} invited you to ${projectName} on WyberAi`, html })
}

// ── 11. Agent execution completed ────────────────────────────────────────────
export async function sendAgentCompletedEmail(to: string, agentName: string, steps: number, creditsUsed: number, summary?: string) {
  const html = wrap(`
    ${h1(`Agent finished: ${agentName}`)}
    ${p('Your AI agent completed its run successfully.')}
    ${infoBox([
      ['Agent', agentName],
      ['Steps completed', steps.toString()],
      ['Credits used', creditsUsed.toString()],
    ])}
    ${summary ? `<div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:18px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#555566;text-transform:uppercase;letter-spacing:0.06em">Summary</p>
      <p style="margin:0;font-size:14px;color:#8888a0;line-height:1.65">${summary}</p>
    </div>` : ''}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View results →', `${APP_URL}/agents`)}
    </div>
  `, `${agentName} completed`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Agent completed: ${agentName}`, html })
}

// ── 12. Agent execution failed ────────────────────────────────────────────────
export async function sendAgentFailedEmail(to: string, agentName: string, error: string) {
  const html = wrap(`
    ${h1(`Agent failed: ${agentName}`)}
    ${p('Your AI agent encountered an error and could not complete its run.')}
    <div style="background:#1a1a1e;border:1px solid #f0525233;border-radius:10px;padding:18px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f05252;text-transform:uppercase;letter-spacing:0.06em">Error</p>
      <p style="margin:0;font-size:13px;color:#8888a0;font-family:monospace;word-break:break-all">${error}</p>
    </div>
    ${p('No credits were charged for a failed run. You can retry from the Agents dashboard.')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View agents →', `${APP_URL}/agents`)}
    </div>
  `, `${agentName} failed`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Agent failed: ${agentName}`, html })
}

// ── 13. Workflow run completed ────────────────────────────────────────────────
export async function sendWorkflowCompletedEmail(to: string, workflowName: string, creditsUsed: number) {
  const html = wrap(`
    ${h1(`Workflow ran: ${workflowName}`)}
    ${p('Your workflow completed successfully.')}
    ${infoBox([
      ['Workflow', workflowName],
      ['Credits used', creditsUsed.toString()],
      ['Status', '✓ Success'],
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View run history →', `${APP_URL}/flows`)}
    </div>
  `, `${workflowName} ran successfully`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Workflow completed: ${workflowName}`, html })
}

// ── 14. Workflow run failed ───────────────────────────────────────────────────
export async function sendWorkflowFailedEmail(to: string, workflowName: string, error: string) {
  const html = wrap(`
    ${h1(`Workflow failed: ${workflowName}`)}
    ${p('Your workflow encountered an error during its run.')}
    <div style="background:#1a1a1e;border:1px solid #f0525233;border-radius:10px;padding:18px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f05252;text-transform:uppercase;letter-spacing:0.06em">Error</p>
      <p style="margin:0;font-size:13px;color:#8888a0;font-family:monospace;word-break:break-all">${error}</p>
    </div>
    ${p('Check the run log for details and fix the failing node.')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View workflow →', `${APP_URL}/flows`)}
    </div>
  `, `${workflowName} failed`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Workflow failed: ${workflowName}`, html })
}

// ── 15. Support ticket received ───────────────────────────────────────────────
export async function sendSupportAckEmail(to: string, name: string, message: string) {
  const html = wrap(`
    ${h1('Got your message')}
    ${p(`Hi ${name}, we received your support request and we'll get back to you within a few hours.`)}
    <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:18px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#555566;text-transform:uppercase;letter-spacing:0.06em">Your message</p>
      <p style="margin:0;font-size:14px;color:#8888a0;line-height:1.65">${message.slice(0, 300)}${message.length > 300 ? '…' : ''}</p>
    </div>
    ${p('In the meantime, check the <a href="' + APP_URL + '/docs" style="color:#0EA5E9">docs</a> — most common questions are answered there.')}
    ${divider()}
    ${p('Reply directly to this email if you have more details to add.')}
  `, 'We got your support request')

  return resend.emails.send({ from: FROM, to, subject: "We got your message — WyberAi support", html })
}

// ── 16. Community template published ─────────────────────────────────────────
export async function sendTemplatePublishedEmail(to: string, templateName: string, templateUrl: string) {
  const html = wrap(`
    ${h1('Template published ✓')}
    ${p(`<strong style="color:#f0f0f4">${templateName}</strong> is now live in the WyberAi community gallery.`)}
    ${p('Other builders can discover and use it. Every time someone uses your template, it gains popularity in the gallery.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('View your template →', templateUrl)}
    </div>
    ${p('Thanks for contributing to the WyberAi community.')}
  `, `${templateName} is now in the gallery`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Template published: ${templateName}`, html })
}

// ── 17. First app built (onboarding milestone) ────────────────────────────────
export async function sendFirstBuildEmail(to: string, name: string, projectName: string, previewUrl: string) {
  const html = wrap(`
    ${memeImg('first-build')}
    ${h1('You built your first app 🎉')}
    ${p(`${name}, <strong style="color:#f0f0f4">${projectName}</strong> is ready. Most people talk about building an app for years. You did it before lunch.`)}
    ${p("Here's what you can do next:")}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Deploy it</strong> — go live in one click</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Connect Supabase</strong> — add a real database so data persists</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Share it</strong> — export as a ZIP or push to GitHub</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;color:#8888a0">→ &nbsp;<strong style="color:#f0f0f4">Keep building</strong> — chat with the AI to add features</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Open your app →', previewUrl)}
    </div>
  `, `${projectName} is ready`)

  return resend.emails.send({ from: FROM, to, subject: `You built ${projectName} ✓`, html })
}

// ── 19. AI Employees waitlist confirmation ────────────────────────────────────
export async function sendAIEmployeesWaitlistEmail(to: string) {
  const html = wrap(`
    ${h1("You're on the list 🤖")}
    ${p("AI Employees is coming — and you're first in line.")}
    ${p("We're putting the finishing touches on a new kind of team member: AI workers that connect to your tools, run on a schedule you set, and handle the work that eats your day.")}
    <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:20px;margin:0 0 24px">
      <p style="margin:0 0 12px;font-size:13px;color:#8888a0;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">What's coming</p>
      ${['AI SDR — qualifies leads & logs them to your CRM', 'AI Inbox Manager — drafts replies, starts your day at zero', 'AI Ops Assistant — connects your tools & runs workflows', 'AI Research Analyst — monitors topics & delivers briefs', '+ 6 more roles across Sales, Support, Marketing & Admin'].map(item => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #2e2e38">
          <span style="color:#0EA5E9;font-size:13px;flex-shrink:0">→</span>
          <span style="font-size:14px;color:#f0f0f4">${item}</span>
        </div>`).join('')}
    </div>
    <div style="text-align:center;margin:28px 0">
      ${btn('Explore WyberAi now →', `${APP_URL}/dashboard`)}
    </div>
    ${p("In the meantime — you can already build web apps, mobile apps, and run AI agents on Wyber. Start free while you wait.")}
  `, "You're on the AI Employees early access list")

  return resend.emails.send({ from: FROM, to, subject: "You're on the AI Employees waitlist 🤖", html })
}

// ── 18. Weekly digest (credits summary) ──────────────────────────────────────
export async function sendWeeklyDigestEmail(to: string, name: string, stats: {
  appsBuilt: number
  creditsUsed: number
  creditsRemaining: number
  topProject?: string
}) {
  // Power-user flex (meme matrix: Homelander nod) — only when the week's
  // numbers actually earn it; a 2-build week with a Homelander GIF reads odd.
  const powerUser = stats.appsBuilt >= 10
  const html = wrap(`
    ${powerUser ? memeImg('power-user') : ''}
    ${powerUser ? h1("You're doing numbers. We see you. 🦸") : h1('Your week on WyberAi')}
    ${powerUser
      ? p(`${name}, ${stats.appsBuilt} builds and edits in one week. That's not regular usage — that's superpower-level output. The crowd is cheering and we're nodding approvingly.`)
      : p(`Here's what you built this week, ${name}.`)}
    ${infoBox([
      ['Apps & edits', stats.appsBuilt.toString()],
      ['Credits used', stats.creditsUsed.toString()],
      ['Credits remaining', stats.creditsRemaining.toString()],
      ...(stats.topProject ? [['Most active project', stats.topProject] as [string, string]] : []),
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Keep building →', `${APP_URL}/dashboard`)}
    </div>
    ${stats.creditsRemaining <= 50
      ? p('Running low? <a href="' + APP_URL + '/pricing" style="color:#0EA5E9">Top up or upgrade</a> — credits never expire.')
      : ''}
  `, `Your WyberAi week in review`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Your WyberAi week — ${stats.appsBuilt} builds, ${stats.creditsRemaining} credits left`, html })
}

// ── 20. AI Employee run digest ────────────────────────────────────────────────
export async function sendAIEmployeeDigestEmail(
  to: string,
  employee: { name: string; emoji: string; role: string },
  run: {
    summary: string
    actionsTaken: { tool: string; action: string; result_summary: string }[]
    kpiResults?: { name: string; value: number; unit: string }[]
    creditsUsed: number
    durationMs: number
    runId: string
  }
) {
  const kpiHtml = run.kpiResults && run.kpiResults.length > 0 ? `
    <div style="background:#071e2e;border:1px solid #0c3a52;border-radius:10px;padding:20px;margin:0 0 20px">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#555566;text-transform:uppercase;letter-spacing:0.07em">KPI Results</p>
      ${run.kpiResults.map(k => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #0c3a52">
          <span style="font-size:13px;color:#8888a0">${k.name}</span>
          <span style="font-size:15px;font-weight:700;color:#0EA5E9">${k.value} <span style="font-size:11px;font-weight:400;color:#555566">${k.unit}</span></span>
        </div>`).join('')}
    </div>` : ''

  const actionsHtml = run.actionsTaken.length > 0 ? `
    <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:20px;margin:0 0 20px">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#555566;text-transform:uppercase;letter-spacing:0.07em">Actions taken</p>
      ${run.actionsTaken.map(a => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #1e1e26">
          <img src="https://img.logo.dev/${a.tool.toLowerCase()}.com?token=pk_placeholder&size=20" width="20" height="20" style="border-radius:4px;margin-top:1px;flex-shrink:0" onerror="this.style.display='none'" />
          <div>
            <span style="font-size:11px;font-family:monospace;color:#0EA5E9;background:rgba(14,165,233,0.1);padding:2px 7px;border-radius:5px">${a.action}</span>
            <p style="margin:5px 0 0;font-size:12px;color:#8888a0;line-height:1.5">${a.result_summary.slice(0, 150)}</p>
          </div>
        </div>`).join('')}
    </div>` : ''

  const html = wrap(`
    <div style="margin-bottom:24px">
      <span style="font-size:40px">${employee.emoji}</span>
    </div>
    ${h1(`${employee.name} finished a run`)}
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#555566;text-transform:uppercase;letter-spacing:0.06em">${employee.role}</p>
    <div style="background:#071e2e;border:1px solid #0c3a52;border-radius:10px;padding:18px;margin:20px 0">
      <p style="margin:0;font-size:15px;color:#f0f0f4;line-height:1.65">${run.summary}</p>
    </div>
    ${kpiHtml}
    ${actionsHtml}
    ${infoBox([
      ['Credits used', run.creditsUsed.toString()],
      ['Duration', `${(run.durationMs / 1000).toFixed(1)}s`],
      ['Actions', run.actionsTaken.length.toString()],
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View full run log →', `${APP_URL}/ai-employees/${run.runId}`)}
    </div>
  `, run.summary)

  return resend.emails.send({
    from: FROM_NOTIF,
    to,
    subject: `${employee.emoji} ${employee.name} completed a run`,
    html,
  })
}

// ── 21. AI Employee run failed ────────────────────────────────────────────────
export async function sendAIEmployeeFailedEmail(
  to: string,
  employee: { name: string; emoji: string; role: string },
  error: string
) {
  const html = wrap(`
    <div style="margin-bottom:24px">
      <span style="font-size:40px">${employee.emoji}</span>
    </div>
    ${h1(`${employee.name} hit an error`)}
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#555566;text-transform:uppercase;letter-spacing:0.06em">${employee.role}</p>
    <div style="background:#1a1a1e;border:1px solid #f0525233;border-radius:10px;padding:18px;margin:20px 0">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#f05252;text-transform:uppercase;letter-spacing:0.06em">Error</p>
      <p style="margin:0;font-size:13px;color:#8888a0;font-family:monospace;word-break:break-all">${error.slice(0, 400)}</p>
    </div>
    ${p('No credits were charged. You can trigger a manual run from the AI Employees dashboard.')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Go to AI Employees →', `${APP_URL}/ai-employees`)}
    </div>
  `, `${employee.name} encountered an error`)

  return resend.emails.send({
    from: FROM_NOTIF,
    to,
    subject: `${employee.emoji} ${employee.name} failed — action needed`,
    html,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Lead-nurture sequence (free → paid conversion). Modeled on a cold-outbound
// cadence, not a single upgrade blast: each touch carries a different angle
// (activation, social proof, feature discovery, monetization, win-back,
// breakup) so a lead who ignores touch 1 doesn't get the same pitch again at
// touch 4. Cron wiring lives in /api/cron/email-drip.
// ═══════════════════════════════════════════════════════════════════════════

// ── 22. Quick-start nudge — touch 1, ~18–36h after signup, zero projects ────
// Faster and lighter than the existing "still waiting" nudge (day 2–14),
// which is now touch 2 for anyone who ignores this one.
export async function sendQuickStartNudgeEmail(to: string, name: string, unsubUrl: string) {
  const html = wrap(`
    ${h1("You're one sentence away 👀")}
    ${p(`Hey ${name} — you signed up but haven't built anything yet. That's the only thing standing between you and a working app: one sentence, plain English, about 60 seconds.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">“A waitlist page for my product launch”</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">“An expense tracker split by category”</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#8888a0">“A booking page for my studio”</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Try it now →', `${APP_URL}/dashboard`)}
    </div>
    ${p('No pressure — your 50 free credits aren\'t going anywhere. Just didn\'t want you to forget.')}
  `, "Your first app takes about 60 seconds", unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: 'Quick one — your first app takes about 60 seconds', html })
}

// ── 23. Post-first-build nurture — fires the day after the aha-moment email ─
export async function sendNextStepNurtureEmail(to: string, name: string, projectName: string, projectId: string) {
  const html = wrap(`
    ${h1('3 things worth doing next')}
    ${p(`${name}, ${projectName} works — nice. Most people stop right there. Here's how to actually get value out of it:`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:10px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Publish it</strong> — free, one click, get a real URL you can share</td></tr>
      <tr><td style="padding:10px 0;font-size:15px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Connect Supabase</strong> — swap mock data for a real database so it actually persists</td></tr>
      <tr><td style="padding:10px 0;font-size:15px;color:#8888a0">→ &nbsp;<strong style="color:#f0f0f4">Try the mobile version</strong> — same prompt, same project, a phone-native build</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Open your project →', `${APP_URL}/project/${projectId}`)}
    </div>
    ${p("Reply if you're not sure which one to start with — we'll point you in the right direction.")}
  `, `What to do next with ${projectName}`)
  return resend.emails.send({ from: FROM, to, subject: `Now that ${projectName} is built...`, html })
}

// ── 24. Social proof — day 3–4, no strong engagement signal yet ─────────────
export async function sendSocialProofEmail(to: string, name: string) {
  const html = wrap(`
    ${h1("You're in good company")}
    ${p(`${name}, here's a slice of what got built on WyberAi this week:`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;A CRM for a landscaping business — leads, quotes, and follow-ups in one place</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;A mobile habit tracker with streaks and charts, published to the Play Store</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0">→ &nbsp;An internal inventory tool that replaced a spreadsheet three people were fighting over</td></tr>
    </table>
    ${p('None of these people were developers. Same 50 free credits you have right now.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('Browse the gallery →', `${APP_URL}/gallery`)}
    </div>
  `, 'What builders shipped this week')
  return resend.emails.send({ from: FROM, to, subject: 'What builders shipped this week', html })
}

// ── 25. Feature spotlight — rotates across a small set, day 5–7 ─────────────
const FEATURE_SPOTLIGHTS = {
  mobile: {
    subject: 'Same prompt, an actual mobile app',
    heading: 'You can build mobile apps too 📱',
    body: 'The exact same prompt that builds a web app also builds a React Native app — preview it live on your phone via QR code, no Xcode or Android Studio required.',
    cta: 'Try a mobile build →',
    url: `${APP_URL}/dashboard`,
  },
  domain: {
    subject: 'Put your own domain on it',
    heading: 'Your app, your domain',
    body: "Publishing gives you a free wyberai.app link — but you can point your own custom domain at any published project in Settings, no extra hosting to manage.",
    cta: 'Connect a domain →',
    url: `${APP_URL}/dashboard`,
  },
  connectors: {
    subject: "You haven't connected anything yet",
    heading: '25 integrations, one click each',
    body: 'Supabase for a real database, Stripe for payments, OpenAI for AI features, GitHub to push your code — connect once in a project and the AI writes against real APIs, not mock data.',
    cta: 'See connectors →',
    url: `${APP_URL}/dashboard`,
  },
  templates: {
    subject: "Don't start from a blank page",
    heading: 'Skip the blank page',
    body: "Templates give you a fully-built starting point — a CRM, a booking app, a habit tracker — that you customize instead of describing from scratch. Faster to your first real result.",
    cta: 'Browse templates →',
    url: `${APP_URL}/templates`,
  },
} as const
export type FeatureSpotlightKey = keyof typeof FEATURE_SPOTLIGHTS
export async function sendFeatureSpotlightEmail(to: string, key: FeatureSpotlightKey) {
  const f = FEATURE_SPOTLIGHTS[key]
  const html = wrap(`
    ${h1(f.heading)}
    ${p(f.body)}
    <div style="text-align:center;margin:28px 0">
      ${btn(f.cta, f.url)}
    </div>
  `, f.subject)
  return resend.emails.send({ from: FROM, to, subject: f.subject, html })
}

// ── 26. Referral nudge — proactive invite ask, day 5-ish with real usage ────
export async function sendReferralNudgeEmail(to: string, name: string, referralCode: string) {
  const html = wrap(`
    ${h1('Give 50, get 50')}
    ${p(`${name}, if anyone you know has been talking about wanting an app built — this is the easy version. Share your link, they start with 50 free credits, you get 50 the moment they sign up.`)}
    <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:16px 20px;margin:0 0 24px;text-align:center">
      <span style="font-size:14px;color:#8888a0">Your code</span><br/>
      <span style="font-size:20px;font-weight:700;color:#0EA5E9;letter-spacing:0.05em">${referralCode}</span>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Get your invite link →', `${APP_URL}/settings?tab=referrals`)}
    </div>
    ${p('No cap on how many times this can pay out.')}
  `, 'Invite a friend, you both get 50 credits')
  return resend.emails.send({ from: FROM, to, subject: 'Give 50, get 50 — invite a friend to WyberAi', html })
}

// ── 27. Early credit warning — softer signal before the ≤20 credit-low email ─
export async function sendEarlyCreditWarningEmail(to: string, remaining: number) {
  const html = wrap(`
    ${h1('Halfway there ⚡')}
    ${p(`Just a heads up — you're down to <strong style="color:#f0f0f4">${remaining} credits</strong>. No action needed yet, but if you're mid-project it's worth knowing before you hit zero mid-build.`)}
    ${p(`Top-up credits never expire, so buying ahead costs you nothing extra — <a href="${APP_URL}/pricing" style="color:#0EA5E9">see plans and top-ups</a> whenever you're ready.`)}
  `, `${remaining} credits remaining`)
  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Halfway there — ${remaining} credits remaining`, html })
}

// ── 28. Paywall / feature-block hit — blocked from a specific model tier ────
export async function sendPaywallHitEmail(to: string, tier: string, currency: Currency = 'USD') {
  const prices = currency === 'INR' ? PLAN_VALUE_INR : PLAN_VALUE
  const html = wrap(`
    ${h1(`That one needs a higher plan`)}
    ${p(`You just tried to use the <strong style="color:#f0f0f4">${tier}</strong> model tier — it's reserved for paid plans. On the free plan you get full access to standard generation; ${tier} adds sharper output for the stuff that needs to look flawless (hero images, complex logic, production-grade code).`)}
    <div style="text-align:center;margin:28px 0">
      ${btn('See what unlocks it →', `${APP_URL}/pricing`, '#f0a429')}
    </div>
    ${p(`Builder plan starts at ${formatPrice(prices.builder_monthly, currency)}/mo and includes every model tier.`)}
  `, `${tier} needs a higher plan`)
  return resend.emails.send({ from: FROM_NOTIF, to, subject: `That model needs a higher plan`, html })
}

// ── 29. Checkout abandoned — started checkout, never completed payment ─────
export async function sendCheckoutAbandonedEmail(to: string, planLabel: string, currency: Currency = 'USD') {
  const prices = currency === 'INR' ? PLAN_VALUE_INR : PLAN_VALUE
  const html = wrap(`
    ${h1('Still thinking it over?')}
    ${p(`You started checking out for <strong style="color:#f0f0f4">${planLabel}</strong> but didn't finish — no charge went through, nothing to worry about there.`)}
    ${p("If something didn't add up or the page glitched, just reply — we'll sort it out directly.")}
    <div style="text-align:center;margin:28px 0">
      ${btn('Finish checkout →', `${APP_URL}/pricing`)}
    </div>
    ${p(`Every plan includes every feature — web, mobile, deploy, connectors — starting at ${formatPrice(prices.starter_monthly, currency)}/mo.`)}
  `, `Finish setting up ${planLabel}`)
  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Still thinking it over?`, html })
}

// ── 30. Win-back — 14–30 days inactive, unused free credits ────────────────
export async function sendWinBackEmail(to: string, name: string, remaining: number, unsubUrl: string) {
  const html = wrap(`
    ${memeImg('still-waiting')}
    ${h1('Still there? 👋')}
    ${p(`It's been a couple weeks, ${name}. Your account — and <strong style="color:#f0f0f4">${remaining} unused credits</strong> — are exactly where you left them.`)}
    ${p("Whatever pulled you away, no judgment. If you want back in, it's a one-click return, not a fresh start.")}
    <div style="text-align:center;margin:28px 0">
      ${btn('Pick up where you left off →', `${APP_URL}/dashboard`)}
    </div>
  `, "Still there? Your credits are waiting", unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: 'Still there? 👋', html })
}

// ── 32. Unused credits — 3+ days old, 0 builds, credits ≥ 45 ───────────────
// Targets the "stuck at 55" cohort: signed up, never built, credits sitting idle.
// Aggressive annual CTA — they haven't experienced the product yet so the ask
// is activation first, but annual pricing is the clear path forward shown.
export async function sendUnusedCreditsEmail(to: string, name: string, credits: number, unsubUrl: string, currency: Currency = 'USD') {
  const annualFrom = currency === 'INR' ? '₹399/mo' : '$23/mo'
  const annualDesc = currency === 'INR'
    ? '50–150 credits/mo — 2 months free'
    : '150 credits/mo — 2 months free'
  const html = wrap(`
    ${h1('You have credits just sitting there.')}
    ${p(`${name} — you have <strong style="color:#f0f0f4">${credits} free credits</strong> in your account and haven't used a single one. That's a full working app you haven't built yet.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Pick any idea</strong> — landing page, dashboard, booking tool, anything</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0;border-bottom:1px solid #2e2e38">→ &nbsp;<strong style="color:#f0f0f4">Type one sentence</strong> — no code, no setup, no account to create</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#8888a0">→ &nbsp;<strong style="color:#f0f0f4">See it live in ~60 seconds</strong> — real URL, shareable immediately</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      ${btn('Use your free credits now →', `${APP_URL}/dashboard`)}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#1a1a26;border-radius:10px">
      <tr><td style="padding:16px 20px">
        <div style="font-size:11px;font-weight:700;color:#f97316;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Annual Plan</div>
        <div style="font-size:18px;font-weight:800;color:#f0f0f4;margin-bottom:4px">${annualDesc}</div>
        <div style="font-size:13px;color:#8888a0">From ${annualFrom}. Unlimited projects. Cancel any time.</div>
        <div style="margin-top:12px"><a href="${APP_URL}/pricing" style="font-size:12px;font-weight:700;color:#0ea5e9;text-decoration:none">See annual plans →</a></div>
      </td></tr>
    </table>
    ${p("Once you've built your first thing, you'll wonder what took you so long.")}
  `, `You have ${credits} credits doing nothing`, unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: `${name}, your ${credits} free credits are doing nothing`, html })
}

// ── 31. Breakup email — 45–60 days silent, last touch, no meme on purpose ──
export async function sendBreakupEmail(to: string, name: string, unsubUrl: string) {
  const html = wrap(`
    ${h1('Should we close your file?')}
    ${p(`${name}, this is the last email we'll send unless you tell us otherwise. It's been a while, and we'd rather ask than keep nudging into silence.`)}
    ${p("If you're done, no hard feelings — click unsubscribe below and you won't hear from us again. If there's actually still something you want to build, everything is exactly where you left it.")}
    <div style="text-align:center;margin:28px 0">
      ${btn('Still interested →', `${APP_URL}/dashboard`, '#3d3d4a')}
    </div>
  `, "Should we close your file?", unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: 'Should we close your file?', html })
}

// ── 32. Milestone celebration — 1000 creators ──
export async function sendMilestoneEmail(to: string, name?: string, unsubUrl?: string) {
  const greeting = name ? `${name}, we hit 1,000 creators 🎉` : 'We hit 1,000 creators 🎉'
  const html = wrap(`
    ${h1(greeting)}
    ${p('A thousand people building with WyberAi. That\'s not luck — that\'s you and everyone before you proving that AI-native app building works.')}
    ${infoBox([
      ['Your reward', '50% off any plan'],
      ['Use code', '<strong style="color:#f0f0f4">WYBER50</strong> at checkout'],
      ['Valid until', 'August 15, 2026']
    ], '#0EA5E955')}
    ${p('This 50% discount applies to any plan upgrade or credit top-up. Whether you\'re building your first app or scaling your tenth, this is our thank you for being part of the community.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('Upgrade now →', `${APP_URL}/pricing`)}
    </div>
    ${p('See you on the other side of WYBER50.')}
  `, 'We hit 1,000 creators', unsubUrl)
  return resend.emails.send({ from: FROM, to, subject: '🎉 We hit 1,000 creators — 50% off for you', html })
}

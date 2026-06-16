import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM       = 'WyberAi <hello@wyberai.com>'
const FROM_NOTIF = 'WyberAi <hello@wyberai.com>'
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

// ── Design primitives ─────────────────────────────────────────────────────────

function wrap(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>WyberAi</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'DM Sans',system-ui,sans-serif;color:#f0f0f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 20px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="padding-bottom:32px;text-align:center">
        <a href="${APP_URL}" style="text-decoration:none">
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
          <a href="${APP_URL}/unsubscribe" style="color:#555566;text-decoration:none">Unsubscribe</a>
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
export async function sendWelcomeEmail(to: string, name?: string) {
  const displayName = name ?? to.split('@')[0]
  const html = wrap(`
    ${h1('Welcome to WyberAi ⚡')}
    ${p(`Hey ${displayName}, you're in.`)}
    ${p('You have <strong style="color:#f0f0f4">15 free credits</strong> to start building — plus 3 more every day. Describe any app and watch it generate in real time.')}
    ${p('A few things to try first:')}
    <ul style="margin:0 0 24px;padding-left:20px;color:#8888a0;font-size:15px;line-height:1.9">
      <li>Pick a template from the <strong style="color:#f0f0f4">Gallery</strong></li>
      <li>Paste a screenshot to clone any UI</li>
      <li>Try an <strong style="color:#f0f0f4">AI Agent</strong> for multi-step automation</li>
      <li>Connect your own Supabase to add a real database</li>
    </ul>
    <div style="text-align:center;margin:28px 0">
      ${btn('Start building →', `${APP_URL}/dashboard`)}
    </div>
    ${p('Questions? Reply here — hello@wyberai.com goes straight to the team.')}
  `, 'Your 15 free credits are ready')

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

// ── 3. Plan upgrade confirmed ─────────────────────────────────────────────────
export async function sendUpgradeConfirmEmail(to: string, plan: string, credits: number) {
  const html = wrap(`
    ${h1(`You're on ${plan} ⚡`)}
    ${p(`Your upgrade to <strong style="color:#f0f0f4">WyberAi ${plan}</strong> is confirmed and active now.`)}
    ${infoBox([
      ['Monthly credits', credits.toLocaleString()],
      ['Daily top-up', plan === 'Team' ? '+20 every day' : '+10 every day'],
      ['Credit rollover', '✓ Unused credits carry forward'],
      ['Models unlocked', plan === 'Team' ? 'Standard + Premium + Fable' : 'Standard + Premium'],
    ], '#0EA5E944')}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Open dashboard →', `${APP_URL}/dashboard`)}
    </div>
    ${p('To manage billing or cancel anytime, go to Settings → Billing.')}
  `, `Your ${plan} plan is active`)

  return resend.emails.send({ from: FROM, to, subject: `WyberAi ${plan} confirmed ✓`, html })
}

// ── 4. Subscription renewed ───────────────────────────────────────────────────
export async function sendRenewalEmail(to: string, plan: string, creditsAdded: number, rollover: number) {
  const html = wrap(`
    ${h1('Credits refreshed ✓')}
    ${p(`Your <strong style="color:#f0f0f4">WyberAi ${plan}</strong> subscription has renewed.`)}
    ${infoBox([
      ['New monthly credits', creditsAdded.toLocaleString()],
      ['Rolled over from last month', rollover > 0 ? `+${rollover}` : '0'],
      ['Total balance', (creditsAdded + rollover).toLocaleString()],
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Keep building →', `${APP_URL}/dashboard`)}
    </div>
  `, `${creditsAdded} credits added to your account`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `WyberAi ${plan} renewed — ${creditsAdded} credits added`, html })
}

// ── 5. Subscription cancelled ─────────────────────────────────────────────────
export async function sendCancellationEmail(to: string, plan: string) {
  const html = wrap(`
    ${h1('Subscription cancelled')}
    ${p(`Your <strong style="color:#f0f0f4">WyberAi ${plan}</strong> subscription has been cancelled.`)}
    ${p('Your account moves to the Free plan. Any unused credits from your plan are removed, but any one-time top-up credits you purchased are kept.')}
    ${p("We'd love to know what made you cancel — hit reply and tell us. It takes 30 seconds and helps us a lot.")}
    ${divider()}
    ${p('Changed your mind? You can resubscribe anytime — your projects and history are still there.')}
    <div style="text-align:center;margin:24px 0">
      ${btn('Resubscribe', `${APP_URL}/pricing`, '#3d3d4a')}
    </div>
  `, 'Your subscription has ended')

  return resend.emails.send({ from: FROM, to, subject: `WyberAi ${plan} cancelled`, html })
}

// ── 6. Credit top-up confirmed ────────────────────────────────────────────────
export async function sendTopupEmail(to: string, credits: number, newBalance: number) {
  const html = wrap(`
    ${h1(`${credits} credits added ✓`)}
    ${p('Your one-time credit purchase is confirmed.')}
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

// ── 7. Running low on credits ─────────────────────────────────────────────────
export async function sendCreditLowEmail(to: string, remaining: number) {
  const html = wrap(`
    ${h1('Running low on credits')}
    ${p(`You have <strong style="color:#f0a429">${remaining} credits</strong> remaining.`)}
    ${p('Top up instantly — credits never expire and are yours forever.')}
    <div style="display:grid;gap:10px;margin:0 0 28px">
      ${([
        ['50 credits', '$9.99', `${APP_URL}/pricing#topup`],
        ['150 credits', '$24.99', `${APP_URL}/pricing#topup`],
        ['500 credits', '$69.99', `${APP_URL}/pricing#topup`],
      ] as [string, string, string][]).map(([c, price, url]) => `
        <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;color:#f0f0f4;font-weight:500">${c}</span>
          <a href="${url}" style="font-size:14px;font-weight:600;color:#0EA5E9;text-decoration:none">${price} →</a>
        </div>
      `).join('')}
    </div>
    ${p('Or upgrade to the <a href="' + APP_URL + '/pricing" style="color:#0EA5E9">Builder plan</a> for ~400 credits/month at $18.99.')}
  `, `${remaining} credits remaining`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `Low credits: ${remaining} remaining on WyberAi`, html })
}

// ── 8. App deployed successfully ──────────────────────────────────────────────
export async function sendDeploySuccessEmail(to: string, projectName: string, url: string) {
  const html = wrap(`
    ${h1('Your app is live ⚡')}
    ${p(`<strong style="color:#f0f0f4">${projectName}</strong> deployed successfully.`)}
    <div style="background:#1a1a1e;border:1px solid #3dd68c33;border-radius:10px;padding:18px 20px;margin:0 0 24px">
      <span style="color:#3dd68c;font-size:14px">● Live &nbsp;</span>
      <a href="${url}" style="color:#3dd68c;font-size:14px;text-decoration:none;word-break:break-all;font-weight:500">${url}</a>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View live app ↗', url, '#3dd68c')}
    </div>
    ${p("Keep iterating — every generation auto-saves. Connect GitHub to commit changes automatically.")}
  `, `${projectName} is live`)

  return resend.emails.send({ from: FROM_NOTIF, to, subject: `${projectName} is live ✓`, html })
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
    ${h1('You built your first app 🎉')}
    ${p(`${name}, <strong style="color:#f0f0f4">${projectName}</strong> is ready. That's huge.`)}
    ${p("Here's what you can do next:")}
    <ul style="margin:0 0 24px;padding-left:20px;color:#8888a0;font-size:15px;line-height:1.9">
      <li><strong style="color:#f0f0f4">Deploy it</strong> — go live in one click</li>
      <li><strong style="color:#f0f0f4">Connect Supabase</strong> — add a real database so data persists</li>
      <li><strong style="color:#f0f0f4">Share it</strong> — export as a ZIP or push to GitHub</li>
      <li><strong style="color:#f0f0f4">Keep building</strong> — chat with the AI to add features</li>
    </ul>
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
  const html = wrap(`
    ${h1('Your week on WyberAi')}
    ${p(`Here's what you built this week, ${name}.`)}
    ${infoBox([
      ['Apps & edits', stats.appsBuilt.toString()],
      ['Credits used', stats.creditsUsed.toString()],
      ['Credits remaining', stats.creditsRemaining.toString()],
      ...(stats.topProject ? [['Most active project', stats.topProject] as [string, string]] : []),
    ])}
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Keep building →', `${APP_URL}/dashboard`)}
    </div>
    ${p('Running low? <a href="' + APP_URL + '/pricing" style="color:#0EA5E9">Top up or upgrade</a> — credits never expire.')}
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

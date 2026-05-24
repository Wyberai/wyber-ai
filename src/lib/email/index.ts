import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = 'Wyber AI <hello@wyberai.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com';

// ── Base HTML wrapper ──────────────────────────────────────────────────────────
function wrap(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Wyber AI</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'DM Sans',system-ui,sans-serif;color:#f0f0f4">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 20px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

      <!-- Logo -->
      <tr><td style="padding-bottom:32px;text-align:center">
        <a href="${APP_URL}" style="text-decoration:none">
          <span style="font-size:22px;font-weight:700;color:#f0f0f4;letter-spacing:-0.03em">
            Wyber <span style="color:#7c3aed">AI</span>
          </span>
        </a>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#141416;border:1px solid #2e2e38;border-radius:14px;padding:40px">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:28px;text-align:center">
        <p style="font-size:12px;color:#555566;margin:0">
          © 2025 Wyber AI · <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none">wyberai.com</a>
          · <a href="${APP_URL}/unsubscribe" style="color:#555566;text-decoration:none">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:9px;letter-spacing:-0.01em">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#f0f0f4;letter-spacing:-0.04em;line-height:1.15">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#8888a0;line-height:1.65">${text}</p>`;
}

// ── Email senders ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string) {
  const displayName = name ?? to.split('@')[0];
  const html = wrap(`
    ${h1('Welcome to Wyber AI ⚡')}
    ${p(`Hey ${displayName}, you're in.`)}
    ${p('You have <strong style="color:#f0f0f4">50 free credits</strong> to start building. Describe any app — a dashboard, a landing page, a game — and watch it generate in real time.')}
    ${p('A few things to try first:')}
    <ul style="margin:0 0 24px;padding-left:20px;color:#8888a0;font-size:15px;line-height:1.8">
      <li>Pick a template from the <strong style="color:#f0f0f4">Templates</strong> tab</li>
      <li>Paste a screenshot to generate matching UI</li>
      <li>Try Agent Mode for multi-step autonomous builds</li>
      <li>Connect GitHub to auto-commit every generation</li>
    </ul>
    <div style="text-align:center;margin:28px 0">
      ${btn('Start building →', `${APP_URL}/dashboard`)}
    </div>
    ${p('Questions? Reply to this email — hello@wyberai.com goes straight to us.')}
  `, `Welcome to Wyber AI — 50 free credits inside`);

  return resend.emails.send({ from: FROM, to, subject: 'Welcome to Wyber AI ⚡', html });
}

export async function sendMagicLinkEmail(to: string, link: string) {
  const html = wrap(`
    ${h1('Your login link')}
    ${p('Click below to sign in to Wyber AI. This link expires in 1 hour and can only be used once.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('Sign in to Wyber AI', link)}
    </div>
    ${p('If you didn\'t request this, you can safely ignore this email.')}
    <p style="margin:16px 0 0;font-size:13px;color:#555566">Or copy this link: <a href="${link}" style="color:#7c3aed;word-break:break-all">${link}</a></p>
  `, `Sign in to Wyber AI`);

  return resend.emails.send({ from: FROM, to, subject: 'Your Wyber AI login link', html });
}

export async function sendUpgradeConfirmEmail(to: string, plan: string, credits: number) {
  const html = wrap(`
    ${h1(`You're on ${plan} ⚡`)}
    ${p(`Your upgrade to <strong style="color:#f0f0f4">Wyber AI ${plan}</strong> is confirmed.`)}
    <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:10px;padding:20px;margin:0 0 24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:13px;color:#8888a0">Monthly credits</span>
        <span style="font-size:18px;font-weight:700;color:#3dd68c">${credits.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:13px;color:#8888a0">Credit rollover</span>
        <span style="font-size:13px;color:#f0f0f4">✓ Unused credits carry forward</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:#8888a0">AI error policy</span>
        <span style="font-size:13px;color:#f0f0f4">✓ No charge for error fixes</span>
      </div>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      ${btn('Open dashboard →', `${APP_URL}/dashboard`)}
    </div>
    ${p('To manage billing or cancel, visit your dashboard settings. Questions? hello@wyberai.com')}
  `, `Your ${plan} plan is active`);

  return resend.emails.send({ from: FROM, to, subject: `Wyber AI ${plan} confirmed ✓`, html });
}

export async function sendCreditLowEmail(to: string, remaining: number) {
  const html = wrap(`
    ${h1('Running low on credits')}
    ${p(`You have <strong style="color:#f0a429">${remaining} credits</strong> remaining this month.`)}
    ${p('Top up instantly — credits never expire and there\'s no subscription required.')}
    <div style="display:grid;gap:10px;margin:0 0 28px">
      ${[
        ['100 credits', '$4', `${APP_URL}/pricing`],
        ['300 credits', '$9', `${APP_URL}/pricing`],
        ['1000 credits', '$24', `${APP_URL}/pricing`],
      ].map(([c, p, url]) => `
        <div style="background:#1a1a1e;border:1px solid #2e2e38;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;color:#f0f0f4;font-weight:500">${c}</span>
          <a href="${url}" style="font-size:14px;font-weight:600;color:#7c3aed;text-decoration:none">${p} →</a>
        </div>
      `).join('')}
    </div>
    ${p('Or upgrade to Pro for 400 credits/month at $15.')}
  `, `${remaining} credits remaining`);

  return resend.emails.send({ from: FROM, to, subject: `Low credits: ${remaining} remaining on Wyber AI`, html });
}

export async function sendDeploySuccessEmail(to: string, projectName: string, url: string) {
  const html = wrap(`
    ${h1('Your app is live ⚡')}
    ${p(`<strong style="color:#f0f0f4">${projectName}</strong> was deployed successfully.`)}
    <div style="background:#1a1a1e;border:1px solid #3dd68c33;border-radius:10px;padding:18px 20px;margin:0 0 24px;display:flex;align-items:center;gap:12px">
      <span style="color:#3dd68c;font-size:16px">●</span>
      <a href="${url}" style="color:#3dd68c;font-size:14px;text-decoration:none;word-break:break-all;font-weight:500">${url}</a>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      ${btn('View live app ↗', url)}
    </div>
    ${p('Keep iterating — every new generation auto-commits to GitHub if you\'ve connected it.')}
  `, `${projectName} is live`);

  return resend.emails.send({ from: FROM, to, subject: `${projectName} is live on Wyber AI ✓`, html });
}

export async function sendSecurityAlertEmail(to: string, projectName: string, flags: string[]) {
  const html = wrap(`
    ${h1('Deploy blocked: security review')}
    ${p(`We blocked a deployment of <strong style="color:#f0f0f4">${projectName}</strong> because our security scanner detected potential issues.`)}
    <div style="background:#1a1a1e;border:1px solid #f0525233;border-radius:10px;padding:18px 20px;margin:0 0 24px">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#f05252;text-transform:uppercase;letter-spacing:0.06em">Flags</p>
      <ul style="margin:0;padding-left:16px;color:#8888a0;font-size:14px;line-height:1.8">
        ${flags.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    ${p('If this is a false positive, reply to this email with your project name and we\'ll review it within 24 hours.')}
    ${p('Wyber AI does not permit phishing, credential harvesting, or malware distribution.')}
  `, `Deploy blocked on ${projectName}`);

  return resend.emails.send({ from: FROM, to, subject: `Deployment blocked: ${projectName}`, html });
}

export async function sendTeamInviteEmail(to: string, inviterName: string, projectName: string, inviteUrl: string) {
  const html = wrap(`
    ${h1(`${inviterName} invited you`)}
    ${p(`You've been invited to collaborate on <strong style="color:#f0f0f4">${projectName}</strong> on Wyber AI.`)}
    ${p('Click below to accept the invitation and start building together.')}
    <div style="text-align:center;margin:28px 0">
      ${btn('Accept invitation →', inviteUrl)}
    </div>
    ${p('This invitation expires in 7 days. If you weren\'t expecting this, you can ignore it.')}
  `, `You're invited to ${projectName}`);

  return resend.emails.send({ from: FROM, to, subject: `${inviterName} invited you to ${projectName} on Wyber AI`, html });
}

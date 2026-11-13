import { PLAN_FACTS, TOPUP_PACKS } from '@/lib/plans'
import { readableOn } from '@/lib/color-contrast'
import { unsubscribeUrl } from './unsubscribe'
import { sendEmail } from './transport'

// Time-based lifecycle sequence: one short, specific "did you know" email per
// step, sent by signup age whether or not the person has built anything. Modelled
// on the Continuum schedule (day 1/3/7/14... plus a feature spotlight every five
// days). Every claim below is one the product backs; the tests tie the numbers to
// plans.ts and fail if a banned claim comes back.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
const FROM = 'WyberAi <hello@wyberai.com>'
const ACCENT = '#0EA5E9'

export type LifecycleNeeds = 'built' | 'notBuilt'

export interface LifecycleStep {
  /** Days after signup when this email becomes due. */
  day: number
  /** Stable id: stored in email_events as `seq-<id>` so each person gets it once. */
  id: string
  /** Only send to people who have (built) / have not (notBuilt) made a project. Omit for everyone. */
  needs?: LifecycleNeeds
  /** Small label above the headline. */
  tag: string
  subject: string
  headline: string
  /** Paragraphs of plain HTML-safe text (no user data). */
  body: string[]
  cta: { label: string; path: string }
}

/** How long after `day` a step stays eligible, so a missed cron run does not lose the email. */
export const LIFECYCLE_WINDOW_DAYS = 4
/** Nobody is emailed by the sequence again within this many days of any other email. */
export const LIFECYCLE_MIN_GAP_DAYS = 2

const credits = (id: 'starter' | 'builder' | 'pro') => PLAN_FACTS[id].credits.toLocaleString('en-US')
const topups = TOPUP_PACKS.map(t => t.credits).join(' / ')

export const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    day: 8, id: 'cost-first', tag: 'How credits work',
    subject: 'You see the cost before every build',
    headline: 'No surprise charges.',
    body: [
      'Before a build starts, the builder shows how many credits it will use. A small build is about 30 credits.',
      'Fixing a broken build is free, and so is publishing. You only spend credits on new work you chose to start.',
    ],
    cta: { label: 'Open the builder', path: '/dashboard' },
  },
  {
    day: 13, id: 'your-code', tag: 'Ownership',
    subject: 'The code is yours. Take it any time.',
    headline: 'Nothing is locked in.',
    body: [
      'Every project is real code. Push it to your own GitHub from the project, and carry on anywhere you like.',
      'That is why people use WyberAi to get the first version out fast and still hand it to a developer later.',
    ],
    cta: { label: 'Open your dashboard', path: '/dashboard' },
  },
  {
    day: 18, id: 'plan-first', tag: 'Bigger ideas',
    subject: 'For a big idea, ask for the plan first',
    headline: 'See the plan before anything is built.',
    body: [
      'Plan Mode shows a step-by-step build plan before it generates anything, and you approve it first. It is an offer on your first build, never a requirement.',
      'Use it when the idea has more than one screen: a booking app, a marketplace, a dashboard with logins.',
    ],
    cta: { label: 'Describe a bigger idea', path: '/dashboard' },
  },
  {
    day: 23, id: 'mobile', tag: 'Mobile',
    subject: 'Same prompt, an actual mobile app',
    headline: 'Your idea can be a phone app too.',
    body: [
      'The prompt that builds a web app can also build a React Native app. Preview it on your phone with a QR code. No Xcode or Android Studio needed.',
    ],
    cta: { label: 'Try a mobile build', path: '/dashboard' },
  },
  {
    day: 28, id: 'connectors', tag: 'Real data',
    subject: 'Swap mock data for the real thing',
    headline: 'Connect once, and the app uses real services.',
    body: [
      'Supabase gives the app a real database. Stripe takes payments. GitHub holds your code. Connect a service in a project and the AI writes against its real API, not placeholder data.',
    ],
    cta: { label: 'See connectors', path: '/connectors' },
  },
  {
    day: 33, id: 'themes', needs: 'built', tag: 'Look and feel',
    subject: 'Change how your app looks without spending credits',
    headline: 'Re-theme in seconds, free.',
    body: [
      'The Themes tab changes your colours, fonts and corner radius instantly, and it costs 0 credits. Try three looks before you decide.',
    ],
    cta: { label: 'Open your project', path: '/dashboard' },
  },
  {
    day: 38, id: 'security-scan', needs: 'built', tag: 'Trust',
    subject: 'A database check runs the moment you publish',
    headline: 'Publishing includes a safety check.',
    body: [
      'Right after you publish, WyberAi scans your database for the common leaks that exposed data in other AI-built apps, and warns you at once. An exposed secret key stops the publish.',
      'The scan is part of publishing, so it costs nothing extra.',
    ],
    cta: { label: 'Open your project', path: '/dashboard' },
  },
  {
    day: 38, id: 'gallery', needs: 'notBuilt', tag: 'Ideas',
    subject: 'Not sure what to build? Start from one that exists.',
    headline: 'Browse finished apps, then make one yours.',
    body: [
      'The gallery has finished apps across booking, marketplaces, dashboards and websites. Open one and change it to fit your business instead of describing everything from scratch.',
    ],
    cta: { label: 'Browse the gallery', path: '/gallery' },
  },
  {
    day: 45, id: 'domain', needs: 'built', tag: 'Your brand',
    subject: 'Put your own domain on it',
    headline: 'Your app, your address.',
    body: [
      'Publishing gives you a free wyberai.com link. You can also point your own domain at any published project from Settings, with no extra hosting to manage.',
    ],
    cta: { label: 'Open your dashboard', path: '/dashboard' },
  },
  {
    day: 52, id: 'claude-mcp', tag: 'Inside Claude',
    subject: 'Build WyberAi apps from inside Claude',
    headline: 'Use WyberAi as a Claude connector.',
    body: [
      'Add WyberAi as a custom connector in Claude and you can work with your WyberAi projects from a Claude conversation. The setup takes a few minutes and the steps are in the docs.',
    ],
    cta: { label: 'Read the setup steps', path: '/docs/integrations/claude-mcp' },
  },
  {
    day: 60, id: 'plans', tag: 'Plans, plainly',
    subject: 'What the paid plans actually give you',
    headline: 'No countdown timer. Here is the honest version.',
    body: [
      `Free is 30 credits to try WyberAi, with no card on file. Paid plans add credits every month: Starter ${credits('starter')}, Builder ${credits('builder')}, Pro ${credits('pro')}.`,
      `Top-up packs of ${topups} credits never expire, so you can buy only when you need to.`,
      'If you are not hitting the free limit, you do not need to pay for anything.',
    ],
    cta: { label: 'See plans and prices', path: '/pricing' },
  },
  {
    day: 68, id: 'clients', tag: 'Freelancers and agencies',
    subject: 'Building for clients? Share a private link.',
    headline: 'Clients approve in a link, not in a chat thread.',
    body: [
      'Send a client a private link to each deliverable. They approve it, ask for changes or comment, and you are emailed. You can also send quotes the client accepts by typing their name. We never take the payment.',
    ],
    cta: { label: 'See how it works', path: '/clients' },
  },
  {
    day: 76, id: 'what-stopped-you', tag: 'A question',
    subject: 'What is still annoying or confusing?',
    headline: 'One honest question.',
    body: [
      'No feature pitch this time. What is the thing about WyberAi that is still missing, confusing or not worth the trouble? Reply and tell me. A person reads every reply, and we change the product because of them.',
    ],
    cta: { label: 'Open WyberAi', path: '/dashboard' },
  },
]

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * The next sequence email due for someone, or null. Pure: pass the signup time, "now",
 * the ids already sent and whether they have built anything. At most one step is returned,
 * the earliest unsent one still inside its window.
 */
export function nextLifecycleStep(opts: {
  createdAtMs: number
  nowMs: number
  sentIds: ReadonlySet<string>
  hasBuilt: boolean
}): LifecycleStep | null {
  const ageDays = (opts.nowMs - opts.createdAtMs) / 86_400_000
  for (const step of LIFECYCLE_STEPS) {
    if (opts.sentIds.has(step.id)) continue
    if (ageDays < step.day || ageDays >= step.day + LIFECYCLE_WINDOW_DAYS) continue
    if (step.needs === 'built' && !opts.hasBuilt) continue
    if (step.needs === 'notBuilt' && opts.hasBuilt) continue
    return step
  }
  return null
}

// Light layout on purpose: dark emails get colour-inverted by Gmail and Outlook dark mode, and the logo is
// a text wordmark so it still reads when the client blocks images.
export function buildLifecycleEmail(step: LifecycleStep, name: string, to: string): { subject: string; html: string } {
  const first = esc((name || '').trim().split(/\s+/)[0] || 'there')
  const unsub = unsubscribeUrl(to)
  const font = "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  const url = `${APP_URL}${step.cta.path}${step.cta.path.includes('?') ? '&' : '?'}utm_source=lifecycle&utm_medium=email&utm_campaign=${step.id}`
  const paras = step.body
    .map(t => `<p style="font-family:${font};font-size:15px;line-height:1.7;color:#374151;margin:0 0 14px">${t}</p>`)
    .join('')
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(step.subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F4F5">
<div style="display:none;max-height:0;overflow:hidden">${esc(step.headline)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 16px"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
    <tr><td style="background:#0B0B0F;padding:18px 32px;border-radius:8px 8px 0 0">
      <span style="font-family:${font};font-size:17px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em">Wyber<span style="color:${ACCENT}">Ai</span></span>
    </td></tr>
    <tr><td style="background:#FFFFFF;padding:32px 32px 24px">
      <p style="font-family:${font};font-size:13px;color:#6B7280;margin:0 0 18px">Hi ${first},</p>
      <div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px">${esc(step.tag)}</div>
      <h1 style="font-family:${font};font-size:22px;font-weight:700;color:#0A0A0A;margin:0 0 16px;line-height:1.3;letter-spacing:-0.02em">${esc(step.headline)}</h1>
      ${paras}
      <a href="${url}" style="display:inline-block;background:${ACCENT};color:${readableOn(ACCENT)};text-decoration:none;font-family:${font};font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin:8px 0 22px">${esc(step.cta.label)} &rarr;</a>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:8px 0 16px"/>
      <p style="font-family:${font};font-size:12px;color:#6B7280;margin:0;line-height:1.7">Reply to this email and a person will read it.<br/>&mdash; Sumeet</p>
    </td></tr>
    <tr><td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 32px;border-radius:0 0 8px 8px">
      <p style="font-family:${font};font-size:11px;color:#9CA3AF;margin:0;line-height:1.7">&copy; ${new Date().getFullYear()} WyberAi &nbsp;&middot;&nbsp; <a href="${APP_URL}" style="color:#9CA3AF">wyberai.com</a> &nbsp;&middot;&nbsp; <a href="${unsub}" style="color:#9CA3AF">Unsubscribe</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
  return { subject: step.subject, html }
}

export async function sendLifecycleEmail(to: string, name: string, step: LifecycleStep) {
  const { subject, html } = buildLifecycleEmail(step, name, to)
  return sendEmail({ from: FROM, to, subject, html })
}

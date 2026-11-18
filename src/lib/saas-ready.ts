// Launch-ready SaaS products: the contract, the price floor and a source check. Off unless NEXT_PUBLIC_SAAS_LAUNCH_READY=true.
// A SaaS the owner can put in front of paying customers needs the plumbing people forget: honest demo mode, owner-set plans, a real
// payment path (checkout plus an idempotent webhook), sign-in, limits, email, a Setup screen that never fakes a service, legal pages,
// data export and account deletion. Services use the existing go-live catalog (src/lib/go-live.ts) so the setting names agree everywhere.
// Reads source only; the browser check does the rest.

import { creditCost, type BuildSizeTier } from './credits'
import { settingsForNeeds } from './go-live'
import { scanSlopSource } from './unslop'

export const SAAS_MIN_TIER: BuildSizeTier = 'large'
const TIER_ORDER: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

export function saasLaunchReadyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SAAS_LAUNCH_READY === 'true'
}
export function isLaunchReadySaas(projectType?: string | null): boolean {
  return saasLaunchReadyEnabled() && projectType === 'saas'
}
export function floorSaasTier(tier: BuildSizeTier): BuildSizeTier {
  return TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(SAAS_MIN_TIER) ? SAAS_MIN_TIER : tier
}
export function saasLaunchReadyCost(complex = false): { price: number; ceiling: number } {
  const col = complex ? 'default' : 'fast'
  return { price: creditCost('saas-build', col, SAAS_MIN_TIER), ceiling: creditCost('saas-build', col, 'xl') }
}
export function saasLaunchReadyCostText(complex = false): string {
  const { price, ceiling } = saasLaunchReadyCost(complex)
  return `${price} credits (up to ${ceiling} only if the build turns out unusually large; you will see a receipt)`
}

const settings = settingsForNeeds(['payments', 'email-transactional'])
const names = (label: string) => (settings.find(s => s.label === label)?.names ?? []).join(', ')

export const SAAS_LAUNCH_READY_CONTRACT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAUNCH-READY CONTRACT — SAAS PRODUCTS (OVERRIDES EARLIER RULES WHERE THEY CONFLICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The owner will put this in front of paying customers. Build the plumbing, not just the screens, and be exact about what is real and what is demo. Every item is checked after the build; missing items are sent back to you. If output space is short, drop decoration before you drop any item here. These rules override "Billing stays mocked", the "Pro: $29/mo" placeholder, the split-panel auth image with a gradient scrim, and any rule that asks for effects over substance.

S1 DEMO MODE, HONESTLY: until the owner connects services the app runs in demo mode. Show one visible line while in demo mode: "Demo mode: nothing is charged, sent or stored on a server." Sample records are labelled "demo" and can be removed. Never show "synced", "real-time" or "secure" labels that are not true.
S2 PLANS COME FROM THE OWNER: put plan names, prices, limits and features in ONE file, src/plans.ts, from what the prompt states. If the prompt gives no prices, set price to null and show "Price set by the owner" in Settings, Plans; NEVER invent a price like "$29/mo". The pricing page, billing page, upgrade prompts and limit checks all read src/plans.ts only.
S3 PAYMENTS, REAL PATH: write api/checkout.ts (creates a Stripe Checkout Session for the chosen plan from src/plans.ts, success and cancel URLs back to the app) and api/webhook.ts (verifies the Stripe signature, is idempotent by event id, and updates the stored subscription: plan, status, renews or ends on). Read credentials only from process.env with exactly these names: ${names('Stripe')}. The billing page shows the real stored subscription state (plan, status, next date) and a Manage billing link. While payments are not connected, the Upgrade button reads "Connect payments to enable" and the Setup screen lists the exact variable names. Never show a paid state without a verified webhook.
S4 SIGN-IN: email and password with strength hints, forgot password, and a note that email verification needs the email service. When the owner's own Supabase is connected use it (see the Supabase context); otherwise a clearly labelled local demo account. No "Continue with Google" button unless Google sign-in is really configured.
S5 WORKSPACES AND ROLES: every record belongs to a workspace; roles owner, admin, member, viewer enforced in the UI (and in row-level rules when a database is connected); invites by a copyable link in demo mode, by email when email is connected.
S6 LIMITS: plan limits from src/plans.ts are enforced in code with a plain message naming the limit and what the next plan unlocks; usage counters are visible.
S7 EMAIL: api/send-email.ts sends welcome, invite and receipt emails through the owner's email service using exactly: ${names('Resend')}. In demo mode show a preview of the email on screen instead of claiming it was sent.
S8 SETUP SCREEN: a Setup page and api/status.ts list payments, sign-in, email and database as Connected or Not connected, with the exact variable names to set and a link to where each value lives. Never fake a service. If the status endpoint cannot be reached, say server features run once the app is deployed.
S9 ADMIN VIEW: an owner overview of users, plans and monthly recurring revenue computed from stored subscriptions; in demo mode every figure is labelled demo.
S10 LEGAL AND DATA: Terms and Privacy pages built from src/owner-details.ts (company name, country, contact; leave empty where unknown) with a "have this reviewed" note; a consent checkbox on sign-up linking them; "Export my data" and "Delete my account" (typed confirmation) in Settings. Never claim legal compliance.
S11 ACTIVATION: a first-run checklist (create a workspace, invite a teammate, do the product's first real action) with persisted progress, ending on a screen that shows the app with their own data.
S12 PUBLIC PAGES: a landing page and a pricing page generated from src/plans.ts and src/owner-details.ts, following the website rules: one primary action, no invented logos, statistics, testimonials or customer counts.
S13 TRUTH: no certification, uptime or security claim, no "AI-powered", no "trusted by" unless it is built or the owner stated it.
S14 DEFINITION OF DONE (confirm silently before the "Built:" line): demo banner; plans.ts is the only source of prices and limits; checkout and webhook functions; billing page reads stored state; Setup screen and status function; limits enforced; legal pages and consent; export and delete; first-run checklist; no invented claims or prices.
S15 FORM HINTS AND SAMPLE DATA: a field hint such as "too short" appears only after the person has typed or left the field, never on an empty form. Sample people, prices and plans shown outside the demo (stylists, doctors, a price list on a public booking page) carry a visible "Sample" label, and prices use the owner's currency, not USD by default.
`

// ── The check ────────────────────────────────────────────────────────────────

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface SaasItem { id: string; label: string; ok: boolean; fix: string }
export interface SaasResult { total: number; passed: number; items: SaasItem[] }

interface Check { id: string; label: string; fix: string; applies?: (code: string) => boolean; test: (code: string) => boolean }

const CLAIMS = /(soc ?2|iso ?27001|gdpr[- ]compliant|hipaa|bank-grade|military-grade|99\.9+% uptime|trusted by \d|end-to-end encrypt)/i

/** Prices written outside src/plans.ts, such as "$29/mo". */
function strayPrices(code: string): boolean {
  const withoutPlans = code.split(/(?=\/\/ FILE )/).filter(b => !/^\/\/ FILE [^\n]*plans\.ts/.test(b)).join('')
  return /[$₹€£]\s?\d{1,5}(,\d{3})*(\.\d+)?\s?\/\s?(mo|month|yr|year)\b/i.test(withoutPlans)
}

const CHECKS: Check[] = [
  { id: 'demo-banner', label: 'Demo-mode line while services are not connected',
    fix: 'Show "Demo mode: nothing is charged, sent or stored on a server." while services are not connected, and label sample data as demo.',
    test: c => /demo mode/i.test(c) },
  { id: 'plans-file', label: 'Plans, prices and limits kept in src/plans.ts',
    fix: 'Create src/plans.ts with plan names, prices (null when the owner gave none), limits and features, and read it everywhere.',
    test: c => /\/\/ FILE [^\n]*src\/plans\.ts/.test(c) },
  { id: 'no-stray-prices', label: 'No invented prices outside plans.ts',
    fix: 'Remove prices like "$29/mo" written outside src/plans.ts; read prices from src/plans.ts and show "Price set by the owner" when null.',
    test: c => !strayPrices(c) },
  { id: 'checkout', label: 'Checkout function',
    fix: 'Add api/checkout.ts that creates a Stripe Checkout Session for a plan from src/plans.ts, reading STRIPE_SECRET_KEY from process.env.',
    test: c => /\/\/ FILE api\/checkout\.ts/.test(c) && /STRIPE_SECRET_KEY/.test(c) },
  { id: 'webhook', label: 'Idempotent, signature-verified webhook',
    fix: 'Add api/webhook.ts that verifies the Stripe signature with STRIPE_WEBHOOK_SECRET, ignores events already processed (by event id) and updates the stored subscription.',
    test: c => /\/\/ FILE api\/webhook\.ts/.test(c) && /STRIPE_WEBHOOK_SECRET/.test(c) && /constructEvent|signature|stripe-signature/i.test(c) && /processed|event\.id|idempot/i.test(c) },
  { id: 'billing-state', label: 'Billing page reads stored subscription state',
    fix: 'Make the billing page show the stored subscription (plan, status, next date) and a Manage billing link, and the Upgrade button read "Connect payments to enable" until payments are connected.',
    test: c => /subscription/i.test(c) && /(past_due|trialing|active|canceled)/i.test(c) && /connect payments to enable|manage billing/i.test(c) },
  { id: 'setup-screen', label: 'Setup screen and status function that never fake a service',
    fix: 'Add a Setup page and api/status.ts listing payments, sign-in, email and database as Connected or Not connected with the exact variable names.',
    test: c => /\/\/ FILE api\/status\.ts/.test(c) && /not connected/i.test(c) },
  { id: 'limits', label: 'Plan limits enforced with an upgrade message',
    fix: 'Enforce the limits from src/plans.ts in code and show a message naming the limit and what the next plan unlocks.',
    test: c => /limit/i.test(c) && /\/\/ FILE [^\n]*plans\.ts/.test(c) && /(reached|upgrade to|unlocks)/i.test(c) },
  { id: 'roles', label: 'Workspace roles',
    fix: 'Add workspaces with owner, admin, member and viewer roles enforced in the UI.',
    test: c => /owner/i.test(c) && /admin/i.test(c) && /viewer/i.test(c) },
  { id: 'email-fn', label: 'Email function with a demo preview',
    fix: 'Add api/send-email.ts using RESEND_API_KEY and show an on-screen preview of the email in demo mode instead of claiming it was sent.',
    test: c => /\/\/ FILE api\/send-email\.ts/.test(c) || (/RESEND_API_KEY/.test(c) && /preview/i.test(c)) },
  { id: 'legal', label: 'Terms and Privacy with a consent checkbox',
    fix: 'Add Terms and Privacy pages from src/owner-details.ts with a "have this reviewed" note, and a consent checkbox on sign-up that links them.',
    test: c => /terms/i.test(c) && /privacy/i.test(c) && /(type=["']checkbox["']|checkbox)/i.test(c) },
  { id: 'export-delete', label: 'Export my data and Delete my account',
    fix: 'Add "Export my data" and "Delete my account" (typed confirmation) to Settings.',
    test: c => /export (all )?my data|download my data/i.test(c) && /delete (my )?account/i.test(c) },
  { id: 'activation', label: 'First-run checklist',
    fix: 'Add a first-run checklist (create a workspace, invite a teammate, do the first real action) with persisted progress.',
    test: c => /(checklist|getting started|setup progress)/i.test(c) },
  { id: 'no-fake-sso', label: 'No Google button without real Google sign-in',
    fix: 'Remove "Continue with Google" unless sign-in with Google is really configured (signInWithOAuth and GOOGLE_CLIENT_ID).',
    applies: c => /continue with google|sign in with google/i.test(c),
    test: c => /signInWithOAuth|GOOGLE_CLIENT_ID/.test(c) },
  { id: 'no-invented-claims', label: 'No invented certifications, uptime or customer claims',
    fix: 'Remove certification, uptime, security and "trusted by" claims the owner did not state.',
    test: c => !CLAIMS.test(c) },
]

export function checkSaasReady(files: Record<string, FileVal>): SaasResult {
  const code = Object.entries(files || {})
    .filter(([p]) => /\.(tsx?|jsx?|css|html|json)$/.test(p) && !/wyber-ui|wyber-grow|package\.json|package-lock/.test(p))
    .map(([p, v]) => `// FILE ${p}\n${contentOf(v)}`)
    .join('\n')
  const items: SaasItem[] = []
  for (const c of CHECKS) {
    if (c.applies && !c.applies(code)) continue
    items.push({ id: c.id, label: c.label, ok: c.test(code), fix: c.fix })
  }
  return { total: items.length, passed: items.filter(i => i.ok).length, items }
}

export function saasReadySummary(r: SaasResult): string {
  const missing = r.items.filter(i => !i.ok)
  if (missing.length === 0) return `Launch-ready check: all ${r.total} items are present in the code. This reads the source; it does not run the app or take a test payment.`
  return `Launch-ready check: ${r.passed} of ${r.total} items present. Adding: ${missing.map(m => m.label.toLowerCase()).join('; ')}.`
}

export function saasReadyIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  const mine = checkSaasReady(files).items.filter(i => !i.ok).slice(0, 4).map(i => ({
    kind: 'launch-ready' as const,
    detail: i.label,
    fixPrompt: `LAUNCH-READY item missing: ${i.label}. ${i.fix} Change only what is needed and keep everything else working.`,
  }))
  const slop = scanSlopSource(files).issues.slice(0, 2).map(i => ({
    kind: 'launch-ready' as const, detail: `Design: ${i.label}`,
    fixPrompt: `DESIGN CRAFT item: ${i.label} (${i.count} found, for example "${i.sample.replace(/"/g, "'")}"). ${i.fix} Change only what is needed.`,
  }))
  return [...mine, ...slop]
}

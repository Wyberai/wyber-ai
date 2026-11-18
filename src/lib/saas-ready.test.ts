import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { creditCost } from './credits'
import { GO_LIVE_SERVICES } from './go-live'
import {
  SAAS_LAUNCH_READY_CONTRACT, SAAS_MIN_TIER, checkSaasReady, floorSaasTier, isLaunchReadySaas,
  saasLaunchReadyCost, saasLaunchReadyCostText, saasReadyIssues, saasReadySummary,
} from './saas-ready'
import { runQaChecks } from './agents/qa-checks'

afterEach(() => { vi.unstubAllEnvs() })

describe('flag and price', () => {
  it('is off unless NEXT_PUBLIC_SAAS_LAUNCH_READY is "true", and only for saas projects', () => {
    expect(isLaunchReadySaas('saas')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_SAAS_LAUNCH_READY', 'true')
    expect(isLaunchReadySaas('saas')).toBe(true)
    for (const t of ['app', 'website', 'mobile', undefined]) expect(isLaunchReadySaas(t as string | undefined)).toBe(false)
  })
  it('floors at large; shown numbers equal the charged table with the xl ceiling', () => {
    expect(SAAS_MIN_TIER).toBe('large')
    expect(floorSaasTier('small')).toBe('large')
    expect(floorSaasTier('xl')).toBe('xl')
    const { price, ceiling } = saasLaunchReadyCost()
    expect(price).toBe(creditCost('saas-build', 'fast', 'large'))
    expect(ceiling).toBe(creditCost('saas-build', 'fast', 'xl'))
    expect(saasLaunchReadyCostText()).toContain(String(price))
    expect(saasLaunchReadyCostText()).toContain(String(ceiling))
  })
})

describe('contract', () => {
  it('has fourteen rules and uses the exact setting names from the go-live catalog', () => {
    for (let i = 1; i <= 14; i++) expect(SAAS_LAUNCH_READY_CONTRACT).toContain(`S${i} `)
    const stripe = GO_LIVE_SERVICES.find(s => s.id === 'stripe')!
    for (const v of stripe.vars) expect(SAAS_LAUNCH_READY_CONTRACT).toContain(v.name)
    const resend = GO_LIVE_SERVICES.find(s => s.id === 'resend')!
    for (const v of resend.vars) expect(SAAS_LAUNCH_READY_CONTRACT).toContain(v.name)
  })
  it('forbids invented prices, fake paid states and fake services', () => {
    expect(SAAS_LAUNCH_READY_CONTRACT).toMatch(/NEVER invent a price/)
    expect(SAAS_LAUNCH_READY_CONTRACT).toMatch(/Never show a paid state without a verified webhook/)
    expect(SAAS_LAUNCH_READY_CONTRACT).toMatch(/Never fake a service/)
    expect(SAAS_LAUNCH_READY_CONTRACT).toMatch(/Demo mode: nothing is charged, sent or stored on a server/)
  })
  it('is wired into the generator behind the flag', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/generate/route.ts'), 'utf8')
    expect(src).toMatch(/isLaunchReadySaas\(projectType\) \? \(isReplacementBrief\(prompt\) \? UNSLOP_WEBAPP_RULES : SAAS_LAUNCH_READY_CONTRACT \+ UNSLOP_WEBAPP_RULES\)/)
    expect(src).toMatch(/floorSaasTier\(rawBuildTier\)/)
  })
})

const GOOD: Record<string, string> = {
  'src/plans.ts': `export const PLANS = [{ id: 'free', price: null, limit: 3 }, { id: 'pro', price: 999, limit: 50 }]`,
  'src/owner-details.ts': `export const OWNER = { company: '' }`,
  'api/checkout.ts': `const key = process.env.STRIPE_SECRET_KEY; export default async function handler(){}`,
  'api/webhook.ts': `const secret = process.env.STRIPE_WEBHOOK_SECRET; const ev = stripe.webhooks.constructEvent(body, req.headers['stripe-signature'], secret); if (processed.has(ev.id)) return`,
  'api/status.ts': `export default function handler(){ return { payments: 'Not connected' } }`,
  'api/send-email.ts': `const k = process.env.RESEND_API_KEY`,
  'src/App.tsx': `
    <p>Demo mode: nothing is charged, sent or stored on a server.</p>
    subscription.status === 'active' ? <a>Manage billing</a> : <button>Connect payments to enable</button> past_due trialing canceled
    You have reached the limit of your plan. Upgrade to Pro and it unlocks more. const limit = PLANS[0].limit
    roles: owner admin member viewer
    <input type="checkbox"/> I accept the <a>Terms</a> and <a>Privacy</a> policy
    <button>Export my data</button><button>Delete my account</button>
    Getting started checklist
  `,
}

describe('checkSaasReady', () => {
  it('passes a build that has everything', () => {
    const r = checkSaasReady(GOOD)
    expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
    expect(saasReadySummary(r)).toMatch(/Nothing missing/)
    expect(saasReadySummary(r)).toMatch(/not run the app or taken a test payment/)
  })

  it('flags a typical demo SaaS: invented price, mocked billing, fake Google button, fake claims', () => {
    const r = checkSaasReady({
      'src/App.tsx': `<p>Pro: $29/mo</p><button>Continue with Google</button><p>SOC 2 certified. Trusted by 5000 teams.</p>`,
    })
    const failed = r.items.filter(i => !i.ok).map(i => i.id)
    for (const id of ['demo-banner', 'plans-file', 'no-stray-prices', 'checkout', 'webhook', 'setup-screen', 'no-fake-sso', 'no-invented-claims', 'legal', 'export-delete']) {
      expect(failed).toContain(id)
    }
  })

  it('allows a price inside plans.ts but not elsewhere', () => {
    const ok = checkSaasReady({ 'src/plans.ts': `export const x = '$29/mo'` })
    expect(ok.items.find(i => i.id === 'no-stray-prices')?.ok).toBe(true)
    const bad = checkSaasReady({ 'src/plans.ts': 'x', 'src/Pricing.tsx': `<p>₹499 / month</p>` })
    expect(bad.items.find(i => i.id === 'no-stray-prices')?.ok).toBe(false)
  })

  it('requires an idempotency guard and signature check in the webhook', () => {
    const r = checkSaasReady({ 'api/webhook.ts': `const s = process.env.STRIPE_WEBHOOK_SECRET; app.post(h)` })
    expect(r.items.find(i => i.id === 'webhook')?.ok).toBe(false)
  })

  it('only checks the Google button when one exists', () => {
    expect(checkSaasReady({ 'src/App.tsx': 'x' }).items.map(i => i.id)).not.toContain('no-fake-sso')
    expect(checkSaasReady({ 'src/App.tsx': 'Continue with Google signInWithOAuth' }).items.find(i => i.id === 'no-fake-sso')?.ok).toBe(true)
  })

  it('returns at most four launch items plus two design items', () => {
    const issues = saasReadyIssues({ 'src/App.tsx': `bg-clip-text text-transparent 👋` })
    expect(issues.filter(i => !i.detail.startsWith('Design')).length).toBe(4)
    expect(issues.some(i => i.detail.startsWith('Design'))).toBe(true)
  })
})

describe('qa-checks integration', () => {
  it('adds SaaS items only for saas and only when the flag is on', () => {
    const files = { 'src/App.tsx': 'export default function App(){return null}' }
    expect(runQaChecks(files, 'saas').some(i => i.kind === 'launch-ready')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_SAAS_LAUNCH_READY', 'true')
    expect(runQaChecks(files, 'saas').some(i => i.kind === 'launch-ready')).toBe(true)
    expect(runQaChecks(files, 'website').some(i => i.kind === 'launch-ready')).toBe(false)
  })
})

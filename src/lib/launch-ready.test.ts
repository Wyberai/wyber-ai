import { describe, it, expect, afterEach, vi } from 'vitest'
import { creditCost } from './credits'
import {
  LAUNCH_READY_MIN_TIER, WEBAPP_LAUNCH_READY_CONTRACT, checkLaunchReady, floorBuildTier, isLaunchReadyApp,
  launchReadyCost, launchReadyCostText, launchReadyIssues, launchReadySummary,
} from './launch-ready'
import { runQaChecks } from './agents/qa-checks'

afterEach(() => { vi.unstubAllEnvs() })

describe('flag', () => {
  it('is off unless NEXT_PUBLIC_WEBAPP_LAUNCH_READY is "true"', () => {
    expect(isLaunchReadyApp('app')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_WEBAPP_LAUNCH_READY', 'false')
    expect(isLaunchReadyApp('app')).toBe(false)
  })
  it('applies to web apps only', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBAPP_LAUNCH_READY', 'true')
    expect(isLaunchReadyApp('app')).toBe(true)
    expect(isLaunchReadyApp(undefined)).toBe(true)
    for (const t of ['mobile', 'website', 'saas']) expect(isLaunchReadyApp(t)).toBe(false)
  })
})

describe('price', () => {
  it('floors every build at large and never lowers a bigger tier', () => {
    expect(LAUNCH_READY_MIN_TIER).toBe('large')
    expect(floorBuildTier('small')).toBe('large')
    expect(floorBuildTier('medium')).toBe('large')
    expect(floorBuildTier('large')).toBe('large')
    expect(floorBuildTier('xl')).toBe('xl')
  })
  it('shows the same numbers the server charges from (credits.ts), including the ceiling', () => {
    const { price, ceiling } = launchReadyCost()
    expect(price).toBe(creditCost('web-build', 'fast', 'large'))
    expect(ceiling).toBe(creditCost('web-build', 'fast', 'xl'))
    const text = launchReadyCostText()
    expect(text).toContain(String(price))
    expect(text).toContain(String(ceiling))
    expect(text).toMatch(/receipt/)
  })
})

describe('contract', () => {
  it('has all twelve rules and the key phrases the check looks for', () => {
    for (let i = 1; i <= 12; i++) expect(WEBAPP_LAUNCH_READY_CONTRACT).toContain(`LR${i} `)
    for (const phrase of ['Load sample data (demo)', 'Saved in this browser only', 'src/lib/db.ts', 'wa.me', 'Delete all my data']) {
      expect(WEBAPP_LAUNCH_READY_CONTRACT).toContain(phrase)
    }
  })
  it('never promises things the app cannot do', () => {
    expect(WEBAPP_LAUNCH_READY_CONTRACT).toMatch(/Never claim sync, cloud, backup, accounts or encryption/)
    expect(WEBAPP_LAUNCH_READY_CONTRACT).toMatch(/not security/)
    expect(WEBAPP_LAUNCH_READY_CONTRACT).toMatch(/Never say a reminder was sent automatically/)
  })
})

const GOOD: Record<string, string> = {
  'src/lib/db.ts': `const KEY='shop:v1'; export function list(){ try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }`,
  'src/App.tsx': `
    document.title = 'Dukaan Khata | Billing';
    <p>Saved in this browser only.</p>
    <button onClick={loadDemo}>Load sample data (demo)</button>
    <label htmlFor="a">Name</label><label htmlFor="b">Price</label><label htmlFor="c">Qty</label>
    <button aria-label="Close"/><button aria-label="Delete"/><button aria-label="Edit"/>
    <nav className="hidden lg:flex focus-visible:ring-2"/><nav className="lg:hidden"/>
    <button onClick={()=>window.print()}>Print</button>
    const exportCsv=()=>{ const b=new Blob([csv],{type:'text/csv'}); a.download='bills.csv' }
    const importCsv=(f)=>{ const r=new FileReader(); r.onload=()=>setPreview(parse(r.result)); r.readAsText(f); /* .csv preview */ }
    const history=[{at:new Date().toISOString(), what:'price changed'}]; // change history
    <h2>Privacy and Data</h2><button>Export all my data</button><button>Delete all my data</button>
    toast('Deleted', {action:'Undo'})
    <a href={'https://wa.me/91' + phone + '?text=' + msg}>Remind on WhatsApp</a> udhaar
    owner PIN: this is a screen lock for this device, not security.
  `,
}

describe('check', () => {
  it('passes a build that has everything', () => {
    const r = checkLaunchReady(GOOD)
    expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
    expect(r.passed).toBe(r.total)
    expect(launchReadySummary(r)).toMatch(/all \d+ items are present/)
    expect(launchReadySummary(r)).toMatch(/does not run the app in a browser/)
  })

  it('flags a typical demo build: seed data, fake sync, no import, no privacy page', () => {
    const r = checkLaunchReady({
      'src/App.tsx': `const [items]=useState(seed); <span>Synced just now</span> <button>Add</button> trusted by 5000 shops`,
    })
    const failed = r.items.filter(i => !i.ok).map(i => i.id)
    for (const id of ['persist', 'honest-storage', 'demo-labelled', 'no-fake-sync', 'import-csv', 'export-csv', 'privacy', 'no-invented-claims']) {
      expect(failed).toContain(id)
    }
    expect(launchReadySummary(r)).toMatch(/items present\. Adding:/)
  })

  it('skips checks that do not apply (no PIN, no reminders) instead of failing them', () => {
    const r = checkLaunchReady({ 'src/App.tsx': 'plain app' })
    expect(r.items.map(i => i.id)).not.toContain('pin-honest')
    expect(r.items.map(i => i.id)).not.toContain('whatsapp-reminder')
  })

  it('requires the honest PIN sentence only when a PIN exists', () => {
    const r = checkLaunchReady({ 'src/App.tsx': 'Owner PIN (4 digits)' })
    expect(r.items.find(i => i.id === 'pin-honest')?.ok).toBe(false)
  })

  it('sends at most four fix prompts per pass', () => {
    const issues = launchReadyIssues({ 'src/App.tsx': 'x' })
    expect(issues.length).toBe(4)
    expect(issues[0].fixPrompt).toMatch(/LAUNCH-READY item missing/)
  })
})

describe('qa-checks integration', () => {
  it('adds nothing while the flag is off', () => {
    const issues = runQaChecks({ 'src/App.tsx': 'export default function App(){return null}' }, 'app')
    expect(issues.some(i => i.kind === 'launch-ready')).toBe(false)
  })
  it('adds launch-ready issues for web apps only when the flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBAPP_LAUNCH_READY', 'true')
    const files = { 'src/App.tsx': 'export default function App(){return null}' }
    expect(runQaChecks(files, 'app').some(i => i.kind === 'launch-ready')).toBe(true)
    expect(runQaChecks({ 'App.tsx': 'export default function App(){return null}' }, 'mobile').some(i => i.kind === 'launch-ready')).toBe(false)
  })
})

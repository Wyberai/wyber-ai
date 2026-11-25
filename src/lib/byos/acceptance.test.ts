import { describe, it, expect, afterEach, vi } from 'vitest'
import { composeBuildPrompt, PROMPT_LIMIT, PROMPT_LIMIT_READY, REPLACEMENT_REQUIREMENTS } from './quote'

afterEach(() => { vi.unstubAllEnvs() })
import { checkReplacement, parseChecklist, replacementIssues, replacementSummary } from './acceptance'
import { runQaChecks } from '../agents/qa-checks'

const CHECKLIST = `export const FEATURES = [
  { name: 'Deal pipeline', status: 'built', note: '' },
  { name: "Email sync", status: 'simplified', note: 'manual log, no inbox sync' },
  { name: 'Sales forecasting', status: 'built' },
  { name: 'Contact import', status: 'built' },
]`

describe('parseChecklist', () => {
  it('reads names, statuses and notes in either quote style', () => {
    const f = parseChecklist(CHECKLIST)
    expect(f.map(x => x.name)).toEqual(['Deal pipeline', 'Email sync', 'Sales forecasting', 'Contact import'])
    expect(f[1]).toMatchObject({ status: 'simplified', note: 'manual log, no inbox sync' })
    expect(f[0].status).toBe('built')
  })
  it('returns nothing for text that is not a checklist', () => {
    expect(parseChecklist('const x = 1')).toEqual([])
  })
})

describe('checkReplacement', () => {
  const files = {
    'src/replacement-checklist.ts': CHECKLIST,
    'src/pages/Pipeline.tsx': `export default () => <h1>Deal pipeline</h1>`,
    'src/pages/Email.tsx': `export default () => <p>Log an email by hand (simplified)</p>`,
    'src/pages/Forecast.tsx': `export default () => <h2>Forecast of sales</h2>`,
  }

  it('counts features that appear on a screen and lists the ones that do not', () => {
    const r = checkReplacement(files)!
    expect(r.total).toBe(4)
    expect(r.simplified).toBe(1)
    expect(r.features.find(f => f.name === 'Deal pipeline')?.found).toBe(true)
    expect(r.features.find(f => f.name === 'Sales forecasting')?.found).toBe(true) // most words appear in one screen
    expect(r.missing).toContain('Contact import')
    expect(r.present).toBe(r.total - r.missing.length)
  })

  it('does not count the checklist file itself as a screen', () => {
    const r = checkReplacement({ 'src/replacement-checklist.ts': CHECKLIST })!
    expect(r.present).toBe(0)
  })

  it('returns null when the build has no checklist', () => {
    expect(checkReplacement({ 'src/App.tsx': 'x' })).toBeNull()
  })

  it('writes a plain summary that says it reads source, and fix prompts for missing items', () => {
    const r = checkReplacement(files)!
    expect(replacementSummary(r)).toMatch(/of 4 features appear on a screen/)
    expect(replacementSummary(r)).toMatch(/Adding: Contact import|Adding:/)
    const issues = replacementIssues(files)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.some(i => /Contact import/.test(i.fixPrompt))).toBe(true)
    expect(issues.some(i => /Email sync/.test(i.fixPrompt))).toBe(true) // listed as simplified, but nothing on screen carries its name
    expect(replacementSummary(checkReplacement({ ...files, 'src/pages/Import.tsx': '<h3>Contact import</h3>', 'src/pages/Sync.tsx': '<p>Email sync (manual)</p>' })!)).toMatch(/does not run the app/)
  })

  it('feeds the structural QA checks only when a checklist exists', () => {
    expect(runQaChecks({ 'src/App.tsx': 'export default function App(){return null}' }, 'saas').some(i => i.detail.startsWith('Replacement'))).toBe(false)
    expect(runQaChecks(files, 'saas').some(i => i.detail.startsWith('Replacement feature missing'))).toBe(true)
  })
})

describe('hand-off prompt', () => {
  const feats = Array.from({ length: 14 }, (_, i) => ({ module: 'Sales', name: `Feature number ${i}`, description: `Describes in a full sentence what feature ${i} does for the user.` }))
  const opts = { product: 'Pipedrive', category: 'CRM', features: feats, connectLive: [], connectPlaceholder: [], importCsv: true }

  it('is unchanged while the flag is off: 2000 characters and no replacement requirements', () => {
    expect(PROMPT_LIMIT).toBe(2000)
    const p = composeBuildPrompt(opts)
    expect(p.length).toBeLessThanOrEqual(PROMPT_LIMIT)
    expect(p).not.toContain('src/replacement-checklist.ts')
  })

  it('with NEXT_PUBLIC_REPLACE_READY=true allows 6000 characters and carries the replacement requirements', () => {
    vi.stubEnv('NEXT_PUBLIC_REPLACE_READY', 'true')
    expect(PROMPT_LIMIT_READY).toBe(6000)
    const p = composeBuildPrompt(opts)
    expect(p.length).toBeLessThanOrEqual(PROMPT_LIMIT_READY)
    expect(p).toContain('src/replacement-checklist.ts')
    expect(p).toContain('Describes in a full sentence what feature 13 does')
    expect(REPLACEMENT_REQUIREMENTS).toMatch(/parallel-run checklist/)
    expect(REPLACEMENT_REQUIREMENTS).toMatch(/Never claim a perfect migration/)
  })
})

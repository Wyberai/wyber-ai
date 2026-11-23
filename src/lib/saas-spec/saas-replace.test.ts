import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ts from 'typescript'
import { composeBuildPrompt } from '../byos/quote'
import { checkReplacement, parseChecklist } from '../byos/acceptance'
import { scanSlopSource } from '../unslop'
import { reviewEmittedFile, createFindingIdGenerator } from '../agents/security-rules'
import type { AppModel } from '../app-spec/types'
import { parseReplacementBrief, coverageOf, generateReplacement, renderChecklistTs, validateReplacementModel } from './replace'
import { runSaasSpec } from './run'
import { planSaas } from './plan'
import { DEMO_SAAS, demoSiteCopy } from './demo-models'

vi.setConfig({ testTimeout: 30000 })

describe('Replace-your-SaaS', () => {
  const prev = process.env.NEXT_PUBLIC_REPLACE_READY
  beforeEach(() => { process.env.NEXT_PUBLIC_REPLACE_READY = 'true' })
  afterEach(() => { if (prev === undefined) delete process.env.NEXT_PUBLIC_REPLACE_READY; else process.env.NEXT_PUBLIC_REPLACE_READY = prev })

  const brief = () => composeBuildPrompt({
    product: 'Acme Boards', category: 'project management',
    features: [
      { module: 'Work', name: 'Projects', description: 'Each piece of work with an owner and a due date' },
      { module: 'Work', name: 'Tasks', description: 'Steps inside a project' },
      { module: 'Reports', name: 'Overdue tasks', description: 'A count of tasks past their date', fit: 'lite', note: 'a count only, no charts' },
    ],
    connectLive: [], connectPlaceholder: [], importCsv: true,
  })
  const model = (withOverdue = true): AppModel => ({
    appName: 'Work Board', tagline: 'Our own project tracker, nothing else.', homeIntro: 'Projects and their tasks, with the tasks that are late counted for you.',
    entities: [
      {
        id: 'projects', label: 'Projects', singular: 'Project', title: 'name', blurb: 'Each piece of work and who owns it.', status: 'stage', finalStatuses: ['Done'], due: 'due',
        fields: [{ id: 'name', label: 'Name', type: 'text', required: true }, { id: 'owner', label: 'Owner', type: 'text' }, { id: 'stage', label: 'Stage', type: 'select', options: ['Planned', 'Active', 'Done'] }, { id: 'due', label: 'Due', type: 'date' }],
        sample: [{ name: 'Website refresh', owner: 'Asha', stage: 'Active', due: '+7d' }, { name: 'Office move', owner: 'Ravi', stage: 'Planned', due: '+30d' }, { name: 'Audit', owner: 'Asha', stage: 'Done', due: '-10d' }],
      },
      {
        id: 'tasks', label: 'Tasks', singular: 'Task', title: 'task', blurb: 'The steps inside each project.', status: 'state', finalStatuses: ['Done'], due: 'by',
        fields: [{ id: 'task', label: 'Task', type: 'text', required: true }, { id: 'project', label: 'Project', type: 'ref', ref: 'projects' }, { id: 'state', label: 'State', type: 'select', options: ['To do', 'Doing', 'Done'] }, { id: 'by', label: 'Do by', type: 'date' }],
        sample: [{ task: 'Draft the pages', project: 'Website refresh', state: 'Doing', by: '+2d' }, { task: 'Pick a date', project: 'Office move', state: 'To do', by: '-1d' }, { task: 'Sign off', project: 'Audit', state: 'Done', by: '-9d' }],
      },
    ],
    metrics: [
      { id: 'open', label: 'Open projects', kind: 'countWhere', entity: 'projects', where: { field: 'stage', op: 'neq', value: 'Done' } },
      withOverdue
        ? { id: 'late', label: 'Overdue tasks', kind: 'countWhere', entity: 'tasks', where: { field: 'by', op: 'overdue' } }
        : { id: 'late', label: 'Tasks in progress', kind: 'countWhere', entity: 'tasks', where: { field: 'state', op: 'eq', value: 'Doing' } },
      { id: 'done', label: 'Tasks done', kind: 'countWhere', entity: 'tasks', where: { field: 'state', op: 'eq', value: 'Done' } },
    ],
  })
  const reply = (m: unknown) => ({ text: JSON.stringify(m), inputTokens: 400, outputTokens: 1200 })

  it('reads the hand-off brief: product, category, every feature with its simplified note; refuses other prompts', () => {
    const b = parseReplacementBrief(brief())!
    expect(b.product).toBe('Acme Boards')
    expect(b.category).toBe('project management')
    expect(b.features.map(f => f.name)).toEqual(['Projects', 'Tasks', 'Overdue tasks'])
    expect(b.features[2]).toMatchObject({ simplified: true, note: 'a count only, no charts' })
    expect(b.needsServices).toBe(false)
    expect(parseReplacementBrief('Build a gym app')).toBeNull()
  })
  it('the checklist file is in the shape acceptance.ts reads', () => {
    const f = parseChecklist(renderChecklistTs([{ name: 'Projects', status: 'built' }, { name: 'Overdue tasks', status: 'simplified', note: 'a count only' }]))
    expect(f).toEqual([{ name: 'Projects', status: 'built', note: undefined }, { name: 'Overdue tasks', status: 'simplified', note: 'a count only' }])
  })
  it('coverage is checkReplacement over the screens: a feature with no entity or metric is named', () => {
    const feats = parseReplacementBrief(brief())!.features.map(f => ({ name: f.name, status: 'built' as const }))
    expect(coverageOf(model(), feats)!.missing).toEqual([])
    expect(coverageOf(model(false), feats)!.missing).toEqual(['Overdue tasks'])
    expect(validateReplacementModel(model(false), feats).join(' ')).toMatch(/"Overdue tasks" has no screen/)
  })
  it('builds an internal tool: every listed feature on a screen, a cut-over page, no marketing and no billing; a missing feature is sent back once', async () => {
    const asked: string[] = []
    let n = 0
    const r = await generateReplacement({ prompt: brief(), seed: 'r1' }, { write: async (_s, u) => { asked.push(u); return reply(n++ === 0 ? model(false) : model()) } })
    expect(r.ok).toBe(true)
    expect(asked).toHaveLength(2)
    expect(asked[1]).toMatch(/Overdue tasks/)
    if (!r.ok) return
    const files = Object.fromEntries([...r.text.matchAll(/<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g)].map(m => [m[1], m[2]]))
    const check = checkReplacement(files)!
    expect(check.total).toBe(3)
    expect(check.missing).toEqual([])
    expect(files['src/components/CutoverPage.tsx']).toMatch(/Parallel run/)
    expect(files['src/components/CoveragePage.tsx']).toMatch(/Simplified: /)
    expect(files['src/components/CoveragePage.tsx']).toContain('a count only, no charts')
    expect(files['src/App.tsx']).toContain("view === 'replacement'")
    expect(files['src/App.tsx']).toContain("view === 'cutover'")
    expect(Object.keys(files).some(p => /plans\.ts|^api\/|Site\.tsx/.test(p))).toBe(false)
    expect(JSON.stringify(files)).not.toMatch(/Demo mode|pricing|Upgrade/i)
    const ui = Object.fromEntries(Object.entries(files).filter(([p]) => /\.(tsx|css)$/.test(p)))
    expect(scanSlopSource(ui).issues.map(i => i.id)).toEqual([])
    const next = createFindingIdGenerator()
    expect(Object.entries(files).flatMap(([p, c]) => reviewEmittedFile(p, c, '', { nextId: next })).filter(f => f.blocking)).toEqual([])
    for (const [p, c] of Object.entries(files)) {
      if (!/\.tsx?$/.test(p)) continue
      const out = ts.transpileModule(c, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }, fileName: p })
      expect((out.diagnostics ?? []).map(x => ts.flattenDiagnosticMessageText(x.messageText, '\n')), p).toEqual([])
    }
  })
  it('a brief that needs outside services, or a model that never covers the checklist, falls back', async () => {
    const withServices = brief() + '\nOutside services: put ALL server code in Vercel serverless functions'
    expect((await generateReplacement({ prompt: withServices, seed: 'r' }, { write: async () => reply(model()) })).ok).toBe(false)
    const never = await generateReplacement({ prompt: brief(), seed: 'r' }, { write: async () => reply(model(false)) })
    expect(never.ok).toBe(false)
  })
  it('runSaasSpec sends a replacement brief to the internal-tool path and anything else to the SaaS path', async () => {
    const a = await runSaasSpec({ prompt: brief(), seed: 'x' }, async () => reply(model()))
    expect(a.ok && a.summary).toMatch(/^replacement features=3/)
    const d = DEMO_SAAS[0]
    const spec = planSaas(d.prompt, { seed: d.seed, currency: d.currency })
    const b = await runSaasSpec({ prompt: d.prompt, seed: d.seed }, async (_s, u) => reply(/Sections to write/.test(u) ? demoSiteCopy(spec.site, d.copy) : { ...d.model.app, plans: d.model.plans }))
    expect(b.ok && b.summary).toMatch(/^saas direction=/)
  })
})

import { describe, it, expect } from 'vitest'
import ts from 'typescript'
import { build } from 'esbuild'
import { classifyAppIntent, planApp, renderApp, validateModel, normalizeModel, buildModelPrompt, generateApp, APP_BLUEPRINTS } from './index'
import { DEMO_APPS } from './demo-models'
import { kitImportCount } from '../website-ready'
import { checkLaunchReady } from '../launch-ready'
import { scanSlopSource } from '../unslop'
import { reviewEmittedFile, createFindingIdGenerator } from '../agents/security-rules'
import { DIRECTIONS } from '../design-directions'
import { WYBER_UI_KIT_SOURCE } from '../wyber-ui-kit'

describe('app intents', () => {
  it.each([
    ['A simple udhaar and billing book for a kirana shop in Surat', 'billing'],
    ['Appointment book for a physiotherapy clinic in Pune', 'booking'],
    ['Member register for a small gym in Ahmedabad', 'register'],
    ['A lead tracker with follow-ups and stages for my sales team', 'pipeline'],
    ['Track my daily expenses and spending by category', 'tracker'],
  ])('%s -> %s', (prompt, intent) => {
    expect(classifyAppIntent(prompt).intent).toBe(intent)
  })
  it('an unclear brief becomes a simple register and says so', () => {
    const b = classifyAppIntent('an app')
    expect(b.intent).toBe('register')
    expect(b.note).toMatch(/not clear/)
  })
  it('every blueprint has a skeleton, a proof line and guidance', () => {
    for (const bp of Object.values(APP_BLUEPRINTS)) { expect(bp.skeleton.length).toBeGreaterThan(0); expect(bp.proof.length).toBeGreaterThan(10); expect(bp.guidance.length).toBeGreaterThan(20) }
  })
})

describe('app plan', () => {
  it('is deterministic per seed, picks app-surface directions and varies across seeds', () => {
    const p = DEMO_APPS[0].prompt
    expect(planApp(p, { seed: 'a' })).toEqual(planApp(p, { seed: 'a' }))
    const layouts = new Set(Array.from({ length: 16 }, (_, i) => JSON.stringify(planApp(p, { seed: 's' + i }).layout)))
    expect(layouts.size).toBeGreaterThan(2)
    for (let i = 0; i < 8; i++) expect(DIRECTIONS.find(d => d.id === planApp(p, { seed: 'k' + i }).direction.id)?.surfaces).toContain('app')
  })
  it('the stated feel steers the direction', () => {
    const s = planApp('Member register for a gym. The feel: dark and moody.', { seed: 'x' })
    expect(s.direction.mode).toBe('dark')
  })
})

describe('domain model validation', () => {
  it('the three demo models pass', () => {
    for (const d of DEMO_APPS) expect(validateModel(normalizeModel(d.model)), d.key).toEqual([])
  })
  const clone = () => structuredClone(DEMO_APPS[0].model)
  it('rejects a computed total that does not point at a child ref', () => {
    const m = clone(); m.entities[0].computed![0].ref = 'item'
    expect(validateModel(m).join(' ')).toMatch(/computed\.total/)
  })
  it('rejects unknown refs, fake-looking phones, claims, bad sample types and metrics on missing fields', () => {
    const m = clone()
    m.entities[1].fields[0].ref = 'nothing'
    m.entities[0].sample[0].phone = '98765 43210'
    m.tagline = 'The best udhaar book in India!'
    m.entities[0].sample[1].owed = 'a lot' as unknown as number
    m.metrics[0].field = 'phone'
    const out = validateModel(m).join(' | ')
    expect(out).toMatch(/fields\.bill\.ref/)
    expect(out).toMatch(/sample phones must look like/)
    expect(out).toMatch(/tagline/)
    expect(out).toMatch(/must be a number/)
    expect(out).toMatch(/a sum needs a number or money field/)
  })
  it('rejects a sample row that names another row that does not exist', () => {
    const m = clone(); m.entities[1].sample[0].bill = 'Nobody'
    expect(validateModel(m).join(' ')).toMatch(/must be the title of a sample row/)
  })
  it('normalizeModel drops every key the schema does not know', () => {
    const polluted = { ...clone(), secret: 'x', entities: clone().entities.map(e => ({ ...e, hacked: 1, fields: e.fields.map(f => ({ ...f, junk: true })) })) }
    const n = JSON.stringify(normalizeModel(polluted))
    expect(n).not.toMatch(/secret|hacked|junk/)
  })
  it('the prompt carries the blueprint, the rules and no code instructions', () => {
    const { system, user } = buildModelPrompt(classifyAppIntent(DEMO_APPS[0].prompt), DEMO_APPS[0].prompt)
    expect(system).toMatch(/do not write code/i)
    expect(user).toMatch(/Bills/)
    expect(user).toMatch(/90000 00001/)
  })
})

describe('rendered app', () => {
  for (const d of DEMO_APPS) {
    describe(d.key, () => {
      const spec = planApp(d.prompt, { seed: d.seed })
      const { files } = renderApp(spec, d.model)
      const allSource = Object.entries(files).filter(([p]) => /\.(tsx?|css|html)$/.test(p)).map(([p, c]) => `// FILE ${p}\n${c}`).join('\n')

      it('passes every launch-ready check, with the kit in use', () => {
        const r = checkLaunchReady(files)
        expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
        expect(kitImportCount(allSource)).toBeGreaterThanOrEqual(10)
      })
      it('has no slop findings and no blocking security finding', () => {
        const ui = Object.fromEntries(Object.entries(files).filter(([p]) => /\.(tsx|css)$/.test(p)))
        expect(scanSlopSource(ui).issues.map(i => i.id)).toEqual([])
        const next = createFindingIdGenerator()
        const blocking = Object.entries(files).flatMap(([p, c]) => reviewEmittedFile(p, c, '', { nextId: next })).filter(f => f.blocking)
        expect(blocking.map(f => f.ruleId)).toEqual([])
      })
      it('every generated source file is valid TypeScript (syntax)', () => {
        for (const [p, c] of Object.entries(files)) {
          if (!/\.tsx?$/.test(p)) continue
          const out = ts.transpileModule(c, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }, fileName: p })
          expect((out.diagnostics ?? []).map(x => ts.flattenDiagnosticMessageText(x.messageText, '\n')), p).toEqual([])
        }
      })
      it('the page title and description describe this app; responsive nav and undo are there', () => {
        expect(files['index.html']).toContain(d.model.appName)
        expect(files['src/App.tsx']).toMatch(/hidden border-r[^"]*lg:block/)
        expect(files['src/App.tsx']).toContain('lg:hidden')
        expect(files['src/App.tsx']).toContain('Undo')
      })
    })
  }
})

// Run the generated runtime for real: bundle it from memory and exercise the data and logic code.
async function loadRuntime(key: string) {
  const d = DEMO_APPS.find(x => x.key === key)!
  const files = renderApp(planApp(d.prompt, { seed: d.seed }), d.model).files
  const vfs = new Map(Object.entries(files).map(([p, c]) => ['/v/' + p, c]))
  const res = await build({
    stdin: { contents: "export { APP } from './src/schema'\nimport * as db from './src/lib/db'\nimport * as logic from './src/lib/logic'\nimport * as csv from './src/lib/csv'\nexport { db, logic, csv }", resolveDir: '/v', sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
    plugins: [{
      name: 'vfs',
      setup(b) {
        b.onResolve({ filter: /^\.\.?\// }, a => {
          const base = a.namespace === 'vfs' ? a.importer.replace(/\/[^/]+$/, '') : '/v'
          const parts = (base + '/' + a.path).split('/')
          const stack: string[] = []
          for (const s of parts) { if (s === '..') stack.pop(); else if (s !== '.' && s !== '') stack.push(s) }
          const raw = '/' + stack.join('/')
          const hit = [raw, raw + '.ts', raw + '.tsx'].find(x => vfs.has(x))
          return hit ? { path: hit, namespace: 'vfs' } : undefined
        })
        b.onLoad({ filter: /.*/, namespace: 'vfs' }, a => ({ contents: vfs.get(a.path)!, loader: a.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: a.path.replace(/\/[^/]+$/, '') }))
      },
    }],
  })
  const store = new Map<string, string>()
  const local = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v) }, removeItem: (k: string) => { store.delete(k) } }
  const mod = { exports: {} as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  new Function('module', 'exports', 'localStorage', res.outputFiles[0].text)(mod, mod.exports, local)
  return { ...mod.exports, store } as { APP: any; db: any; logic: any; csv: any; store: Map<string, string> } // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('generated runtime, executed', () => {
  it('starts empty; sample data is marked demo; metrics, totals and overdue are worked out from the rows', async () => {
    const { APP, db, logic } = await loadRuntime('khata')
    let s = db.load()
    expect(logic.isEmpty(s)).toBe(true)
    s = logic.withSample(s)
    expect(logic.hasSample(s)).toBe(true)
    expect(db.list(s, 'bills').every((r: any) => r.demo === true)).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
    const m = (id: string) => logic.metricValue(s, APP.metrics.find((x: any) => x.id === id)) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(m('owed')).toBe(2910)
    expect(m('late')).toBe(1)
    expect(m('paid')).toBe(1)
    const bills = db.list(s, 'bills')
    const ramesh = bills.find((r: any) => r.customer === 'Ramesh Patel') // eslint-disable-line @typescript-eslint/no-explicit-any
    const total = APP.entities[0].computed[0]
    expect(logic.computedValue(s, APP.entities[0], total, ramesh)).toBe(1840)
    expect(logic.isOverdue(APP.entities[0], ramesh)).toBe(true)
    expect(logic.isOverdue(APP.entities[0], bills.find((r: any) => r.customer === 'Mohan Desai'))).toBe(false) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(db.list(s, 'lines').every((r: any) => bills.some((b: any) => b.id === r.bill))).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(logic.isEmpty(logic.withoutSample(s))).toBe(true)
  })

  it('the WhatsApp reminder is a pre-filled link, only for rows that can be reminded', async () => {
    const { APP, db, logic } = await loadRuntime('khata')
    const s = logic.withSample({ ...db.load(), settings: { businessName: 'Patel Kirana', setupDone: true } })
    const ent = APP.entities[0]
    const ramesh = db.list(s, 'bills').find((r: any) => r.customer === 'Ramesh Patel') // eslint-disable-line @typescript-eslint/no-explicit-any
    const link = logic.reminderLink(s, ent, ramesh)
    expect(link).toMatch(/^https:\/\/wa\.me\/919000000001\?text=/)
    expect(decodeURIComponent(link)).toMatch(/Hello Ramesh Patel, a friendly reminder from Patel Kirana/)
    expect(decodeURIComponent(link)).toMatch(/1,840/)
    const paid = db.list(s, 'bills').find((r: any) => r.customer === 'Mohan Desai') // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(logic.reminderEligible(ent, paid)).toBe(false)
    expect(logic.reminderEligible(ent, ramesh)).toBe(true)
  })

  it('needs-attention lists overdue and soon-due rows, most urgent first, and never settled ones', async () => {
    const { db, logic } = await loadRuntime('khata')
    const s = logic.withSample(db.load())
    const due = logic.attention(s)
    expect(due.length).toBeGreaterThan(0)
    expect(due.every((d: any) => d.days <= 7)).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(due.map((d: any) => d.days)).toEqual([...due.map((d: any) => d.days)].sort((a: number, b: number) => a - b)) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(due.some((d: any) => d.row.customer === 'Mohan Desai')).toBe(false) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(logic.dueLabel(-3)).toBe('Overdue by 3 days')
    expect(logic.dueLabel(0)).toBe('Due today')
    expect(logic.dueLabel(1)).toBe('Due in 1 day')
  })

  it('a record knows its children (a bill has lines)', async () => {
    const { APP, logic } = await loadRuntime('khata')
    const kids = logic.childrenOf(APP.entities[0])
    expect(kids.some((k: any) => k.entity.id === 'lines' && k.ref.type === 'ref')).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(logic.childrenOf(APP.entities.find((e: any) => e.id === 'lines'))).toEqual([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  it('saves and reloads through localStorage, logs changes, deletes and restores, and wipes', async () => {
    const { db, store } = await loadRuntime('gym')
    let s = db.load()
    const made = db.create(s, 'members', { name: 'Test Member', phone: '90000 00031', status: 'Active' })
    s = db.logChange(made.store, 'Added member: Test Member')
    expect(db.save(s)).toBe(true)
    expect([...store.keys()].some(k => k.startsWith('app-data:'))).toBe(true)
    const again = db.load()
    expect(db.list(again, 'members')).toHaveLength(1)
    expect(again.history[0].what).toMatch(/Test Member/)
    expect(again.history[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    const gone = db.remove(again, 'members', [made.row.id])
    expect(db.list(gone.store, 'members')).toHaveLength(0)
    expect(db.list(db.restore(gone.store, 'members', gone.removed), 'members')).toHaveLength(1)
    expect(db.list(db.wipe(), 'members')).toHaveLength(0)
    expect(store.size).toBe(0)
  })

  it('an unreadable or old save never breaks the app', async () => {
    const { db, store } = await loadRuntime('gym')
    store.set([...store.keys()][0] ?? 'app-data:ironroom-register', '{not json')
    store.set('app-data:ironroom-register', '{not json')
    expect(db.list(db.load(), 'members')).toEqual([])
    store.set('app-data:ironroom-register', JSON.stringify({ version: 99, data: { members: [{ id: 'x' }] } }))
    expect(db.list(db.load(), 'members')).toEqual([])
  })

  it('reads and writes CSV: quotes, commas, a byte order mark, and a round trip', async () => {
    const { csv } = await loadRuntime('clinic')
    expect(csv.parseCsv('﻿Name,Notes\r\n"Mehta, A","said ""hi"""\r\nRao,\r\n')).toEqual([['Name', 'Notes'], ['Mehta, A', 'said "hi"'], ['Rao', '']])
    const text = csv.toCsv(['Name', 'Notes'], [['Mehta, A', 'said "hi"'], ['Rao', '']])
    expect(csv.parseCsv(text)).toEqual([['Name', 'Notes'], ['Mehta, A', 'said "hi"'], ['Rao', '']])
  })
})

describe('generateApp (model injected)', () => {
  const d = DEMO_APPS[0]
  const reply = (obj: unknown) => ({ text: JSON.stringify(obj), inputTokens: 500, outputTokens: 1500 })

  it('asks once, validates, renders and returns <file> blocks with App.tsx last', async () => {
    let calls = 0
    const r = await generateApp({ prompt: d.prompt, seed: d.seed }, { writeModel: async () => { calls++; return reply(d.model) } })
    expect(calls).toBe(1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.paths[r.paths.length - 1]).toBe('src/App.tsx')
    expect(r.text).toContain('<file path="src/lib/db.ts">')
    expect(r.text).toContain('<file path="src/schema.ts">')
    expect(r.usage).toEqual({ inputTokens: 500, outputTokens: 1500 })
  })
  it('extra keys in the reply never reach the app; a bad reply is repaired once, then gives up cleanly', async () => {
    const polluted = { ...d.model, hidden: 'nope', entities: d.model.entities.map(e => ({ ...e, extra: 1 })) }
    const ok = await generateApp({ prompt: d.prompt, seed: d.seed }, { writeModel: async () => reply(polluted) })
    expect(ok.ok).toBe(true)
    if (ok.ok) { expect(ok.text).not.toContain('"hidden": "nope"'); expect(ok.text).not.toContain('"extra"') }
    const asked: string[] = []
    const bad = await generateApp({ prompt: d.prompt, seed: d.seed }, { writeModel: async (_s, u) => { asked.push(u); return reply({ ...d.model, entities: [] }) } })
    expect(bad.ok).toBe(false)
    expect(asked).toHaveLength(2)
    expect(asked[1]).toMatch(/entities/)
  })
})

describe('the kit pieces the runtime leans on exist', () => {
  it('exports Button, Dialog, Drawer, SidebarNav, BottomTabBar, StatBlock, EmptyState, Badge, Card, Input', () => {
    for (const n of ['Button', 'Dialog', 'Drawer', 'SidebarNav', 'BottomTabBar', 'StatBlock', 'EmptyState', 'Badge', 'Card', 'Input']) expect(WYBER_UI_KIT_SOURCE).toMatch(new RegExp('export function ' + n + '\\b'))
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { webappSpecEnabled } from './flag'
describe('route wiring for web apps', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')
  it('is off unless WEBAPP_SPEC_BUILD=on', () => { expect(webappSpecEnabled()).toBe(false) })
  it('runs only for new launch-ready web app builds, reviews the files and falls back on any failure', () => {
    const block = route.slice(route.indexOf('Spec-driven web app build'), route.indexOf('let handledByParallel = handledBySpec'))
    expect(block).toContain("projectType !== 'mobile' && projectType !== 'website' && projectType !== 'saas' && isLaunchReadyApp(projectType)")
    expect(block).toContain('!handledBySpec && isNewBuild && stage === \'full\' && !selfHeal')
    expect(block).toContain('reviewEmittedFile(f.path, f.content')
    expect(block).toContain('sentinelDone(c)')
    expect(block).toContain('falling back to the free-form build')
  })
})

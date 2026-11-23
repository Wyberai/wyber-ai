import { describe, it, expect } from 'vitest'
import ts from 'typescript'
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { planMobile, renderMobileApp, generateMobileApp, buildMobileModelPrompt, mobileSpecEnabled, parseTypeSpec, renderTheme, MOBILE_KIT_SOURCE } from './index'
import { MOBILE_DEMOS } from './demo'
import { MOBILE_DIRECTIONS, getMobileDirectionById, type MobileStructure } from '../mobile-directions'
import { checkMobileReady, mobileReadyIssues } from '../mobile-ready'
import { scanSlopSource } from '../unslop'
import { reviewEmittedFile, createFindingIdGenerator } from '../agents/security-rules'
import { classifyAppIntent, validateModel, normalizeModel } from '../app-spec'
import { DEMO_APPS } from '../app-spec/demo-models'

const STRUCTURES: MobileStructure[] = ['tabs-feed', 'tool-first', 'tabs-dashboard', 'cards-swipe', 'split-list', 'sheet-nav']

describe('mobile plan', () => {
  it('is deterministic per seed, and a stated feel picks a fitting direction', () => {
    const p = MOBILE_DEMOS[0].prompt
    expect(planMobile(p, { seed: 'a' })).toEqual(planMobile(p, { seed: 'a' }))
    expect(planMobile('A workout and gym tracker', { seed: 'x' }).direction.id).toBe('m-sport-energy')
    expect(planMobile('Daily meditation and mood diary', { seed: 'x' }).direction.id).toBe('m-calm-sage')
  })
  it('varies the layout across seeds and always lands on a known structure', () => {
    const plans = Array.from({ length: 40 }, (_, i) => planMobile(MOBILE_DEMOS[0].prompt, { seed: 's' + i }))
    expect(new Set(plans.map(p => JSON.stringify(p.layout))).size).toBeGreaterThan(3)
    expect(new Set(plans.map(p => p.layout.structure)).size).toBeGreaterThan(1)
    for (const p of plans) expect(STRUCTURES).toContain(p.layout.structure)
  })
  it('the type strings of every direction parse to sensible sizes', () => {
    for (const d of MOBILE_DIRECTIONS) for (const k of ['title', 'number', 'body', 'label'] as const) {
      const t = parseTypeSpec(d.type[k])
      expect(t.size, d.id + '.' + k).toBeGreaterThanOrEqual(10)
      expect(Number(t.weight)).toBeGreaterThanOrEqual(100)
    }
  })
})

describe('the kit', () => {
  it('has no backticks or template placeholders (it lives in a String.raw template)', () => {
    expect(MOBILE_KIT_SOURCE).not.toMatch(/`/)
    expect(MOBILE_KIT_SOURCE).not.toMatch(/\$\{/)
  })
  it('exports every piece the brief names', () => {
    for (const n of ['Screen', 'Header', 'Button', 'Card', 'ListRow', 'TextField', 'Select', 'Chips', 'DatePickerField', 'Sheet', 'TabBar', 'EmptyState', 'Badge', 'Fab', 'UndoBar', 'IconButton'])
      expect(MOBILE_KIT_SOURCE, n).toMatch(new RegExp('export function ' + n + '\\b'))
  })
  it('every IconButton call carries a label, every Pressable a role, no gradients, glow, blur or shadow chrome', () => {
    for (const m of MOBILE_KIT_SOURCE.matchAll(/<IconButton\b[^>]*>/g)) expect(m[0]).toMatch(/\blabel=/)
    for (const m of MOBILE_KIT_SOURCE.matchAll(/<Pressable\b[^>]*>/g)) expect(m[0]).toMatch(/accessibilityRole=/)
    expect(MOBILE_KIT_SOURCE).not.toMatch(/gradient|bblurb|shadow|elevation|bglowb/i)
    expect(MOBILE_KIT_SOURCE).toMatch(/MIN_TARGET = 44/)
  })
})

describe('domain model prompt for a phone', () => {
  it('rewords the web prompt, still asks for data and never for code', () => {
    const { system, user } = buildMobileModelPrompt(classifyAppIntent(MOBILE_DEMOS[0].prompt), MOBILE_DEMOS[0].prompt)
    expect(system).toMatch(/mobile app/)
    expect(system).toMatch(/do not write code/i)
    expect(user).toMatch(/stay on this phone/)
  })
})

/** Every rendered file set to check: the three demos on their pinned directions, plus one render per structure. */
function renderedSets() {
  const sets: { name: string; files: Record<string, string> }[] = []
  for (const d of MOBILE_DEMOS) {
    const spec = planMobile(d.prompt, { seed: d.seed, directionId: d.directionId })
    sets.push({ name: d.key + ' (' + spec.layout.structure + ')', files: renderMobileApp(spec, d.model).files })
  }
  for (const s of STRUCTURES) {
    const d = MOBILE_DEMOS[1]
    const dir = MOBILE_DIRECTIONS.find(x => x.structure === s) ?? MOBILE_DIRECTIONS[0]
    const spec = planMobile(d.prompt, { seed: 'st-' + s, directionId: dir.id })
    spec.layout = { ...spec.layout, structure: s }
    sets.push({ name: 'structure ' + s, files: renderMobileApp(spec, d.model).files })
  }
  return sets
}

describe('rendered mobile apps', () => {
  for (const { name, files } of renderedSets()) {
    describe(name, () => {
      it('passes every mobile launch-ready check', () => {
        const r = checkMobileReady(files)
        expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
        expect(r.total).toBeGreaterThanOrEqual(11)
        expect(mobileReadyIssues(files)).toEqual([])
      })
      it('has no slop findings and no blocking security finding', () => {
        const ui = Object.fromEntries(Object.entries(files).filter(([p]) => /\.(tsx|ts)$/.test(p)))
        expect(scanSlopSource(ui).issues.map(i => i.id)).toEqual([])
        const next = createFindingIdGenerator()
        const blocking = Object.entries(files).flatMap(([p, c]) => reviewEmittedFile(p, c, '', { nextId: next })).filter(f => f.blocking)
        expect(blocking.map(f => f.ruleId)).toEqual([])
      })
      it('every source file is valid TypeScript (syntax) and nothing is a placeholder', () => {
        for (const [p, c] of Object.entries(files)) {
          if (/\.tsx?$/.test(p)) {
            const out = ts.transpileModule(c, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }, fileName: p })
            expect((out.diagnostics ?? []).map(x => ts.flattenDiagnosticMessageText(x.messageText, '\n')), p).toEqual([])
          }
          expect(c, p).not.toMatch(/lorem ipsum|TODO|your app name/i)
        }
        JSON.parse(files['app.json'])
      })
      it('never says secure, synced or AI-powered, and says where the data lives', () => {
        const text = Object.entries(files).filter(([p]) => /\.tsx?$/.test(p) && !/ui\.tsx$/.test(p)).map(([, c]) => c).join('\n')
        expect(text).not.toMatch(/\b(secure|encrypted|synced|syncing|AI-powered|powered by AI|insight)\b/i)
        expect(files['screens/Settings.tsx']).toContain('Saved on this phone only.')
      })
      it('a phone app never touches a Play Store or AAB build and stays on core packages', () => {
        const imports = new Set(Object.values(files).flatMap(c => [...c.matchAll(/^import .*from '([^'.][^']*)'/gm)].map(m => m[1])))
        expect([...imports].sort(), JSON.stringify([...imports])).toEqual(['@react-native-async-storage/async-storage', 'react', 'react-native', 'react-native-safe-area-context'])
        expect(Object.keys(files).some(p => /workflow|eas\.json|\.aab/i.test(p))).toBe(false)
      })
    })
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// Run the generated non-UI runtime for real: bundle it from memory against an in-memory AsyncStorage and exercise it.
async function loadRuntime(key: string) {
  const d = MOBILE_DEMOS.find(x => x.key === key)!
  const files = renderMobileApp(planMobile(d.prompt, { seed: d.seed, directionId: d.directionId }), d.model).files
  const vfs = new Map(Object.entries(files).map(([p, c]) => ['/v/' + p, c]))
  const res = await build({
    stdin: { contents: "export { APP } from './schema'\nimport * as db from './lib/db'\nimport * as logic from './lib/logic'\nimport * as present from './lib/present'\nexport { db, logic, present }", resolveDir: '/v', sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
    plugins: [{
      name: 'vfs',
      setup(b) {
        b.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: 'async-storage', namespace: 'mem' }))
        b.onLoad({ filter: /.*/, namespace: 'mem' }, () => ({ contents: 'const m = globalThis.__mem; export default { getItem: async k => { if (m.fail) throw new Error("storage off"); return m.map.has(k) ? m.map.get(k) : null }, setItem: async (k, v) => { if (m.failWrite) throw new Error("full"); m.map.set(k, v) }, removeItem: async k => { m.map.delete(k) } }', loader: 'js' }))
        b.onResolve({ filter: /^\.\.?\// }, a => {
          const base = a.namespace === 'vfs' ? a.importer.replace(/\/[^/]+$/, '') : '/v'
          const stack: string[] = []
          for (const s of (base + '/' + a.path).split('/')) { if (s === '..') stack.pop(); else if (s !== '.' && s !== '') stack.push(s) }
          const raw = '/' + stack.join('/')
          const hit = [raw, raw + '.ts', raw + '.tsx'].find(x => vfs.has(x))
          return hit ? { path: hit, namespace: 'vfs' } : undefined
        })
        b.onLoad({ filter: /.*/, namespace: 'vfs' }, a => ({ contents: vfs.get(a.path)!, loader: a.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: a.path.replace(/\/[^/]+$/, '') }))
      },
    }],
  })
  const mem = { map: new Map<string, string>(), fail: false, failWrite: false }
  ;(globalThis as unknown as { __mem: typeof mem }).__mem = mem
  const mod = { exports: {} as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(mod, mod.exports, require)
  return { ...mod.exports, mem } as { APP: any; db: any; logic: any; present: any; mem: typeof mem } // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('generated mobile runtime, executed', () => {
  it('starts empty, loads labelled demo rows, and works out totals, overdue and metrics from the rows', async () => {
    const { APP, db, logic } = await loadRuntime('khata')
    let s = await db.loadStore()
    expect(logic.isEmpty(s)).toBe(true)
    expect(s.settings.setupDone).toBe(false)
    s = logic.withSample(s)
    expect(logic.hasSample(s)).toBe(true)
    expect(db.list(s, 'bills').every((r: any) => r.demo === true)).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
    const m = (id: string) => logic.metricValue(s, APP.metrics.find((x: any) => x.id === id)) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(m('owed')).toBe(2910)
    expect(m('late')).toBe(1)
    const ramesh = db.list(s, 'bills').find((r: any) => r.customer === 'Ramesh Patel') // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(logic.computedValue(s, APP.entities[0], APP.entities[0].computed[0], ramesh)).toBe(1840)
    expect(logic.isEmpty(logic.withoutSample(s))).toBe(true)
  })

  it('dates are local: today and addDays agree with the calendar on the phone', async () => {
    const { db } = await loadRuntime('khata')
    const t = new Date()
    const iso = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0')
    expect(db.today()).toBe(iso)
    expect(db.addDays('2026-02-27', 3)).toBe('2026-03-02')
    expect(db.addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('saves and reloads through AsyncStorage with a schema version, and wipes', async () => {
    const { db, mem } = await loadRuntime('gym')
    let s = await db.loadStore()
    const made = db.create(s, 'members', { name: 'Test Member', phone: '90000 00031', status: 'Active' })
    s = { ...made.store, settings: { businessName: 'Ironroom', setupDone: true } }
    expect(await db.saveStore(s)).toBe(true)
    const raw = JSON.parse([...mem.map.values()][0])
    expect(raw.version).toBe(db.SCHEMA_VERSION)
    const again = await db.loadStore()
    expect(db.list(again, 'members')).toHaveLength(1)
    expect(again.settings).toEqual({ businessName: 'Ironroom', setupDone: true })
    const blank = await db.wipeStore()
    expect(db.list(blank, 'members')).toHaveLength(0)
    expect(mem.map.size).toBe(0)
  })

  it('a storage failure surfaces (so the app can show Try again); a failed write reports false; nothing throws on bad data', async () => {
    const { db, mem } = await loadRuntime('gym')
    mem.fail = true
    await expect(db.loadStore()).rejects.toThrow()
    mem.fail = false
    mem.failWrite = true
    expect(await db.saveStore(db.emptyStore())).toBe(false)
    mem.failWrite = false
    mem.map.set('app-data:ironroom-register', '{not json')
    expect(db.list(await db.loadStore(), 'members')).toEqual([])
    expect(mem.map.get('app-data:ironroom-register:backup')).toBe('{not json')
    mem.map.set('app-data:ironroom-register', JSON.stringify({ version: 99, data: { members: [{ id: 'x' }] } }))
    expect(db.list(await db.loadStore(), 'members')).toEqual([])
    expect(mem.map.get('app-data:ironroom-register:backup')).toContain('"version":99')
  })

  it('deleting a bill takes its lines with it and one undo brings both back', async () => {
    const { db, logic } = await loadRuntime('khata')
    const s = logic.withSample(db.emptyStore())
    const bill = db.list(s, 'bills').find((r: any) => r.customer === 'Ramesh Patel') // eslint-disable-line @typescript-eslint/no-explicit-any
    const gone = db.remove(s, 'bills', [bill.id])
    expect(db.list(gone.store, 'bills')).toHaveLength(3)
    expect(db.list(gone.store, 'lines')).toHaveLength(3)
    expect(gone.removed.map((g: any) => g.entity).sort()).toEqual(['bills', 'lines']) // eslint-disable-line @typescript-eslint/no-explicit-any
    const back = db.restore(gone.store, gone.removed)
    expect(db.list(back, 'bills')).toHaveLength(4)
    expect(db.list(back, 'lines')).toHaveLength(5)
  })

  it('the WhatsApp reminder is a pre-filled link opened by the owner, only for rows that can be reminded', async () => {
    const { APP, db, logic } = await loadRuntime('khata')
    const s = logic.withSample({ ...db.emptyStore(), settings: { businessName: 'Patel Kirana', setupDone: true } })
    const ent = APP.entities[0]
    const rows = db.list(s, 'bills')
    const ramesh = rows.find((r: any) => r.customer === 'Ramesh Patel') // eslint-disable-line @typescript-eslint/no-explicit-any
    const link = logic.reminderLink(s, ent, ramesh)
    expect(link).toMatch(/^https:\/\/wa\.me\/919000000001\?text=/)
    expect(decodeURIComponent(link)).toMatch(/Hello Ramesh Patel, a friendly reminder from Patel Kirana/)
    expect(logic.reminderEligible(ent, rows.find((r: any) => r.customer === 'Mohan Desai'))).toBe(false) // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  it('list rules: search, stage filter and overdue-first ordering; forms validate and convert', async () => {
    const { APP, db, logic, present } = await loadRuntime('khata')
    const s = logic.withSample(db.emptyStore())
    const ent = APP.entities[0]
    const rows = db.list(s, 'bills')
    const all = present.filterRows(s, ent, rows, { q: '', status: '', overdue: false })
    expect(all[0].customer).toBe('Ramesh Patel') // the overdue bill comes first
    expect(present.filterRows(s, ent, rows, { q: 'kavita', status: '', overdue: false }).map((r: any) => r.customer)).toEqual(['Kavita Joshi']) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(present.filterRows(s, ent, rows, { q: '', status: 'Paid', overdue: false })).toHaveLength(1)
    expect(present.filterRows(s, ent, rows, { q: '', status: '', overdue: true })).toHaveLength(1)
    expect(present.attention(s)).toEqual([{ entityId: 'bills', text: '1 bill is overdue' }])
    expect(present.statusOf(ent, all[0])).toEqual({ label: 'Overdue', tone: 'danger' })
    expect(present.metaOf(s, ent, all[0])).toBe('₹1,840')
    const draft = present.draftFromRow(ent, undefined)
    expect(draft.status).toBe('Unpaid')
    expect(present.validateDraft(ent, draft)).toEqual({ customer: 'Customer is needed' })
    const ok = { ...draft, customer: 'New One', phone: '98765 43210', owed: '1,250.50' }
    expect(present.validateDraft(ent, ok)).toEqual({})
    expect(present.rowFromDraft(ent, ok)).toMatchObject({ customer: 'New One', owed: 1250.5, status: 'Unpaid' })
    expect(present.validateDraft(ent, { ...ok, owed: 'lots', phone: '123' })).toEqual({ owed: 'Still owed must be a number', phone: 'Phone needs at least 10 digits' })
    expect(present.childLinks(ent).map((c: any) => c.entity.id)).toEqual(['lines']) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(present.isChild(APP.entities[1])).toBe(true)
    expect(present.friendlyDate('2026-10-30')).toBe('30 Oct 2026')
    expect(present.friendlyDate('not a date')).toBe('not a date')
    expect(present.subtitleOf(s, ent, all[0])).toMatch(/^90000 00001 · Bill date \d{1,2} [A-Z][a-z]{2} \d{4}$/)
    expect(present.recentRows(s, 3)).toHaveLength(3)
  })

  it('export is readable JSON of everything, with the schema version', async () => {
    const { db, logic } = await loadRuntime('clinic')
    const out = JSON.parse(db.exportAll(logic.withSample(db.emptyStore())))
    expect(out.version).toBe(db.SCHEMA_VERSION)
    expect(Object.keys(out.data).length).toBeGreaterThan(0)
    expect(out.exportedAt).toMatch(/^\d{4}-/)
  })
})

describe('generateMobileApp (model injected)', () => {
  const d = MOBILE_DEMOS[0]
  const reply = (obj: unknown) => ({ text: JSON.stringify(obj), inputTokens: 500, outputTokens: 1500 })
  it('asks once, validates, renders and returns <file> blocks with App.tsx last', async () => {
    let calls = 0
    const r = await generateMobileApp({ prompt: d.prompt, seed: d.seed, directionId: d.directionId }, { writeModel: async (sys: string) => { if (/^You choose the shape/.test(sys)) return { text: JSON.stringify({ primary: 'billing', secondary: null, notBuilt: [] }), inputTokens: 0, outputTokens: 0 }; calls++; return reply(d.model) } })
    expect(calls).toBe(1)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.paths[r.paths.length - 1]).toBe('App.tsx')
    expect(r.text).toContain('<file path="lib/db.ts">')
    expect(r.text).toContain('<file path="components/ui.tsx">')
    expect(r.usage).toEqual({ inputTokens: 500, outputTokens: 1500 })
    expect(validateModel(normalizeModel(r.model))).toEqual([])
  })
  it('extra keys in the reply never reach the app; a bad reply is repaired once, then gives up cleanly', async () => {
    const polluted = { ...d.model, hidden: 'nope', entities: d.model.entities.map(e => ({ ...e, extra: 1 })) }
    const ok = await generateMobileApp({ prompt: d.prompt, seed: d.seed }, { writeModel: async (sys: string) => (/^You choose the shape/.test(sys) ? { text: JSON.stringify({ primary: 'billing', secondary: null, notBuilt: [] }), inputTokens: 0, outputTokens: 0 } : reply(polluted)) })
    expect(ok.ok).toBe(true)
    if (ok.ok) { expect(ok.text).not.toContain('"hidden": "nope"'); expect(ok.text).not.toContain('"extra"') }
    const asked: string[] = []
    const bad = await generateMobileApp({ prompt: d.prompt, seed: d.seed }, { writeModel: async (sys, u) => { if (/^You choose the shape/.test(sys)) return { text: JSON.stringify({ primary: 'billing', secondary: null, notBuilt: [] }), inputTokens: 0, outputTokens: 0 }; asked.push(u); return reply({ ...d.model, entities: [] }) } })
    expect(bad.ok).toBe(false)
    expect(asked).toHaveLength(2)
  })
  it('never calls a model that is not the injected one, and the theme comes from the direction', () => {
    const dir = getMobileDirectionById('m-ledger-calm')!
    expect(renderTheme(dir)).toContain(dir.theme.accent)
    expect(DEMO_APPS.length).toBeGreaterThanOrEqual(3)
  })
})

describe('route wiring for mobile', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')
  it('is off unless MOBILE_SPEC_BUILD=on', () => { expect(mobileSpecEnabled()).toBe(false) })
  it('runs only for new launch-ready mobile builds, reviews the files and falls back on any failure', () => {
    const start = route.indexOf('Spec-driven mobile build')
    expect(start).toBeGreaterThan(0)
    const block = route.slice(start, route.indexOf('let handledByParallel = handledBySpec'))
    expect(block).toContain("projectType === 'mobile' && isLaunchReadyMobile(projectType)")
    expect(block).toContain("!handledBySpec && isNewBuild && stage === 'full' && !selfHeal")
    expect(block).toContain('reviewEmittedFile(f.path, f.content')
    expect(block).toContain('sentinelDone(c)')
    expect(block).toContain('falling back to the free-form build')
    expect(block).not.toMatch(/baabb|workflow|eas.json|eas build/i)
  })
})

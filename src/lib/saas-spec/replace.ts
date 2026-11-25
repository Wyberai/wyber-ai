// Replace-your-SaaS on the shared spec core. An internal tool for the owner: no marketing site, no billing, no sign-up. The features of the product being
// replaced (the replacement checklist in the hand-off brief) become screens through the app-spec runtime. A coverage check built on checkReplacement
// (src/lib/byos/acceptance.ts) proves every listed feature has a screen BEFORE anything is rendered, so the free repair pass has nothing left to find.

import { askForJson } from '../build-spec/ask'
import type { ModelCall, ModelReply } from '../build-spec/types'
import { buildModelPrompt, normalizeModel, validateModel } from '../app-spec/model'
import { classifyAppIntent } from '../app-spec/intents'
import { planApp } from '../app-spec/plan'
import { renderApp, type ExtraPage } from '../app-spec/render'
import type { AppModel, AppSpec } from '../app-spec/types'
import { checkReplacement, isReplacementBrief } from '../byos/acceptance'
import { currencyFor, toFileBlocks } from './generate'
import type { ReplaceFeature } from './types'

export interface BriefFeature { module: string; name: string; description: string; simplified: boolean; note?: string }
export interface ReplacementBrief { product: string; category: string; features: BriefFeature[]; needsServices: boolean }

/** Reads the hand-off brief composed by composeBuildPrompt (src/lib/byos/quote.ts). Returns null for anything that is not a replacement brief. */
export function parseReplacementBrief(prompt: string): ReplacementBrief | null {
  if (!isReplacementBrief(prompt)) return null
  const head = /internal ([\s\S]*?) tool to replace ([\s\S]+?)\. It must do ONLY/.exec(prompt)
  if (!head) return null
  const start = prompt.indexOf('Features to build:')
  if (start < 0) return null
  const features: BriefFeature[] = []
  for (const raw of prompt.slice(start + 'Features to build:'.length).split('\n')) {
    if (!raw.trim()) { if (features.length) break; continue }
    if (!raw.startsWith('- ')) break
    let line = raw.slice(2).trim()
    let simplified = false
    let note: string | undefined
    const s1 = / \(build a simplified version: (.*)\)$/.exec(line)
    if (s1) { simplified = true; note = s1[1]; line = line.slice(0, s1.index) }
    else if (/ \(simplified version\)$/.test(line)) { simplified = true; line = line.replace(/ \(simplified version\)$/, '') }
    const m = /^([^:]+): (.+?)(?: — (.*))?$/.exec(line)
    if (!m) continue
    features.push({ module: m[1].trim(), name: m[2].trim(), description: (m[3] ?? '').trim(), simplified, note })
  }
  if (features.length === 0) return null
  return { product: head[2].trim(), category: head[1].trim(), features, needsServices: /Outside services:/.test(prompt) }
}

const q = (s: string) => JSON.stringify(s)

/** src/replacement-checklist.ts in the exact shape parseChecklist reads: name, status, note per feature. */
export function renderChecklistTs(features: ReplaceFeature[]): string {
  return `// What the tool being replaced did, and what this tool does about each feature. "built" means there is a screen; "simplified" says what was cut.
export interface ReplacementFeature { name: string; status: 'built' | 'simplified'; note?: string }

export const FEATURES: ReplacementFeature[] = [
${features.map(f => `  { name: ${q(f.name)}, status: ${q(f.status)}${f.note ? `, note: ${q(f.note)}` : ''} },`).join('\n')}
]
`
}

/**
 * Which listed features have a screen in this model? Built on checkReplacement: the checklist plus the labels that become screens (the navigation entries,
 * and the Home metrics) are handed to it exactly as the post-build check would read them.
 */
export function coverageOf(model: AppModel, features: ReplaceFeature[]) {
  const nav = ['Home', ...model.entities.flatMap(e => [e.label, e.singular])].map(l => `<a>${l}</a>`).join('\n')
  const home = model.metrics.map(m => `<p>${m.label}</p>`).join('\n')
  return checkReplacement({
    'src/replacement-checklist.ts': renderChecklistTs(features),
    'src/App.tsx': nav,
    'src/components/HomePage.tsx': home,
  })
}

export function buildReplacementModelPrompt(brief: ReplacementBrief, businessPrompt: string): { system: string; user: string } {
  const text = brief.features.map(f => f.name + ' ' + f.description).join(' ')
  const base = buildModelPrompt(classifyAppIntent(brief.category + ' ' + text), businessPrompt)
  const system = [
    base.system,
    `This is an internal tool the owner builds to replace ${brief.product}. It is not a product for sale: no marketing, no plans, no billing, no sign-up. It does ONLY the listed features.`,
  ].join('\n')
  const user = [
    base.user,
    `The features of ${brief.product} to replace (every one must have its own screen or number):`,
    brief.features.map(f => `- ${f.name}${f.description ? ': ' + f.description : ''}${f.simplified ? ' (a simplified version is fine)' : ''}`).join('\n'),
    'COVERAGE RULE: for each feature that is a list of things to record, make an entity whose label is the feature name or its plural, exactly as written above. For each feature that is a report or a total, add a metric whose label is the feature name exactly. Use no other words in the label that are not in the feature name. Add nothing that is not one of these features, except fields an entity needs.',
  ].join('\n')
  return { system, user }
}

/** The problems a model reply has against the checklist: every feature must be covered, and the model itself must be valid. */
export function validateReplacementModel(raw: unknown, features: ReplaceFeature[]): string[] {
  const m = normalizeModel(raw)
  const problems = validateModel(m)
  if (problems.length) return problems
  const cov = coverageOf(m, features)
  if (!cov) return ['coverage: the checklist could not be read']
  return cov.missing.map(n => `coverage: the feature "${n}" has no screen. Name an entity (a list screen) or a metric exactly "${n}".`)
}

const COVERAGE_TSX = (rows: { name: string; status: string; note: string; screen: string; view: string }[], product: string) => `import { ArrowRight } from 'lucide-react'
import { Badge, Button, Card } from '../wyber-ui'
import type { Api } from './api'

// What ${product.replace(/[`$\\]/g, '')} did, and where each part lives here. This page lists only what this tool really has: a "Simplified" label says what was cut.
const ROWS: { name: string; status: 'Built' | 'Simplified'; note: string; screen: string; view: string }[] = ${JSON.stringify(rows.map(r => ({ ...r, status: r.status === 'built' ? 'Built' : 'Simplified' })), null, 2)}

export default function CoveragePage({ api }: { api: Api }) {
  const built = ROWS.filter(r => r.status === 'Built').length
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Replacement</h1>
        <p className="mt-1 text-sm text-muted-foreground">{built + ' of ' + ROWS.length + ' features are built as listed. The rest are simplified, and the note says what is cut. This reads what the tool contains; it does not prove the numbers match your old tool, which is what the parallel run is for.'}</p>
      </header>
      <Card className="divide-y divide-border p-0">
        {ROWS.map(r => (
          <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.status === 'Simplified' ? 'Simplified: ' + (r.note || 'a smaller version') : 'Built'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'Built' ? 'default' : 'outline'}>{r.status}</Badge>
              <Button size="sm" variant="outline" onClick={() => api.go(r.view)}>{r.screen}<ArrowRight size={16} aria-hidden="true" /></Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
`

export const CUTOVER_TSX = String.raw`import { useEffect, useState } from 'react'
import { Card, Input } from '../wyber-ui'
import { APP } from '../schema'
import type { Api } from './api'

const KEY = 'cutover:' + APP.id
const STEPS = [
  'Export your data from the old tool.',
  'Import it here, one list at a time (each list has an Import CSV button with a preview first).',
  'Run both for two weeks.',
  'Compare the totals every week.',
  'Switch the team over.',
  'Cancel the old plan last.',
]

type Saved = { paying: string; running: string; done: boolean[] }
const fresh = (): Saved => ({ paying: '', running: '', done: STEPS.map(() => false) })
const read = (): Saved => {
  try { const p = JSON.parse(localStorage.getItem(KEY) || 'null'); if (p && Array.isArray(p.done)) return { paying: String(p.paying || ''), running: String(p.running || ''), done: STEPS.map((_, i) => Boolean(p.done[i])) } } catch { /* unreadable */ }
  return fresh()
}

export default function CutoverPage({ api }: { api: Api }) {
  void api
  const [s, setS] = useState<Saved>(read)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage blocked */ } }, [s])
  const paying = Number(s.paying)
  const running = Number(s.running)
  const both = s.paying !== '' && s.running !== '' && Number.isFinite(paying) && Number.isFinite(running)
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Cut-over</h1>
        <p className="mt-1 text-sm text-muted-foreground">Move across without losing a week. Nothing here switches anything off by itself.</p>
      </header>
      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-foreground">What it costs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="co-paying" className="mb-1.5 block text-sm font-medium text-foreground">What you pay the old tool each month</label>
            <Input id="co-paying" inputMode="decimal" value={s.paying} onChange={e => setS({ ...s, paying: e.target.value })} />
          </div>
          <div>
            <label htmlFor="co-running" className="mb-1.5 block text-sm font-medium text-foreground">What this tool costs you each month</label>
            <Input id="co-running" inputMode="decimal" value={s.running} onChange={e => setS({ ...s, running: e.target.value })} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {both ? 'The difference is ' + APP.currency + (paying - running).toLocaleString('en-IN') + ' a month, from the two numbers you typed.' : 'Type both numbers to see the difference. Nothing is assumed.'}
        </p>
        <p className="text-xs text-muted-foreground">This tool keeps its data in this browser and uses no outside service, so the only running cost is wherever you choose to host it.</p>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-medium text-foreground">Parallel run</h2>
        <ul className="space-y-2">
          {STEPS.map((t, i) => (
            <li key={t}>
              <label className="flex items-start gap-3 text-sm text-foreground">
                <input type="checkbox" checked={s.done[i]} onChange={e => setS({ ...s, done: s.done.map((d, j) => (j === i ? e.target.checked : d)) })} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
                <span className={s.done[i] ? 'text-muted-foreground line-through' : ''}>{t}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Imports match columns by their header names, so rename a column in the export if it does not match. Rows with problems are listed before anything is saved. A migration is never assumed to be perfect: compare before you switch.</p>
      </Card>
      <Card className="space-y-2 p-5">
        <h2 className="font-medium text-foreground">If something is wrong</h2>
        <p className="text-sm text-muted-foreground">Keep using the old tool, which you have not cancelled. Export what you entered here from Privacy and data, fix the problem, and import again.</p>
      </Card>
    </div>
  )
}
`

export type ReplaceGenerateResult =
  | { ok: true; text: string; spec: AppSpec; model: AppModel; features: ReplaceFeature[]; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

const EXTRA: ExtraPage[] = [
  { id: 'replacement', label: 'Replacement', icon: 'ArrowLeftRight', file: 'components/CoveragePage', component: 'CoveragePage' },
  { id: 'cutover', label: 'Cut-over', icon: 'ClipboardCheck', file: 'components/CutoverPage', component: 'CutoverPage' },
]

export function renderReplacement(spec: AppSpec, model: AppModel, features: ReplaceFeature[], product: string, currency: string): Record<string, string> {
  const base = renderApp(spec, model, currency, EXTRA).files
  const viewOf = (name: string): { screen: string; view: string } => {
    for (const e of model.entities) {
      const r = coverageOf({ ...model, entities: [e], metrics: [] }, [{ name, status: 'built' }])
      if (r && r.present === 1) return { screen: e.label, view: e.id }
    }
    return { screen: 'Home', view: 'home' }
  }
  return {
    ...base,
    'src/replacement-checklist.ts': renderChecklistTs(features),
    'src/components/CoveragePage.tsx': COVERAGE_TSX(features.map(f => ({ name: f.name, status: f.status, note: f.note ?? '', ...viewOf(f.name) })), product),
    'src/components/CutoverPage.tsx': CUTOVER_TSX,
  }
}

/** Replace-your-SaaS build: parse the checklist from the brief, have the model write a domain model that covers it, render through the app-spec runtime. */
export async function generateReplacement(input: { prompt: string; seed: string }, deps: { write: ModelCall }): Promise<ReplaceGenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const brief = parseReplacementBrief(input.prompt)
  if (!brief) return { ok: false, reason: 'not a replacement brief', usage }
  if (brief.needsServices) return { ok: false, reason: 'the brief needs outside services, which the spec path does not build', usage }
  const features: ReplaceFeature[] = brief.features.map(f => ({ name: f.name, status: f.simplified ? 'simplified' : 'built', note: f.note }))
  let spec: AppSpec
  try { spec = planApp(brief.category + ' ' + brief.features.map(f => f.name).join(' '), { seed: input.seed }) } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  const { system, user } = buildReplacementModelPrompt(brief, input.prompt.slice(0, 1500))
  const onUsage = (r: ModelReply) => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens }
  const asked = await askForJson<AppModel>({ call: deps.write, system, user, attempts: 3, onUsage, validate: v => validateReplacementModel(v, features) })
  if (!asked.ok) return { ok: false, reason: 'model: ' + asked.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const model = normalizeModel(asked.value)
  let files: Record<string, string>
  try { files = renderReplacement(spec, model, features, brief.product, currencyFor(input.prompt)) } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }
  const { text, paths } = toFileBlocks(files)
  return { ok: true, text, spec, model, features, usage, notes: [], paths }
}

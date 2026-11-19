import { buildCopyPrompt, validateCopy, type CopyIssue } from './copy'
import { planWebsite } from './plan'
import { renderWebsite } from './render'
import type { BuildSpec, OwnerFacts, SiteCopy } from './types'

export interface ModelReply { text: string; inputTokens: number; outputTokens: number }
export interface GenerateDeps {
  /** One non-streaming model call. In production this is Sonnet; tests inject a fake. */
  writeCopy: (system: string, user: string) => Promise<ModelReply>
}
export interface GenerateInput {
  prompt: string
  /** Same id, same direction and variants. Use the project or build id. */
  seed: string
  facts?: OwnerFacts
  directionId?: string | null
  avoid?: string[]
}
export type GenerateResult =
  | { ok: true; text: string; spec: BuildSpec; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

/** Inverts factsSuffix() in website-facts.ts: "business name: X; area: Y; WhatsApp: N; opening hours: H". Nothing else is read. */
export function parseFactsFromPrompt(prompt: string): OwnerFacts {
  const m = (prompt || '').match(/Business facts to use exactly as given[^:]*:\s*([^\n]+?)\.?\s*$/m)
  if (!m) return {}
  const facts: OwnerFacts = {}
  for (const part of m[1].split(/;\s*/)) {
    const [k, ...rest] = part.split(':')
    const v = rest.join(':').trim()
    if (!v) continue
    const key = k.trim().toLowerCase()
    if (key === 'business name') facts.name = v
    else if (key === 'area') facts.city = v
    else if (key === 'whatsapp') facts.whatsapp = v.replace(/\D/g, '')
    else if (key === 'opening hours') facts.hours = v
  }
  return facts
}

/** The model is told to return one JSON object. Fenced or chatty replies are tolerated. */
export function parseJsonObject(text: string): unknown {
  const t = (text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('no JSON object in reply')
  return JSON.parse(t.slice(start, end + 1))
}

const fmt = (issues: CopyIssue[]) => issues.slice(0, 12).map(i => `- ${i.path}: ${i.message}`).join('\n')

export async function generateWebsite(input: GenerateInput, deps: GenerateDeps): Promise<GenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const notes: string[] = []
  let spec: BuildSpec
  try {
    spec = planWebsite(input.prompt, { seed: input.seed, facts: input.facts ?? parseFactsFromPrompt(input.prompt), directionId: input.directionId, avoid: input.avoid })
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)
  if (spec.brief.unsupported.length) notes.push('Not built yet: ' + spec.brief.unsupported.join(', '))

  const { system, user } = buildCopyPrompt(spec, input.prompt)
  let copy: SiteCopy | null = null
  let issues: CopyIssue[] = []
  let lastText = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ask = attempt === 0
        ? user
        : `${user}\n\nYour previous JSON had these problems:\n${fmt(issues)}\n\nPrevious JSON:\n${lastText}\n\nReturn the complete corrected JSON object only.`
      const r = await deps.writeCopy(system, ask)
      usage.inputTokens += r.inputTokens
      usage.outputTokens += r.outputTokens
      lastText = r.text
      const parsed = parseJsonObject(r.text) as SiteCopy
      issues = validateCopy(spec, parsed)
      if (issues.length === 0) { copy = parsed; break }
    } catch (e) {
      issues = [{ path: 'reply', message: String(e).slice(0, 160) }]
    }
  }
  if (!copy) return { ok: false, reason: 'copy: ' + fmt(issues), usage }

  let files: Record<string, string>
  try { files = renderWebsite(spec, copy).files } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }

  // Entry file last, like the sequential path, so a cut-off never loses it.
  const order = Object.keys(files).sort((a, b) => (a === 'src/App.tsx' ? 1 : 0) - (b === 'src/App.tsx' ? 1 : 0))
  const text = order.map(p => `[progress: Wrote ${p}]\n<file path="${p}">\n${files[p]}\n</file>\n`).join('')
  return { ok: true, text, spec, usage, notes, paths: order }
}

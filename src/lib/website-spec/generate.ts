import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt } from '../build-spec/facts'
import type { ModelCall, ModelReply } from '../build-spec/types'
import { buildCopyPrompt, validateCopy } from './copy'
import { planWebsite } from './plan'
import { renderWebsite, type Translations } from './render'
import { buildTranslatePrompt, completeTranslation, translatable, validateTranslation } from './translate'
import type { BuildSpec, LangId, OwnerFacts, SiteCopy } from './types'

// Kept so existing imports keep working; the implementations live in the shared core (src/lib/build-spec).
export { parseFactsFromPrompt, parseFactsSuffix } from '../build-spec/facts'
export { parseJsonObject } from '../build-spec/json'
export type { ModelReply }

export interface GenerateDeps {
  /** One non-streaming model call. In production this is Sonnet; tests inject a fake. */
  writeCopy: ModelCall
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

const TRANSLATE_TIMEOUT_MS = 70000

export async function generateWebsite(input: GenerateInput, deps: GenerateDeps): Promise<GenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const onUsage = (r: ModelReply) => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens }
  const notes: string[] = []
  let spec: BuildSpec
  try {
    spec = planWebsite(input.prompt, { seed: input.seed, facts: input.facts ?? parseFactsFromPrompt(input.prompt), directionId: input.directionId, avoid: input.avoid })
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)
  if (spec.brief.unsupported.length) notes.push('Not built yet: ' + spec.brief.unsupported.join(', '))

  const { system, user } = buildCopyPrompt(spec, input.prompt)
  const written = await askForJson<SiteCopy>({
    call: deps.writeCopy, system, user, onUsage,
    validate: v => validateCopy(spec, v as SiteCopy).map(i => `${i.path}: ${i.message}`),
  })
  if (!written.ok) return { ok: false, reason: 'copy: ' + written.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const copy = written.value

  // Other languages: written by the same model, checked for shape, best effort. A language that fails is left out and the site
  // still ships in English (and any remaining languages); the launch-ready language check then raises it for the free repair pass.
  const translations: Translations = {}
  const others = (spec.languages ?? ['en']).filter((l): l is Exclude<LangId, 'en'> => l !== 'en')
  if (others.length) {
    const base = translatable(spec, copy)
    await Promise.all(others.map(async lang => {
      const p = buildTranslatePrompt(spec, copy, lang)
      const t = await askForJson<SiteCopy>({
        call: deps.writeCopy, system: p.system, user: p.user, onUsage, timeoutMs: TRANSLATE_TIMEOUT_MS,
        validate: v => validateTranslation(spec, base, v),
      })
      if (t.ok) translations[lang] = completeTranslation(spec, copy, t.value)
      else notes.push(lang + ' translation skipped: ' + t.problems.slice(0, 2).join('; '))
    }))
  }

  let files: Record<string, string>
  try { files = renderWebsite(spec, copy, translations).files } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }

  // Entry file last, like the sequential path, so a cut-off never loses it.
  const order = Object.keys(files).sort((a, b) => (a === 'src/App.tsx' ? 1 : 0) - (b === 'src/App.tsx' ? 1 : 0))
  const text = order.map(p => `[progress: Wrote ${p}]\n<file path="${p}">\n${files[p]}\n</file>\n`).join('')
  return { ok: true, text, spec, usage, notes, paths: order }
}

import { scrubClaims } from '../build-spec/claims'
import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import { buildLanguagePrompt, languagesFromReply, validateLanguageReply } from '../build-spec/languages'
import type { ModelCall, ModelReply } from '../build-spec/types'
import { buildCopyPrompt, normalizeCopy, validateCopy } from './copy'
import { resolveLook } from '../build-spec/look'
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
/** A little under the route's 220 s spec timeout (WEBSITE_SPEC_TIMEOUT_MS), leaving room to render. */
const TOTAL_BUDGET_MS = 200000

export async function generateWebsite(input: GenerateInput, deps: GenerateDeps): Promise<GenerateResult> {
  const t0 = Date.now()
  const usage = { inputTokens: 0, outputTokens: 0 }
  const onUsage = (r: ModelReply) => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens }
  const notes: string[] = []
  let spec: BuildSpec
  try {
    // The art director decides how this business should look; a direction the owner chose in Plan Mode is never overridden.
    const art = input.directionId ? null : await resolveLook(stripFactsSuffix(input.prompt), input.seed, 'website', deps.writeCopy, onUsage, { named: !!(input.facts ?? parseFactsFromPrompt(input.prompt)).name, avoid: input.avoid })
    if (!art) notes.push('look: kept the keyword choice')
    spec = planWebsite(input.prompt, { seed: input.seed, facts: input.facts ?? parseFactsFromPrompt(input.prompt), directionId: art?.directionId ?? input.directionId, avoid: input.avoid, look: art?.look })
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)
  if (spec.brief.unsupported.length) notes.push('Not built yet: ' + spec.brief.unsupported.join(', '))

  // The model decides the language toggles from the whole brief (a place list cannot know that a Nagpur business may want Marathi and
  // Hindi, or that an export brand wants none). The rule-based answer from the plan stays as the fallback if the call fails.
  // It runs while the copy is being written, so it adds no waiting time (the spec path has a fixed time budget).
  let langPromise: Promise<{ ok: true; value: { languages: string[] } } | { ok: false; problems: string[] }> | null = null
  if (!/\b(english only|only in english|no hindi|no translation)\b/i.test(input.prompt)) {
    const lp = buildLanguagePrompt(stripFactsSuffix(input.prompt) + (spec.brief.facts.city ? `\nCity: ${spec.brief.facts.city}` : ''))
    langPromise = askForJson<{ languages: string[] }>({ call: deps.writeCopy, system: lp.system, user: lp.user, onUsage, timeoutMs: 20000, attempts: 1, validate: validateLanguageReply })
  }

  const { system, user } = buildCopyPrompt(spec, stripFactsSuffix(input.prompt))
  const written = await askForJson<SiteCopy>({ scrub: scrubClaims,
    call: deps.writeCopy, system, user, onUsage,
    validate: v => validateCopy(spec, v as SiteCopy).map(i => `${i.path}: ${i.message}`),
  })
  if (!written.ok) return { ok: false, reason: 'copy: ' + written.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const copy = normalizeCopy(spec, written.value)
  const chosen = langPromise ? await langPromise : null
  if (chosen?.ok) spec.languages = languagesFromReply(chosen.value)
  else if (chosen) notes.push('languages: kept the rule-based choice')

  // Other languages: written by the same model, checked for shape, best effort. A language that fails is left out and the site
  // still ships in English (and any remaining languages); the launch-ready language check then raises it for the free repair pass.
  const translations: Translations = {}
  const others = (spec.languages ?? ['en']).filter((l): l is Exclude<LangId, 'en'> => l !== 'en')
  // The spec path runs inside a fixed time budget (the route abandons it and falls back to the free-form build when it is exceeded), so
  // translations only get what is left of it: a slow copy step must cost a language, never the whole spec build.
  const left = TOTAL_BUDGET_MS - (Date.now() - t0)
  if (others.length && left < 30000) notes.push(others.join(", ") + " translation skipped: not enough time left")
  if (others.length && left >= 30000) {
    const base = translatable(spec, copy)
    await Promise.all(others.map(async lang => {
      const p = buildTranslatePrompt(spec, copy, lang)
      const t = await askForJson<SiteCopy>({
        call: deps.writeCopy, system: p.system, user: p.user, onUsage, timeoutMs: Math.min(TRANSLATE_TIMEOUT_MS, left - 10000), attempts: left > 130000 ? 2 : 1,
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

import { scrubClaims } from '../build-spec/claims'
import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import type { ModelCall } from '../build-spec/types'
import { buildIntentPrompt, validateIntentChoice, type AppIntentChoice } from './intents'
import { buildModelPrompt, normalizeModel, validateModel } from './model'
import { planApp } from './plan'
import { renderApp } from './render'
import type { AppModel, AppSpec, OwnerFacts } from './types'

export interface AppGenerateInput { prompt: string; seed: string; facts?: OwnerFacts; directionId?: string | null; avoid?: string[] }
export type AppGenerateResult =
  | { ok: true; text: string; spec: AppSpec; model: AppModel; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

import { isIndianPrompt } from '../build-spec/locale'

export async function generateApp(input: AppGenerateInput, deps: { writeModel: ModelCall }): Promise<AppGenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const notes: string[] = []
  let spec: AppSpec
  try {
    spec = planApp(input.prompt, { seed: input.seed, facts: input.facts ?? parseFactsFromPrompt(input.prompt), directionId: input.directionId, avoid: input.avoid })
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)

  // The model reads the whole brief and chooses the shape (a keyword count let "invoice" and "GST" outweigh "job cards" and dropped the
  // job board). It also lists what this kind of app cannot do, so the owner is told. The keyword result stays as the fallback.
  const ip = buildIntentPrompt(stripFactsSuffix(input.prompt))
  const choice = await askForJson<AppIntentChoice>({
    call: deps.writeModel, system: ip.system, user: ip.user, attempts: 1, timeoutMs: 25000,
    onUsage: r => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens },
    validate: validateIntentChoice,
  })
  if (choice.ok) {
    spec.brief = { ...spec.brief, intent: choice.value.primary, secondary: choice.value.secondary ?? undefined, notBuilt: choice.value.notBuilt, note: undefined }
    spec.blueprint = choice.value.primary
  } else notes.push('shape: kept the keyword choice')

  const { system, user } = buildModelPrompt({ ...spec.brief }, stripFactsSuffix(input.prompt))
  const asked = await askForJson<AppModel>({ scrub: scrubClaims,
    call: deps.writeModel, system, user, attempts: 2,
    onUsage: r => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens },
    validate: v => validateModel(normalizeModel(v)),
  })
  if (!asked.ok) return { ok: false, reason: 'model: ' + asked.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const model = normalizeModel(asked.value)

  let files: Record<string, string>
  try { files = renderApp(spec, model, isIndianPrompt(input.prompt) ? '₹' : '$').files } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }
  const order = Object.keys(files).sort((a, b) => (a === 'src/App.tsx' ? 1 : 0) - (b === 'src/App.tsx' ? 1 : 0))
  const text = order.map(p => '[progress: Wrote ' + p + ']\n<file path="' + p + '">\n' + files[p] + '\n</file>\n').join('')
  return { ok: true, text, spec, model, usage, notes, paths: order }
}

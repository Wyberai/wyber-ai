import { scrubClaims } from '../build-spec/claims'
import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import type { ModelCall } from '../build-spec/types'
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

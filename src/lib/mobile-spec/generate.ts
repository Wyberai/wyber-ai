import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import type { ModelCall } from '../build-spec/types'
import { buildModelPrompt, normalizeModel, validateModel } from '../app-spec/model'
import type { AppIntentBrief } from '../app-spec/intents'
import type { AppModel, OwnerFacts } from '../app-spec/types'
import { planMobile, type MobileSpec } from './plan'
import { renderMobileApp } from './render'

export interface MobileGenerateInput { prompt: string; seed: string; facts?: OwnerFacts; directionId?: string | null }
export type MobileGenerateResult =
  | { ok: true; text: string; spec: MobileSpec; model: AppModel; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

import { isIndianPrompt } from '../build-spec/locale'

/** The web app's model prompt, reworded for a phone: short labels, records stay on the phone. The model still writes data only, never code. */
export function buildMobileModelPrompt(brief: AppIntentBrief, businessPrompt: string): { system: string; user: string } {
  const p = buildModelPrompt(brief, businessPrompt)
  return {
    system: p.system.replace('small business web app', 'small business mobile app (Android and iOS)'),
    user: p.user + '\nThis is a phone app. Keep labels short (they sit on a small screen), keep a row to a title, one or two details and a status, and write homeIntro so it says the records stay on this phone. Do not mention a computer, a browser or a website.',
  }
}

export async function generateMobileApp(input: MobileGenerateInput, deps: { writeModel: ModelCall }): Promise<MobileGenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const notes: string[] = []
  const facts = input.facts ?? parseFactsFromPrompt(input.prompt)
  let spec: MobileSpec
  try {
    spec = planMobile(stripFactsSuffix(input.prompt), { seed: input.seed, facts, directionId: input.directionId })
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)

  const { system, user } = buildMobileModelPrompt(spec.brief, stripFactsSuffix(input.prompt))
  const asked = await askForJson<AppModel>({
    call: deps.writeModel, system, user, attempts: 2,
    onUsage: r => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens },
    validate: v => validateModel(normalizeModel(v)),
  })
  if (!asked.ok) return { ok: false, reason: 'model: ' + asked.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const model = normalizeModel(asked.value)

  let files: Record<string, string>
  try { files = renderMobileApp(spec, model, isIndianPrompt(input.prompt) ? '₹' : '$', { name: facts.name, email: facts.email }).files } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }
  const order = Object.keys(files).sort((a, b) => (a === 'App.tsx' ? 1 : 0) - (b === 'App.tsx' ? 1 : 0))
  const text = order.map(p => '[progress: Wrote ' + p + ']\n<file path="' + p + '">\n' + files[p] + '\n</file>\n').join('')
  return { ok: true, text, spec, model, usage, notes, paths: order }
}

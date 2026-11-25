import { scrubClaims } from '../build-spec/claims'
import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import type { ModelCall } from '../build-spec/types'
import { chooseShape } from './choose'
import { askLookBrief, drawLook } from '../build-spec/look'
import { claimUnique, designKey, wantsSameDesign, type DesignRegistry } from '../build-spec/design-registry'
import { buildModelPrompt, normalizeModel, validateModel } from './model'
import { planApp } from './plan'
import { renderApp } from './render'
import type { AppModel, AppSpec, OwnerFacts } from './types'

export interface AppGenerateInput { prompt: string; seed: string; facts?: OwnerFacts; directionId?: string | null; avoid?: string[] }
export type AppGenerateResult =
  | { ok: true; text: string; spec: AppSpec; model: AppModel; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

import { isIndianPrompt } from '../build-spec/locale'

export async function generateApp(input: AppGenerateInput, deps: { writeModel: ModelCall; designs?: DesignRegistry | null }): Promise<AppGenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const notes: string[] = []
  let spec: AppSpec
  try {
    const facts = input.facts ?? parseFactsFromPrompt(input.prompt)
    const lookBrief = input.directionId ? null : await askLookBrief(stripFactsSuffix(input.prompt), 'app', deps.writeModel, r => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens })
    if (!lookBrief && !input.directionId) notes.push('look: kept the keyword choice')
    // THE RULE: a design that exists is never built again unless the user asked for exactly that.
    const sameOnPurpose = Boolean(input.directionId) || wantsSameDesign(input.prompt)
    const picked = await claimUnique({
      seed: input.seed, registry: sameOnPurpose ? null : deps.designs, owner: input.seed,
      build: seed => {
        const art = lookBrief ? drawLook(lookBrief, seed, 'app', { named: true, avoid: input.avoid }) : null
        return planApp(input.prompt, { seed, facts, directionId: art?.directionId ?? input.directionId, avoid: input.avoid, look: art?.look })
      },
      keyOf: s => designKey({ directionId: s.direction.id, look: s.look, layout: Object.values(s.layout).join('.') }),
      directionOf: s => s.direction.id,
    })
    if (!picked.unique) notes.push('design: every draw was already taken, the last one was used')
    spec = picked.value
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }
  if (spec.brief.note) notes.push(spec.brief.note)

  // The model reads the whole brief and chooses the shape (a keyword count let "invoice" and "GST" outweigh "job cards" and dropped the
  // job board). It also lists what this kind of app cannot do, so the owner is told. The keyword result stays as the fallback.
  const shape = await chooseShape(stripFactsSuffix(input.prompt), deps.writeModel, r => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens }, undefined, spec.brief.facts)
  if (shape.chosen) {
    spec.brief = { ...shape.brief }
    spec.blueprint = shape.brief.intent
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

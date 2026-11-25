import { scrubClaims } from '../build-spec/claims'
import { askForJson } from '../build-spec/ask'
import { parseFactsFromPrompt, stripFactsSuffix } from '../build-spec/facts'
import type { ModelCall, ModelReply } from '../build-spec/types'
import { isIndianPrompt } from '../build-spec/locale'
import { chooseShape, SAAS_LIMITS } from '../app-spec/choose'
import { askLookBrief, drawLook } from '../build-spec/look'
import { claimUnique, designKey, wantsSameDesign, type DesignRegistry } from '../build-spec/design-registry'
import { repairLengths } from '../build-spec/trim'
import { normalizeCopy, validateCopy } from '../website-spec/copy'
import type { SiteCopy } from '../website-spec/types'
import { buildSaasCopyPrompt, buildSaasModelPrompt, normalizeSaasModel, validateSaasModel } from './model'
import { planSaas } from './plan'
import { renderSaas } from './render'
import type { OwnerFacts, SaasModel, SaasSpec } from './types'

export interface SaasGenerateInput { prompt: string; seed: string; facts?: OwnerFacts; directionId?: string | null; avoid?: string[] }
export type SaasGenerateResult =
  | { ok: true; text: string; spec: SaasSpec; model: SaasModel; usage: { inputTokens: number; outputTokens: number }; notes: string[]; paths: string[] }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

const CURRENCIES: [RegExp, string][] = [[/€|\beur(o|os)?\b/i, '€'], [/£|\bgbp\b/i, '£']]
export const currencyFor = (prompt: string): string => (isIndianPrompt(prompt) ? '₹' : CURRENCIES.find(([re]) => re.test(prompt))?.[1] ?? '$')

/** A short list of file blocks, entry file last, the same shape the website and web app pillars return. */
export function toFileBlocks(files: Record<string, string>): { text: string; paths: string[] } {
  const order = Object.keys(files).sort((a, b) => (a === 'src/App.tsx' ? 1 : 0) - (b === 'src/App.tsx' ? 1 : 0))
  return { text: order.map(p => '[progress: Wrote ' + p + ']\n<file path="' + p + '">\n' + files[p] + '\n</file>\n').join(''), paths: order }
}

/**
 * SaaS = marketing site + product + the SaaS contract. Two model calls, both data only: (1) the product model with its plans, (2) the site copy,
 * written after the first so the features describe screens that exist. Everything else is code. Any failure returns ok:false and the caller
 * falls back to the free-form build.
 */
export async function generateSaas(input: SaasGenerateInput, deps: { write: ModelCall; designs?: DesignRegistry | null }): Promise<SaasGenerateResult> {
  const usage = { inputTokens: 0, outputTokens: 0 }
  const onUsage = (r: ModelReply) => { usage.inputTokens += r.inputTokens; usage.outputTokens += r.outputTokens }
  const notes: string[] = []
  const brief = stripFactsSuffix(input.prompt)
  let spec: SaasSpec
  try {
    const facts = input.facts ?? parseFactsFromPrompt(input.prompt)
    const lookBrief = input.directionId ? null : await askLookBrief(brief, 'saas', deps.write, onUsage)
    if (!lookBrief && !input.directionId) notes.push('look: kept the keyword choice')
    // THE RULE: a design that exists is never built again unless the user asked for exactly that.
    const sameOnPurpose = Boolean(input.directionId) || wantsSameDesign(input.prompt)
    const picked = await claimUnique({
      seed: input.seed, registry: sameOnPurpose ? null : deps.designs, owner: input.seed,
      build: seed => {
        const art = lookBrief ? drawLook(lookBrief, seed, 'saas', { named: true, avoid: input.avoid }) : null
        return planSaas(input.prompt, { seed, facts, directionId: art?.directionId ?? input.directionId, avoid: input.avoid, currency: currencyFor(input.prompt), look: art?.look })
      },
      keyOf: s => designKey({ directionId: s.direction.id, look: s.look, layout: [...Object.values(s.layout), ...Object.values(s.app.layout)].join('.') }),
      directionOf: s => s.direction.id,
    })
    if (!picked.unique) notes.push('design: every draw was already taken, the last one was used')
    spec = picked.value
  } catch (e) { return { ok: false, reason: 'plan: ' + String(e), usage } }

  // The model reads the whole brief to choose what the product is for (see app-spec/choose), and says what this kind of product cannot do.
  const shape = await chooseShape(brief, deps.write, onUsage, SAAS_LIMITS)
  if (shape.chosen) spec.notBuilt = shape.brief.notBuilt
  else notes.push('shape: kept the keyword choice')
  const mp = buildSaasModelPrompt(brief, shape.brief)
  const asked = await askForJson<unknown>({ scrub: scrubClaims,
    call: deps.write, system: mp.system, user: mp.user, attempts: 2, onUsage,
    validate: v => validateSaasModel(normalizeSaasModel(v), brief),
  })
  if (!asked.ok) return { ok: false, reason: 'model: ' + asked.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const model = normalizeSaasModel(asked.value)

  const cp = buildSaasCopyPrompt(spec, brief, model)
  const written = await askForJson<SiteCopy>({ scrub: scrubClaims, prepare: v => repairLengths(v, validateCopy(spec.site, v as SiteCopy)),
    call: deps.write, system: cp.system, user: cp.user, attempts: 2, onUsage,
    validate: v => validateCopy(spec.site, v as SiteCopy).map(i => `${i.path}: ${i.message}`),
  })
  if (!written.ok) return { ok: false, reason: 'copy: ' + written.problems.slice(0, 12).map(p => '- ' + p).join('\n'), usage }
  const copy = normalizeCopy(spec.site, written.value)

  let files: Record<string, string>
  try { files = renderSaas(spec, model, copy).files } catch (e) { return { ok: false, reason: 'render: ' + String(e), usage } }
  const { text, paths } = toFileBlocks(files)
  return { ok: true, text, spec, model, usage, notes, paths }
}


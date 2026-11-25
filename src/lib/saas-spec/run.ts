import type { ModelCall } from '../build-spec/types'
import type { DesignRegistry } from '../build-spec/design-registry'
import { isReplacementBrief } from '../byos/acceptance'
import { generateSaas } from './generate'
import { generateReplacement } from './replace'

export type SaasSpecOutcome =
  | { ok: true; text: string; paths: string[]; usage: { inputTokens: number; outputTokens: number }; label: string; summary: string }
  | { ok: false; reason: string; usage: { inputTokens: number; outputTokens: number } }

/**
 * The one entry point the generate route calls for a new launch-ready SaaS build: a Replace-your-SaaS brief becomes an internal tool, anything else
 * becomes marketing site + product + SaaS contract. Never throws past the model call; any failure is an ok:false the route turns into the free-form build.
 */
export async function runSaasSpec(input: { prompt: string; seed: string; designs?: DesignRegistry | null }, write: ModelCall): Promise<SaasSpecOutcome> {
  if (isReplacementBrief(input.prompt)) {
    const r = await generateReplacement(input, { write })
    if (!r.ok) return r
    return { ok: true, text: r.text, paths: r.paths, usage: r.usage, label: `Planning your internal tool (${r.spec.direction.name})`, summary: `replacement features=${r.features.length} direction=${r.spec.direction.id}` }
  }
  const r = await generateSaas(input, { write, designs: input.designs })
  if (!r.ok) return r
  return { ok: true, text: r.text, paths: r.paths, usage: r.usage, label: `Planning your SaaS (${r.spec.direction.name})`, summary: `saas direction=${r.spec.direction.id} plans=${r.model.plans.plans.length} entities=${r.model.app.entities.length}` }
}

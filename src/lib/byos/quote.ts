import { creditCost, resolveBuildTier, type BuildSizeTier } from '@/lib/credits'
import { INFRA, featureFit, requiredInfra, type ModelFit, type NeedKind } from './infra'

/**
 * BYOS quote + hand-off prompt. Pricing is NOT new: the quote maps the picked
 * scope to a planned-file count and prices it with the existing saas-build size
 * tiers (src/lib/credits.ts), so what the visitor sees here is what the build
 * is actually charged. Free of any new price point.
 */

export interface PickedFeature {
  module: string
  name: string
  description: string
  fit?: ModelFit
  needs?: NeedKind[]
  note?: string
}

/** Matches the planner's own rule of thumb: shared shell + ~2 files per feature + 1 per integration. */
export function estimatePlannedFiles(featureCount: number, integrationCount: number): number {
  return 4 + featureCount * 2 + integrationCount
}

export function quoteBuild(featureCount: number, integrationCount: number): { tier: BuildSizeTier; credits: number; plannedFiles: number } {
  const plannedFiles = estimatePlannedFiles(featureCount, integrationCount)
  const tier = resolveBuildTier({ totalPlannedFiles: plannedFiles })
  return { tier, credits: creditCost('saas-build', 'fast', tier), plannedFiles }
}

/** The set DashboardClient's pending-prompt contract accepts is capped at 2000 chars. */
export const PROMPT_LIMIT = 2000

export function composeBuildPrompt(opts: {
  product: string
  category: string
  features: PickedFeature[]
  connectLive: string[]
  connectPlaceholder: string[]
  importCsv: boolean
}): string {
  const { product, category, features, connectLive, connectPlaceholder, importCsv } = opts
  const head =
    `Build our own internal ${category || 'business'} tool to replace ${product}. ` +
    `It must do ONLY the features listed below — nothing else, no extra modules. ` +
    `Use real sign-in and a real database. Design it as an original product: do not copy ${product}'s name, logo, wording or visual design.`

  const services = requiredInfra(features).map(k => `${INFRA[k].label} via ${INFRA[k].provider}`)
  const tail = [
    services.length
      ? `Outside services: write the real integration code for each, read credentials from environment settings, and add a Setup screen listing what the owner must configure with a live connection status. Never simulate or fake them. ${services.join('; ')}.`
      : '',
    connectLive.length ? `Connect for real: ${connectLive.join(', ')}.` : '',
    connectPlaceholder.length ? `Add clearly-labelled placeholder settings (no fake data) for: ${connectPlaceholder.join(', ')}.` : '',
    importCsv ? 'Include a CSV import so we can bring our existing data in.' : '',
  ].filter(Boolean).join('\n')

  const lineFor = (f: PickedFeature, withDesc: boolean) => {
    const lite = featureFit(f) === 'lite' || f.fit === 'lite'
    const simplified = lite ? (withDesc && f.note ? ` (build a simplified version: ${f.note})` : ' (simplified version)') : ''
    return `- ${f.module}: ${f.name}${withDesc && f.description ? ` — ${f.description}` : ''}${simplified}`
  }

  for (const withDesc of [true, false]) {
    const body = features.map(f => lineFor(f, withDesc)).join('\n')
    const prompt = `${head}\n\nFeatures to build:\n${body}${tail ? `\n\n${tail}` : ''}`
    if (prompt.length <= PROMPT_LIMIT) return prompt
  }
  // Still too long (very many picks): keep the head, the tail, and as many feature lines as fit.
  const reserve = head.length + tail.length + 60
  const kept: string[] = []
  let used = 0
  for (const f of features) {
    const line = lineFor(f, false)
    if (reserve + used + line.length + 1 > PROMPT_LIMIT) break
    kept.push(line)
    used += line.length + 1
  }
  return `${head}\n\nFeatures to build:\n${kept.join('\n')}${tail ? `\n\n${tail}` : ''}`.slice(0, PROMPT_LIMIT)
}

import { creditCost, resolveBuildTier, type BuildSizeTier } from '@/lib/credits'
import { featureFit, requiredInfra, type ModelFit, type NeedKind } from './infra'
import { settingsForNeeds } from '../go-live'

/**
 * BYOS quote + hand-off prompt. Pricing is NOT new: the quote maps the picked
 * scope to a planned-file count and prices it with the existing saas-build size
 * tiers (src/lib/credits.ts), so the range shown here brackets what the build
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

export function quoteBuild(featureCount: number, integrationCount: number): { tier: BuildSizeTier; credits: number; maxCredits: number; typical: number | null; plannedFiles: number } {
  const plannedFiles = estimatePlannedFiles(featureCount, integrationCount)
  const tier = resolveBuildTier({ totalPlannedFiles: plannedFiles })
  // A build the planner classes as complex is charged at the higher rate (generate route), so quote the range.
  // Large and extra-large picks were charged 160 on every measured build (6 and 12 features, local and live), because a
  // new one-shot build is priced as the complex 'large' tier. Smaller picks are unmeasured, so they get no headline.
  const typical = tier === 'large' || tier === 'xl' ? creditCost('saas-build', 'default', 'large') : null
  return { tier, credits: creditCost('saas-build', 'fast', tier), maxCredits: creditCost('saas-build', 'default', tier), typical, plannedFiles }
}

/**
 * Longest hand-off prompt we send. The dashboard reads `wyber-pending-prompt` without a length cap (the /websites flow already sends
 * 6000), so a 14-feature pick no longer has to lose its feature descriptions to fit 2000 characters.
 */
export const PROMPT_LIMIT = 6000

/**
 * What every replacement build must contain so the owner can check it and switch over. The checklist file is parsed after the build
 * (src/lib/byos/acceptance.ts): each listed feature must also appear on a screen.
 */
export const REPLACEMENT_REQUIREMENTS =
  'Replacement checklist: add src/replacement-checklist.ts exporting FEATURES, an array of { name, status: "built" | "simplified", note } with ONE entry per feature above using its exact name, and a Replacement page in the app that lists them with a plain "Built" or "Simplified: <what is cut>" label. Every listed feature must have a visible screen, button or menu entry labelled with its name. ' +
  'Cut-over page: a field for what the owner pays now, what this app costs to run (list each outside service above with its billing note), a parallel-run checklist (export from the old tool, import here, run both for two weeks, compare totals weekly, switch the team, cancel the old plan last) and a rollback step. ' +
  'Import: a column-mapping screen, a preview with a list of row errors and a dry-run count before anything is saved. Never claim a perfect migration.'

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
    `Include sign-in and sample data that work without a backend, structured so the app can switch to the owner's own Supabase database later. Design it as an original product: do not copy ${product}'s name, logo, wording or visual design.`

  const kinds = requiredInfra(features)
  const settings = settingsForNeeds(kinds).map(s => `${s.label}: ${s.names.join(', ')}`)
  const tail = [
    kinds.length
      ? `Outside services: put ALL server code in Vercel serverless functions under api/ (one file per service, Node style "export default async function handler(req, res)"), calling each provider with fetch where possible and adding any SDK to package.json. Read credentials only from process.env using exactly these names. ${settings.join('; ')}. Take AI model names from optional ANTHROPIC_MODEL or OPENAI_MODEL settings, defaulting to claude-sonnet-5-5 for Anthropic. Never ask the owner to host a separate server. Add api/status.ts reporting which services have their settings, and a Setup screen showing that status (when it cannot be reached, say server features run once the app is deployed). Never simulate or fake a service.`
      : '',
    connectLive.length ? `Connect for real: ${connectLive.join(', ')}.` : '',
    connectPlaceholder.length ? `Add clearly-labelled placeholder settings (no fake data) for: ${connectPlaceholder.join(', ')}.` : '',
    importCsv ? 'Include a CSV import so we can bring our existing data in.' : '',
    REPLACEMENT_REQUIREMENTS,
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

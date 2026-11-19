import { buildModelPrompt, normalizeModel, validateModel } from '../app-spec/model'
import { classifyAppIntent } from '../app-spec/intents'
import type { AppModel } from '../app-spec/types'
import { normalizePlans, validatePlans } from './plans'
import type { SaasModel, SaasSpec } from './types'

/** The call that writes the product: the domain model (what the customers of this SaaS manage) and the plans. Data only, never code. */
export function buildSaasModelPrompt(prompt: string): { system: string; user: string } {
  const base = buildModelPrompt(classifyAppIntent(prompt), prompt)
  const system = [
    base.system,
    'This is the product inside a SaaS that other businesses sign up to. The entities are what a CUSTOMER of this SaaS manages in their own workspace, in the words that customer uses. Do not model the SaaS company itself (no "subscriptions", "tenants" or "users" entities).',
  ].join('\n')
  const user = [
    base.user,
    'ALSO return "plans": { limitEntity, plans: [Plan] } next to the other keys.',
    'limitEntity: the id of the main entity (the thing the customer adds the most of). Its row count is what a plan limits.',
    'Plan: { id (lowercase letters and digits), name, price, period: "month" | "year", blurb (one line), features: [3 to 5 short lines], limits: { records, seats } }. Write 2 or 3 plans in ascending order.',
    'price: a number ONLY if the owner brief states that exact number; otherwise null. Never invent a price. 0 is allowed only if the brief says the plan is free. records and seats are whole numbers or null for unlimited; limits never shrink from one plan to the next; the first plan allows at least 10 records so the product can be tried. Plan names are plain (for example Starter, Team, Business), never "Pro Max" style names.',
    'Features describe only what the product screens in this reply do (lists, metrics, CSV import and export, reminders). No security, uptime, sync, AI, integration or support promises.',
  ].join('\n')
  return { system, user }
}

export function normalizeSaasModel(raw: unknown): SaasModel {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { app: normalizeModel(raw), plans: normalizePlans(r.plans) }
}

export function validateSaasModel(m: SaasModel, prompt: string): string[] {
  const problems = validateModel(m.app)
  if (problems.length) return problems
  return validatePlans(m.plans, prompt, m.app)
}

/** The call that writes the marketing words. It knows what the product really does, so the features match the screens. */
export function buildSaasCopyPrompt(spec: SaasSpec, businessPrompt: string, model: SaasModel): { system: string; user: string } {
  const f = spec.site.brief.facts
  const lines = spec.site.sections.map(s => {
    const n = s.count.max ? ` (${s.count.min === s.count.max ? s.count.min : s.count.min + ' to ' + s.count.max} items${s.variant === 'cards' ? ', a multiple of 3' : ''})` : ''
    return `- "${s.id}" [${s.kind}]${n}: ${s.purpose}`
  }).join('\n')
  const system = [
    'You write the words for the marketing site of a SaaS product. You do not write code. Return ONE JSON object and nothing else.',
    'Rules: use only what is given below; never invent customer names, counts, years, prices, awards, certifications, integrations, guarantees or testimonials.',
    'Never write "secure", "synced", "real-time", "cloud", "AI-powered", "seamless", "powerful", "all-in-one" or "revolutionary". Data is kept in the customer browser until the owner connects storage, so do not promise backups or sync.',
    'No exclamation marks, no superlatives. Plain, specific sentences a business owner understands. Every FAQ answer starts with the direct answer in its first sentence.',
    `Voice: the design direction is "${spec.direction.name}" (${spec.direction.group}); let it shape tone, not facts.`,
  ].join('\n')
  const entities = model.app.entities.map(e => `${e.label} (${e.fields.map(x => x.label).join(', ')})`).join('; ')
  const user = [
    `Owner brief: ${businessPrompt}`,
    `The product is called "${model.app.appName}": ${model.app.tagline}`,
    `What the product screens really contain: ${entities}. Numbers on the home screen: ${model.app.metrics.map(m => m.label).join(', ')}. It can import and export CSV, keeps a change history and lets the person undo a delete.`,
    `Plans (shown by the pricing section, do not repeat prices in the copy): ${model.plans.plans.map(p => p.name).join(', ')}.`,
    `Owner facts: ${JSON.stringify(f)}`,
    'Return JSON with: brand (the product name above), seo {title (max ' + spec.site.seo.titleMax + ' chars, "<what it does> | <product name>"), description (' + spec.site.seo.descMin + ' to ' + spec.site.seo.descMax + ' chars)},',
    'hero {eyebrow?, headline, accent?, sub, cta (the label of the button that opens the demo, for example "Try the demo"), secondary (a link label that jumps to the features)}, sections {<id>: {title, description?, items? [{title,text}], faq? [{question,answer}], button?}}.',
    spec.site.motion.highlight ? 'hero.accent: the 1 to 3 consecutive words of the headline that carry its meaning, copied exactly.' : 'Omit hero.accent.',
    'There are no image slots: omit imageBrief and imageAlt. Feature items name a real thing the product does, one concrete line each.',
    'Sections to write:',
    lines,
  ].join('\n')
  return { system, user }
}

export type { AppModel }

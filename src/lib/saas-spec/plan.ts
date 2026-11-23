import { seededRandom } from '../build-spec/random'
import { feelScore } from '../build-spec/feel'
import { dealDirections } from '../direction-brief'
import { getDirectionById, type Direction } from '../design-directions'
import { appLayoutFor } from '../app-spec/plan'
import { classifyAppIntent, APP_BLUEPRINTS } from '../app-spec/intents'
import { BLUEPRINTS } from '../website-spec/intents'
import { headerVariantFor, heroVariantFor, motionFor, servicesVariantFor } from '../website-spec/plan'
import type { AppSpec } from '../app-spec/types'
import type { BuildSpec, PlannedSection } from '../website-spec/types'
import type { OwnerFacts, SaasLayoutPlan, SaasSpec } from './types'

export interface SaasPlanOptions { seed: string; facts?: OwnerFacts; directionId?: string | null; avoid?: string[]; currency?: string }

/**
 * One direction for the whole product, so the marketing site and the screens inside read as the same brand. Only directions made for both
 * a website and an app are considered; the stated feel decides first, then a seeded pick among the best fits.
 */
export function pickSaasDirection(prompt: string, o: SaasPlanOptions): Direction {
  const explicit = getDirectionById(o.directionId)
  if (explicit) return explicit
  const rnd = seededRandom(o.seed)
  const wide = dealDirections(prompt, 24, { projectType: 'saas', rnd })
  const both = wide.filter(d => d.surfaces.includes('website') && d.surfaces.includes('app'))
  const pool = both.length >= 2 ? both : wide
  // an explicit "dark" or "light" decides the mode before anything else
  const wantsDark = /\bdark\b/i.test(prompt)
  const wantsLight = /\b(light|bright)\b/i.test(prompt) && !wantsDark
  const modeBonus = (d: Direction) => ((wantsDark && d.palette.mode === 'dark') || (wantsLight && d.palette.mode === 'light') ? 2 : 0)
  const scored = pool.map((d, i) => ({ d, i, f: feelScore(prompt, d) + modeBonus(d) })).sort((a, b) => b.f - a.f || a.i - b.i)
  const top = scored[0]?.f ?? 0
  const ranked = scored.filter(x => top === 0 || x.f === top).slice(0, 3).map(x => x.d)
  const fresh = ranked.filter(d => !(o.avoid ?? []).includes(d.id))
  const picks = fresh.length ? fresh : ranked
  return picks[Math.floor(rnd() * picks.length)]
}

export function saasLayoutFor(d: Direction, seed: string): SaasLayoutPlan {
  const r = seededRandom(seed + ':saaslayout')
  const hero = heroVariantFor(d)
  const editorial = d.group === 'editorial' || d.group === 'type-led'
  return {
    heroPreview: hero === 'split' ? 'right' : 'below',
    heroPhoto: d.rules.heroMedia === 'photo',
    steps: r() < 0.5 ? 'timeline' : 'columns',
    pricing: r() < 0.65 ? 'cards' : 'table',
    faq: r() < 0.5 ? 'split' : 'centered',
    rhythm: editorial ? 'rules' : d.palette.mode === 'dark' ? 'bands' : (['bands', 'plain', 'rules'] as const)[Math.floor(r() * 3)],
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** The marketing site's plan: always the website pipeline's product blueprint (features, how it works, FAQ, closing call to action). */
function planSite(prompt: string, d: Direction, facts: OwnerFacts, seed: string): BuildSpec {
  const bp = BLUEPRINTS.product
  const sv = servicesVariantFor(d)
  const sections: PlannedSection[] = bp.sections.map(s => {
    const count =
      s.kind === 'services' ? (sv === 'bento' ? { min: 4, max: 4 } : { min: 3, max: 6 })
      : s.kind === 'steps' ? { min: 3, max: 4 }
      : s.kind === 'faq' ? { min: 4, max: 6 }
      : { min: 0, max: 0 }
    return { ...s, variant: s.kind === 'services' ? sv : undefined, count }
  })
  const industry = (prompt.toLowerCase().match(/\b(for|helps?)\s+([a-z ]{3,30}?)(?:\s+(?:to|who|that|in)\b|[.,]|$)/)?.[2] ?? 'software').trim()
  const motion = motionFor(d, seed)
  return {
    version: 1,
    layout: undefined,
    languages: ['en'],
    brief: { intent: 'product', confidence: 1, industry, goalAction: bp.goalAction, modules: [], facts, unsupported: [] },
    direction: { id: d.id, name: d.name, group: d.group, mode: d.palette.mode, heroMedia: d.rules.heroMedia },
    header: headerVariantFor(d),
    hero: heroVariantFor(d),
    // a SaaS has no sticky contact bar (the call to action is always the demo) and no marker under a headline phrase, which breaks when the line wraps on a phone
    motion: { ...motion, stickyCta: false, backToTop: true, highlight: false },
    sections,
    images: [],
    seo: { schemaType: 'SoftwareApplication', slug: slug(industry + '-app') || 'app', titleMax: 60, descMin: 110, descMax: 158, faqSchema: true },
  }
}

export function planSaas(prompt: string, o: SaasPlanOptions): SaasSpec {
  const facts = o.facts ?? {}
  const d = pickSaasDirection(prompt, o)
  const intent = classifyAppIntent(prompt, facts)
  const app: AppSpec = {
    version: 1,
    brief: intent,
    direction: { id: d.id, name: d.name, group: d.group, mode: d.palette.mode },
    layout: appLayoutFor(d, o.seed),
    blueprint: APP_BLUEPRINTS[intent.intent].id,
  }
  return {
    version: 1, kind: 'saas',
    site: planSite(prompt, d, facts, o.seed),
    app,
    direction: app.direction,
    layout: saasLayoutFor(d, o.seed),
    currency: o.currency ?? '$',
  }
}

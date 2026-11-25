// SaaS build spec (19 Nov 2026). A SaaS = marketing site (website pipeline, product intent) + the product (app-spec runtime driven by the model
// the AI writes for this product) + the SaaS contract (S1 to S15 in saas-ready.ts) met by fixed, tested template files.
// The AI writes data only: the product's domain model, the plans model and the site copy. It never writes code.

import type { AppModel } from '../app-spec/types'
import type { OwnerFacts } from '../build-spec/types'
import type { BuildSpec, SectionStyles } from '../website-spec/types'

export type { OwnerFacts, AppModel, BuildSpec }

/** What a plan limits. null means unlimited. */
export interface PlanLimits { records: number | null; seats: number | null }

export interface PlanDef {
  id: string
  name: string
  /** Major units (for example 19 for 19 a month). null = the owner did not give a price: shown as "Price set by the owner". */
  price: number | null
  period: 'month' | 'year'
  blurb: string
  features: string[]
  limits: PlanLimits
}

export interface PlansModel {
  /** The entity whose rows count against the record limit. */
  limitEntity: string
  plans: PlanDef[]
}

/** What the model writes for the product: the domain model plus the plans. */
export interface SaasModel { app: AppModel; plans: PlansModel }

export interface SaasLayoutPlan {
  /** Marketing site: how the product preview sits in the hero. */
  heroPreview: 'right' | 'below'
  /** Photo-first hero (a direction whose hero media is a photograph): one full-bleed photo, flat dark overlay, headline low and left. */
  heroPhoto: boolean
  /** Which section header the page uses. */
  header: SectionStyles['header']
  /** Older saved specs carry only 'timeline' or 'columns' for steps and 'split' or 'centered' for the FAQ; the renderer maps both. */
  steps: SectionStyles['steps'] | 'timeline' | 'columns'
  pricing: 'cards' | 'table'
  faq: SectionStyles['faq'] | 'split' | 'centered'
  /** Wider page structure (25 Nov 2026). Absent on specs saved before: the renderer then keeps the older choices. */
  features?: SectionStyles['features']
  cta?: SectionStyles['cta']
  footer?: SectionStyles['footer']
  strip?: 'ribbon' | 'none'
  /** The hero shows the product's own features as tabs (the preview moves below it). */
  heroTabs?: boolean
  rhythm: 'bands' | 'plain' | 'rules'
}

export interface SaasSpec {
  /** The art director's skin (hue and font pairing) on top of the direction. */
  look?: import('../build-spec/look').Look
  version: 1
  kind: 'saas'
  /** The marketing site plan from the website pipeline (product intent). Carries the copy slots and SEO. */
  site: BuildSpec
  /** The in-app layout (list shape, density, home order) chosen for the same direction. */
  app: import('../app-spec/types').AppSpec
  direction: { id: string; name: string; group: string; mode: 'light' | 'dark' }
  layout: SaasLayoutPlan
  currency: string
  /** Parts of the brief this kind of product cannot do, named by the model that read the brief. The chat says them plainly. */
  notBuilt?: string[]
}

export type ReplaceFeature = { name: string; status: 'built' | 'simplified'; note?: string }

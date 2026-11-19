// SaaS build spec (19 Nov 2026). A SaaS = marketing site (website pipeline, product intent) + the product (app-spec runtime driven by the model
// the AI writes for this product) + the SaaS contract (S1 to S15 in saas-ready.ts) met by fixed, tested template files.
// The AI writes data only: the product's domain model, the plans model and the site copy. It never writes code.

import type { AppModel } from '../app-spec/types'
import type { OwnerFacts } from '../build-spec/types'
import type { BuildSpec } from '../website-spec/types'

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
  steps: 'timeline' | 'columns'
  pricing: 'cards' | 'table'
  faq: 'split' | 'centered'
  rhythm: 'bands' | 'plain' | 'rules'
}

export interface SaasSpec {
  version: 1
  kind: 'saas'
  /** The marketing site plan from the website pipeline (product intent). Carries the copy slots and SEO. */
  site: BuildSpec
  /** The in-app layout (list shape, density, home order) chosen for the same direction. */
  app: import('../app-spec/types').AppSpec
  direction: { id: string; name: string; group: string; mode: 'light' | 'dark' }
  layout: SaasLayoutPlan
  currency: string
}

export type ReplaceFeature = { name: string; status: 'built' | 'simplified'; note?: string }

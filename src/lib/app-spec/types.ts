// Web app build spec (19 Nov 2026). Same recipe as the website pillar (src/lib/website-spec) on the shared core (src/lib/build-spec):
// intent -> blueprint -> plan -> the model writes the DOMAIN MODEL (entities, fields, sample rows, metrics) -> a fixed, tested runtime
// renders the screens from that schema. The launch-ready contract (LR1 to LR14) is met by the runtime, not hoped for.

import type { OwnerFacts } from '../build-spec/types'
export type { OwnerFacts }

export type AppIntentId = 'register' | 'tracker' | 'booking' | 'billing' | 'pipeline'

export type FieldType = 'text' | 'longtext' | 'number' | 'money' | 'date' | 'phone' | 'select' | 'ref' | 'checkbox'

export interface AppField {
  id: string
  label: string
  type: FieldType
  /** select: 2 to 8 choices. The first is the default. */
  options?: string[]
  /** ref: the id of the entity this field points at. */
  ref?: string
  required?: boolean
  /** Show as a column in the list (default: the first five fields). */
  list?: boolean
}

/** A read-only number worked out from child rows, for example an invoice total from its lines. */
export interface AppComputed { id: string; label: string; kind: 'sumChild'; entity: string; field: string; ref: string }

export type SampleRow = Record<string, string | number | boolean>

export interface AppEntity {
  id: string
  label: string
  singular: string
  /** The field that names a row (shown in lists, reminders and pickers). */
  title: string
  blurb: string
  fields: AppField[]
  computed?: AppComputed[]
  /** A select field whose options are stages or states. Gets a filter strip and a coloured badge. */
  status?: string
  /** A date field. A row past it (and not in a final status) is overdue. */
  due?: string
  /** A money field: what is owed. With contact + due it enables the WhatsApp reminder. */
  amount?: string
  /** A phone field. */
  contact?: string
  /** The status options that mean the row is finished (paid, done, cancelled). */
  finalStatuses?: string[]
  /** 3 to 5 demo rows, loaded only on request and always marked as demo. A ref field names the other row by its title. */
  sample: SampleRow[]
}

export interface AppMetric {
  id: string
  label: string
  kind: 'count' | 'sum' | 'countWhere' | 'sumWhere'
  entity: string
  field?: string
  where?: { field: string; op: 'eq' | 'neq' | 'overdue'; value?: string }
  money?: boolean
}

export interface AppModel {
  appName: string
  tagline: string
  /** One sentence for the home screen, plain and specific to this business. */
  homeIntro: string
  entities: AppEntity[]
  metrics: AppMetric[]
}

export interface AppBlueprint {
  id: AppIntentId
  label: string
  /** What the model starts from: a skeleton it renames and extends for this business. */
  skeleton: { entity: string; singular: string; fields: string[] }[]
  features: { whatsapp: boolean; statusStrip: boolean; print: boolean }
  /** The proof check for this intent, in one line. */
  proof: string
  guidance: string
}

export interface AppLayoutPlan {
  /** Rows as a table on large screens or as cards everywhere. */
  list: 'table' | 'cards'
  density: 'compact' | 'roomy'
  /** Home screen: metrics first or the entity shortcuts first. */
  home: 'metrics-first' | 'shortcuts-first'
  sidebar: 'full' | 'icons'
}

export interface AppSpec {
  version: 1
  brief: { intent: AppIntentId; confidence: number; industry: string; facts: OwnerFacts; note?: string; secondary?: AppIntentId; notBuilt?: string[] }
  direction: { id: string; name: string; group: string; mode: 'light' | 'dark' }
  layout: AppLayoutPlan
  blueprint: AppIntentId
}

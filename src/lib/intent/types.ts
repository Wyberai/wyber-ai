// Visitor-intent experiment (India-only). See prior.ts / classify.ts.
// Kept self-contained: it deliberately does NOT touch the shared Locale type
// (every dict in lib/i18n is Record<Locale, ...>), so Gujarati can exist here
// without forcing ~9,400 lines of translations elsewhere.

export const INTENT_LANGS = ['en', 'hi', 'gu'] as const
export type IntentLang = (typeof INTENT_LANGS)[number]

export const DOORS = ['business', 'software', 'student'] as const
export type Door = (typeof DOORS)[number]

export const AUDIENCES = [...DOORS, 'other'] as const
export type Audience = (typeof AUDIENCES)[number]

export const JOBS = [
  'build_tool', 'website', 'mobile_app', 'client_prototype',
  'learn', 'compare', 'security', 'pricing', 'other',
] as const
export type Job = (typeof JOBS)[number]

export const STAGES = ['curious', 'comparing', 'ready'] as const
export type Stage = (typeof STAGES)[number]

/** What the classifier returns (always validated, never trusted raw). */
export interface Intent {
  audience: Audience
  job: Job
  industry: string | null
  /** One plain-language sentence, in the visitor's own language. */
  pain: string
  /** Language the visitor wrote in. */
  language: IntentLang | 'other'
  stage: Stage
  /** 0..1. Below CONFIDENCE_FLOOR the page keeps the default and asks again. */
  confidence: number
}

export const CONFIDENCE_FLOOR = 0.55

/** Request-time facts, assembled on the server. */
export interface IntentSignals {
  path: string
  utmSource: string | null
  utmCampaign: string | null
  utmContent: string | null
  forParam: string | null
  referer: string | null
  country: string | null
  /** ISO 3166-2 subdivision from Vercel, e.g. "GJ" for Gujarat. */
  region: string | null
  acceptLanguage: string | null
}

/** The guess made before the visitor says anything. */
export interface Prior {
  door: Door
  confidence: number
  reasons: string[]
  suggestedLang: IntentLang
}

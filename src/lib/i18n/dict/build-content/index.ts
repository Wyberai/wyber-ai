import type { Locale } from '../../locales'
import type { TranslatedBuildPage } from './business'
import { PRODUCTIVITY_BUILD_CONTENT } from './productivity'
import { BUSINESS_BUILD_CONTENT } from './business'
import { HEALTH_BUILD_CONTENT } from './health'
import { FINANCE_BUILD_CONTENT } from './finance'
import { EVENTS_BUILD_CONTENT } from './events'
import { EDUCATION_BUILD_CONTENT } from './education'

export type { TranslatedBuildPage } from './business'

// Merges all six category content dicts into one slug-keyed lookup per locale
// — mirrors src/app/build/data/index.ts's BUILD_PAGES/getBuildPage pattern,
// just for the translated (h1/tagline/body/features/promptExample/faqs)
// half of each page instead of the structural half (slug/target/related).
const ALL_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: { ...PRODUCTIVITY_BUILD_CONTENT.en, ...BUSINESS_BUILD_CONTENT.en, ...HEALTH_BUILD_CONTENT.en, ...FINANCE_BUILD_CONTENT.en, ...EVENTS_BUILD_CONTENT.en, ...EDUCATION_BUILD_CONTENT.en },
  hi: { ...PRODUCTIVITY_BUILD_CONTENT.hi, ...BUSINESS_BUILD_CONTENT.hi, ...HEALTH_BUILD_CONTENT.hi, ...FINANCE_BUILD_CONTENT.hi, ...EVENTS_BUILD_CONTENT.hi, ...EDUCATION_BUILD_CONTENT.hi },
  kn: { ...PRODUCTIVITY_BUILD_CONTENT.kn, ...BUSINESS_BUILD_CONTENT.kn, ...HEALTH_BUILD_CONTENT.kn, ...FINANCE_BUILD_CONTENT.kn, ...EVENTS_BUILD_CONTENT.kn, ...EDUCATION_BUILD_CONTENT.kn },
  te: { ...PRODUCTIVITY_BUILD_CONTENT.te, ...BUSINESS_BUILD_CONTENT.te, ...HEALTH_BUILD_CONTENT.te, ...FINANCE_BUILD_CONTENT.te, ...EVENTS_BUILD_CONTENT.te, ...EDUCATION_BUILD_CONTENT.te },
  ta: { ...PRODUCTIVITY_BUILD_CONTENT.ta, ...BUSINESS_BUILD_CONTENT.ta, ...HEALTH_BUILD_CONTENT.ta, ...FINANCE_BUILD_CONTENT.ta, ...EVENTS_BUILD_CONTENT.ta, ...EDUCATION_BUILD_CONTENT.ta },
}

export function getTranslatedBuildPage(slug: string, locale: Locale): TranslatedBuildPage | undefined {
  return ALL_CONTENT[locale]?.[slug] ?? ALL_CONTENT.en[slug]
}

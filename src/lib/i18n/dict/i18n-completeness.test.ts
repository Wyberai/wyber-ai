import { describe, it, expect } from 'vitest'
import { LOCALES } from '../locales'
import { COMMON_STRINGS } from './common'
import { PRICING_STRINGS } from './pricing'
import { SETTINGS_STRINGS } from './settings'
import { DASHBOARD_STRINGS } from './dashboard'
import { ABOUT_CONTENT } from './about'
import { VS_INDEX_CONTENT } from './vs-index'
import { VS_TEMPLATE_STRINGS } from './vs-template'
import { BUILD_TEMPLATE_STRINGS } from './build-template'
import { USE_CASES_TEMPLATE_STRINGS } from './use-cases-template'
import { LOVABLE_CONTENT } from './vs-content/lovable'
import { BOLT_CONTENT } from './vs-content/bolt'
import { CURSOR_CONTENT } from './vs-content/cursor'
import { REPLIT_CONTENT } from './vs-content/replit'
import { SOFTR_CONTENT } from './vs-content/softr'
import { V0_CONTENT } from './vs-content/v0'
import { EDITOR_AGENTTEAM_STRINGS } from './editor-agentteam'
import { EDITOR_CANVAS_STRINGS } from './editor-canvas'
import { EDITOR_CHATPANEL_STRINGS } from './editor-chatpanel'
import { EDITOR_CONNECTORS_STRINGS } from './editor-connectors'
import { EDITOR_CORE_UI_STRINGS } from './editor-core-ui'
import { EDITOR_DESIGN_STRINGS } from './editor-design'
import { EDITOR_MOBILE_STRINGS } from './editor-mobile'
import { EDITOR_PLAN_STRINGS } from './editor-plan'
import { EDITOR_PREVIEW_STRINGS } from './editor-preview'
import { EDITOR_SHELL_STRINGS } from './editor-shell'
import { EDITOR_TOOLS_STRINGS } from './editor-tools'
import { EDITOR_TOPBAR_STRINGS } from './editor-topbar'
import { BUSINESS_BUILD_CONTENT } from './build-content/business'
import { EDUCATION_BUILD_CONTENT } from './build-content/education'
import { EVENTS_BUILD_CONTENT } from './build-content/events'
import { FINANCE_BUILD_CONTENT } from './build-content/finance'
import { HEALTH_BUILD_CONTENT } from './build-content/health'
import { PRODUCTIVITY_BUILD_CONTENT } from './build-content/productivity'
import { ECOMMERCE_BUILD_CONTENT } from './build-content/ecommerce'
import { TRADES_BUILD_CONTENT } from './build-content/trades-home-services'
import { USE_CASES_CONTENT } from './use-cases-content'

// Every dict in this project is shaped Record<Locale, T> for some T (a flat
// string map, a single content object, or a slug-keyed map of content
// objects) — so a single structural check catches a missing translation
// regardless of which shape a given dict uses: every non-English locale
// must define exactly the same top-level keys as `en`. This is what
// I18N_ENABLED=true silently depended on — a locale falling back key-by-key
// to English (see useT.ts/getT.ts's fallback chain) never crashes, so a
// gap here would otherwise only surface as an unnoticed English string
// leaking into a translated page.
function checkParity<T extends object>(name: string, dict: Record<string, T>) {
  describe(name, () => {
    const referenceKeys = Object.keys(dict.en ?? {}).sort()
    expect(referenceKeys.length, `${name}: 'en' locale is empty or missing`).toBeGreaterThan(0)

    for (const locale of LOCALES) {
      if (locale === 'en') continue
      it(`${locale} defines the same keys as en`, () => {
        const keys = Object.keys(dict[locale] ?? {}).sort()
        const missing = referenceKeys.filter(k => !keys.includes(k))
        const extra = keys.filter(k => !referenceKeys.includes(k))
        expect(missing, `${name}.${locale} is missing keys: ${missing.join(', ')}`).toEqual([])
        expect(extra, `${name}.${locale} has unexpected extra keys: ${extra.join(', ')}`).toEqual([])
      })
    }
  })
}

checkParity('COMMON_STRINGS', COMMON_STRINGS)
checkParity('PRICING_STRINGS', PRICING_STRINGS)
checkParity('SETTINGS_STRINGS', SETTINGS_STRINGS)
checkParity('DASHBOARD_STRINGS', DASHBOARD_STRINGS)
checkParity('ABOUT_CONTENT', ABOUT_CONTENT)
checkParity('VS_INDEX_CONTENT', VS_INDEX_CONTENT)
checkParity('VS_TEMPLATE_STRINGS', VS_TEMPLATE_STRINGS)
checkParity('BUILD_TEMPLATE_STRINGS', BUILD_TEMPLATE_STRINGS)
checkParity('USE_CASES_TEMPLATE_STRINGS', USE_CASES_TEMPLATE_STRINGS)
checkParity('LOVABLE_CONTENT', LOVABLE_CONTENT)
checkParity('BOLT_CONTENT', BOLT_CONTENT)
checkParity('CURSOR_CONTENT', CURSOR_CONTENT)
checkParity('REPLIT_CONTENT', REPLIT_CONTENT)
checkParity('SOFTR_CONTENT', SOFTR_CONTENT)
checkParity('V0_CONTENT', V0_CONTENT)
checkParity('EDITOR_AGENTTEAM_STRINGS', EDITOR_AGENTTEAM_STRINGS)
checkParity('EDITOR_CANVAS_STRINGS', EDITOR_CANVAS_STRINGS)
checkParity('EDITOR_CHATPANEL_STRINGS', EDITOR_CHATPANEL_STRINGS)
checkParity('EDITOR_CONNECTORS_STRINGS', EDITOR_CONNECTORS_STRINGS)
checkParity('EDITOR_CORE_UI_STRINGS', EDITOR_CORE_UI_STRINGS)
checkParity('EDITOR_DESIGN_STRINGS', EDITOR_DESIGN_STRINGS)
checkParity('EDITOR_MOBILE_STRINGS', EDITOR_MOBILE_STRINGS)
checkParity('EDITOR_PLAN_STRINGS', EDITOR_PLAN_STRINGS)
checkParity('EDITOR_PREVIEW_STRINGS', EDITOR_PREVIEW_STRINGS)
checkParity('EDITOR_SHELL_STRINGS', EDITOR_SHELL_STRINGS)
checkParity('EDITOR_TOOLS_STRINGS', EDITOR_TOOLS_STRINGS)
checkParity('EDITOR_TOPBAR_STRINGS', EDITOR_TOPBAR_STRINGS)
checkParity('BUSINESS_BUILD_CONTENT', BUSINESS_BUILD_CONTENT)
checkParity('EDUCATION_BUILD_CONTENT', EDUCATION_BUILD_CONTENT)
checkParity('EVENTS_BUILD_CONTENT', EVENTS_BUILD_CONTENT)
checkParity('FINANCE_BUILD_CONTENT', FINANCE_BUILD_CONTENT)
checkParity('HEALTH_BUILD_CONTENT', HEALTH_BUILD_CONTENT)
checkParity('PRODUCTIVITY_BUILD_CONTENT', PRODUCTIVITY_BUILD_CONTENT)
checkParity('ECOMMERCE_BUILD_CONTENT', ECOMMERCE_BUILD_CONTENT)
checkParity('TRADES_BUILD_CONTENT', TRADES_BUILD_CONTENT)
checkParity('USE_CASES_CONTENT', USE_CASES_CONTENT)

// Deeper check for the per-slug content dicts: catch a translated entry that
// exists (so the key-parity check above passes) but has an accidentally
// empty core field — e.g. a copy-paste that left `h1: ''`.
describe('build-content and use-cases-content: no empty core fields', () => {
  const buildDicts = [
    ['business', BUSINESS_BUILD_CONTENT], ['education', EDUCATION_BUILD_CONTENT],
    ['events', EVENTS_BUILD_CONTENT], ['finance', FINANCE_BUILD_CONTENT],
    ['health', HEALTH_BUILD_CONTENT], ['productivity', PRODUCTIVITY_BUILD_CONTENT],
  ] as const
  for (const [name, dict] of buildDicts) {
    for (const locale of LOCALES) {
      it(`${name}.${locale}: every page has non-empty h1/tagline/promptExample and >=4 faqs`, () => {
        const pages = dict[locale] as unknown as Record<string, { h1: string; tagline: string; promptExample: string; faqs: unknown[] }>
        for (const [slug, page] of Object.entries(pages)) {
          expect(page.h1?.trim(), `${name}.${locale}.${slug}.h1`).not.toBe('')
          expect(page.tagline?.trim(), `${name}.${locale}.${slug}.tagline`).not.toBe('')
          expect(page.promptExample?.trim(), `${name}.${locale}.${slug}.promptExample`).not.toBe('')
          expect(page.faqs?.length, `${name}.${locale}.${slug}.faqs`).toBeGreaterThanOrEqual(4)
        }
      })
    }
  }

  for (const locale of LOCALES) {
    it(`use-cases-content.${locale}: every use case has non-empty h1/tagline/promptExample`, () => {
      const cases = USE_CASES_CONTENT[locale] as unknown as Record<string, { h1: string; tagline: string; promptExample: string }>
      for (const [slug, uc] of Object.entries(cases)) {
        expect(uc.h1?.trim(), `use-cases-content.${locale}.${slug}.h1`).not.toBe('')
        expect(uc.tagline?.trim(), `use-cases-content.${locale}.${slug}.tagline`).not.toBe('')
        expect(uc.promptExample?.trim(), `use-cases-content.${locale}.${slug}.promptExample`).not.toBe('')
      }
    })
  }
})

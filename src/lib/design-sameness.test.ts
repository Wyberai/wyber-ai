import { describe, it, expect } from 'vitest'
import { UNSLOP_WEBAPP_RULES } from './unslop'
import { UNSLOP_WEBSITE_RULES } from './unslop-website'
import { PALETTES } from './design-palettes'

/**
 * 18 Nov 2026: four of four default builds (web app, SaaS, replace, kirana) came out cream with a rust or amber accent.
 * The per-request DESIGN BRIEF carried a distinct palette, but the launch-ready rules sit in the static system prompt,
 * say they override earlier visual rules, and told the model to pick a ramp "from the world", with "warm light (paper, food,
 * craft, people)" the only worded example. The brief lost. These tests keep the brief in charge and the warm default honest.
 */
describe('design sameness', () => {
  it('the app rules say a design brief or direction block wins over the starter ramps', () => {
    expect(UNSLOP_WEBAPP_RULES).toMatch(/PRECEDENCE: when this request carries a DESIGN BRIEF or DESIGN DIRECTION block/)
    expect(UNSLOP_WEBAPP_RULES).toMatch(/A colour or look the user named in their own words beats both/)
  })

  it('the website rules say the same', () => {
    expect(UNSLOP_WEBSITE_RULES).toMatch(/DESIGN BRIEF or DESIGN DIRECTION block, take both from it/)
  })

  it('"people" and "small business" are no longer a warm world, and cream with orange is named as the trap', () => {
    for (const rules of [UNSLOP_WEBAPP_RULES, UNSLOP_WEBSITE_RULES]) {
      expect(rules).not.toMatch(/warm for food, craft, people/)
      expect(rules).not.toMatch(/warm light \(paper, food, craft, people\)/)
      expect(rules).toMatch(/Cream with an orange, amber or rust accent is the default/)
    }
  })

  it('the palette catalogue is not mostly warm light themes', () => {
    const list = PALETTES as unknown as { id: string; mode: string }[]
    const dark = list.filter((p) => p.mode === 'dark').length
    expect(dark).toBeGreaterThanOrEqual(8)
    expect(list.length).toBeGreaterThanOrEqual(30)
  })
})

import { describe, it, expect } from 'vitest'
import { DEMO_SAAS, demoSiteCopy } from './demo-models'
import { normalizeSaasModel, planSaas, renderSaas, validateSaasModel } from './index'

describe('even grids, no orphan card', () => {
  const d = DEMO_SAAS[0]
  const raw = (m: typeof d.model) => ({ ...m.app, plans: m.plans })
  it('the home screen lays four numbers out 2 by 2 and 4 across', () => {
    const spec = planSaas(d.prompt, { seed: d.seed, currency: d.currency })
    const home = renderSaas(spec, d.model, demoSiteCopy(spec.site, d.copy)).files['src/components/HomePage.tsx']
    expect(home).toContain('grid grid-cols-2 gap-4 lg:grid-cols-4')
    expect(home).not.toContain('lg:grid-cols-3')
  })
  it('a reply with 3 metrics or 3 entities is sent back', () => {
    const three = structuredClone(d.model); three.app.metrics.pop()
    expect(validateSaasModel(normalizeSaasModel(raw(three)), d.prompt).join(' ')).toMatch(/exactly 4 metrics/)
    const odd = structuredClone(d.model)
    odd.app.entities.push({ ...structuredClone(odd.app.entities[0]), id: 'extras', label: 'Extras', singular: 'Extra' })
    expect(validateSaasModel(normalizeSaasModel(raw(odd)), d.prompt).join(' ')).toMatch(/2 or 4 entities/)
  })
  it('the site never marks a headline phrase, which breaks when the line wraps on a phone', () => {
    expect(planSaas(d.prompt, { seed: 'any' }).site.motion.highlight).toBe(false)
  })
})

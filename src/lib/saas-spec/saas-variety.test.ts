import { describe, it, expect } from 'vitest'
import { planSaas, renderSaas } from './index'
import { DEMO_SAAS, demoSiteCopy } from './demo-models'
import { checkSaasReady } from '../saas-ready'
import { scanSlopSource } from '../unslop'
import { validateCopy } from '../website-spec/copy'
import { WYBER_SECTION_NAMES } from '../wyber-sections'

// The SaaS marketing page draws its structure from the same wider pools as the website planner. Measured 25 Nov 2026: the old planner could
// only vary header (3), steps (2), FAQ (2), pricing (2), features (3 per group), hero preview (2) and rhythm (3); it is keyed here by what the page really renders.
const keyOf = (s: ReturnType<typeof planSaas>) => {
  const l = s.layout
  return [l.header, l.steps, l.faq, l.pricing, l.features ?? 'old', l.cta ?? 'old', l.footer ?? 'old', l.strip ?? 'old', l.heroTabs ? 'tabs' : 'plain', l.heroPreview, l.heroPhoto, l.rhythm, s.site.sections[0].variant].join('|')
}

/** Distinct layouts over 1,000 seeds on each demo prompt, before the expansion (measured by replaying the old layout function on commit 0f1c628). */
const BASELINE_DISTINCT: Record<string, number> = { studio: 8, repairs: 16, khata: 56 }

describe('SaaS page variety', () => {
  it('draws many more distinct marketing page layouts than before', () => {
    for (const d of DEMO_SAAS) {
      const seen = new Set<string>()
      for (let i = 0; i < 1000; i++) seen.add(keyOf(planSaas(d.prompt, { seed: 'v' + i, currency: d.currency })))
      console.log('SaaS ' + d.key + ': distinct layouts over 1000 seeds ' + BASELINE_DISTINCT[d.key] + ' (before) -> ' + seen.size)
      expect(seen.size, d.key).toBeGreaterThan(BASELINE_DISTINCT[d.key] * 5)
    }
  })

  it('every drawn layout renders, meets the SaaS contract and the anti-slop scan, and imports only real sections', () => {
    for (const d of DEMO_SAAS) for (let i = 0; i < 30; i++) {
      const spec = planSaas(d.prompt, { seed: d.seed + 'w' + i, currency: d.currency })
      const copy = demoSiteCopy(spec.site, d.copy)
      expect(validateCopy(spec.site, copy).map(p => p.path + ' ' + p.message), d.key + i).toEqual([])
      const { files } = renderSaas(spec, d.model, copy)
      expect(checkSaasReady(files).items.filter(x => !x.ok).map(x => x.id), d.key + i).toEqual([])
      const site = Object.entries(files).find(([p]) => /(^|\/)Site\.tsx$/.test(p))?.[1] ?? ''
      const imp = site.match(/import \{([^}]+)\} from '\.\/wyber-sections'/)
      for (const n of (imp?.[1] ?? '').split(',').map(x => x.trim()).filter(Boolean)) expect(WYBER_SECTION_NAMES as readonly string[], n).toContain(n)
      expect(scanSlopSource({ 'src/Site.tsx': site }).issues.map(x => x.id + ': ' + x.sample), d.key + i).toEqual([])
    }
  }, 120_000)

  it('a photograph hero keeps its photograph close', () => {
    const d = DEMO_SAAS[0]
    for (let i = 0; i < 20; i++) {
      const spec = planSaas(d.prompt, { seed: 'p' + i, currency: d.currency, directionId: 'ed-brand-world' })
      expect(spec.layout.heroPhoto).toBe(true)
      expect(spec.layout.cta).toBe('band')
      expect(spec.layout.heroTabs).toBe(false)
    }
  })
})

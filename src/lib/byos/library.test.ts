import { describe, expect, it } from 'vitest'
import data from './library-data.json'
import index from './library-index.json'
import { getLibraryAnalysis } from './library'
import { cacheKey, normalizeDomain } from './domain'
import { sanitizeExtraction, type ByosAnalysis } from './analyze'

const lib = data as ByosAnalysis[]

describe('byos library', () => {
  it('has one unique entry per product, with a matching client index', () => {
    const keys = lib.map(a => cacheKey(a.domain))
    expect(new Set(keys).size).toBe(keys.length)
    expect(index.map(i => i.domain).sort()).toEqual(lib.map(a => a.domain).sort())
  })

  it('every entry is a normalized, sane analysis a visitor can be served', () => {
    for (const a of lib) {
      expect(normalizeDomain(a.domain), a.domain).toBe(a.domain)
      expect(a.modules.length, a.domain).toBeGreaterThanOrEqual(5)
      const ids = a.modules.flatMap(m => m.features.map(f => f.id))
      expect(new Set(ids).size, `${a.domain} feature ids unique`).toBe(ids.length)
      // Re-running the production sanitizer must not change what is shipped.
      const again = sanitizeExtraction({ product: a.product, category: a.category, modules: a.modules, integrations: a.integrations }, a.domain, a.integrationsComplete)
      expect(again?.modules.map(m => m.features.map(f => f.name)), a.domain).toEqual(a.modules.map(m => m.features.map(f => f.name)))
    }
  })

  it('every entry carries honest fit data (regenerate with scripts/byos-build-library.mjs if this fails)', () => {
    for (const a of lib) {
      expect(typeof a.fitSummary === 'string' && a.fitSummary.length > 0, `${a.domain} fitSummary`).toBe(true)
      for (const f of a.modules.flatMap(m => m.features)) {
        expect(['build', 'lite', 'cant'], `${a.domain}/${f.name} fit`).toContain(f.fit)
        expect(Array.isArray(f.needs), `${a.domain}/${f.name} needs`).toBe(true)
      }
    }
  })

  it('looks tools up with or without www.', () => {
    if (!lib.length) return
    const first = lib[0]
    expect(getLibraryAnalysis(`www.${cacheKey(first.domain)}`)?.domain).toBe(first.domain)
  })
})

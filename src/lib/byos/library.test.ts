import { describe, expect, it } from 'vitest'
import data from './library-data.json'
import index from './library-index.json'
import { getLibraryAnalysis } from './library'
import { LIBRARY_TOOLS, slugForDomain, toolBySlug } from './slug'
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
      expect(typeof a.isPlatform, `${a.domain} isPlatform`).toBe('boolean')
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

describe('byos library slugs', () => {
  it('derives readable slugs from the domain', () => {
    expect(slugForDomain('pipedrive.com')).toBe('pipedrive')
    expect(slugForDomain('linear.app')).toBe('linear')
    expect(slugForDomain('www.monday.com')).toBe('monday')
  })
  it('gives every library tool a unique slug that resolves back to it, with analysis data to render', () => {
    const slugs = LIBRARY_TOOLS.map(t => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const t of LIBRARY_TOOLS) {
      expect(toolBySlug(t.slug)?.domain).toBe(t.domain)
      expect(getLibraryAnalysis(t.domain), t.domain).not.toBeNull()
    }
  })
})

import { isPlatformDomain } from './platforms'

describe('platform list', () => {
  it('flags suites and networks, and nothing that is just a big focused app', () => {
    for (const d of ['slack.com', 'zoom.us', 'teams.microsoft.com', 'www.salesforce.com', 'hubspot.com']) expect(isPlatformDomain(d), d).toBe(true)
    for (const d of ['pipedrive.com', 'calendly.com', 'cal.com', 'mailchimp.com', 'asana.com', 'airtable.com']) expect(isPlatformDomain(d), d).toBe(false)
  })
  it('the committed library agrees with the list', () => {
    for (const a of lib) expect(a.isPlatform, a.domain).toBe(isPlatformDomain(a.domain))
  })
})

import { backstopNeeds } from './backstop'

describe('needs backstop', () => {
  it('adds the unmistakable service the model missed, and never removes one', () => {
    expect(backstopNeeds('Two-way email sync', 'Sync email accounts with the CRM', [])).toEqual(['email-inbox-sync'])
    expect(backstopNeeds('Calendar sync', '', ['payments'])).toEqual(['payments', 'calendar-oauth'])
    expect(backstopNeeds('SMS reminders', '', [])).toEqual(['sms-whatsapp'])
    expect(backstopNeeds('Kanban board', 'Drag cards between stages', [])).toEqual([])
  })
  it('is applied to what the library serves', () => {
    const pd = getLibraryAnalysis('pipedrive.com')?.modules.flatMap(m => m.features).find(f => /two-way email sync/i.test(f.name))
    // The model called it "cant"; it is buildable on a mailbox-sync service, so the library serves it as such.
    if (pd) expect(pd).toMatchObject({ fit: 'lite', needs: ['email-inbox-sync'] })
  })
})

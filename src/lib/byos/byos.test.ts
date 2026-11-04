import { describe, expect, it } from 'vitest'
import { isPrivateAddress, normalizeDomain } from './domain'
import { liveMatch } from './integrations'
import { composeBuildPrompt, PROMPT_LIMIT, quoteBuild } from './quote'
import { sanitizeExtraction } from './analyze'

describe('normalizeDomain', () => {
  it('reduces urls to a bare hostname', () => {
    expect(normalizeDomain('https://www.Pipedrive.com/features?x=1')).toBe('www.pipedrive.com')
    expect(normalizeDomain('linear.app')).toBe('linear.app')
  })
  it('rejects anything that could reach an internal host', () => {
    for (const bad of ['localhost', '127.0.0.1', 'http://10.0.0.5/admin', '169.254.169.254', '[::1]', 'intranet.local', 'db.internal', 'nodots', 'a b.com', '', 'file:///etc/passwd']) {
      expect(normalizeDomain(bad)).toBeNull()
    }
  })
})

describe('isPrivateAddress', () => {
  it('flags private, loopback and link-local ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1']) {
      expect(isPrivateAddress(ip)).toBe(true)
    }
    for (const ip of ['8.8.8.8', '104.18.0.1', '172.32.0.1']) expect(isPrivateAddress(ip)).toBe(false)
  })
})

describe('quoteBuild', () => {
  it('prices with the existing saas-build size tiers', () => {
    // The shared shell alone is 4 files, so even a single pick starts at medium.
    expect(quoteBuild(1, 0)).toMatchObject({ tier: 'medium', credits: 50 })
    expect(quoteBuild(3, 0)).toMatchObject({ tier: 'medium', credits: 50 })
    expect(quoteBuild(5, 2)).toMatchObject({ tier: 'large', credits: 80 })
    expect(quoteBuild(9, 3)).toMatchObject({ tier: 'xl', credits: 120 })
  })
})

describe('composeBuildPrompt', () => {
  const feat = (i: number) => ({ module: 'Pipeline', name: `Feature ${i}`, description: 'Does a useful thing for the team '.repeat(3) })
  it('stays inside the pending-prompt limit however many features are picked', () => {
    const p = composeBuildPrompt({ product: 'Pipedrive', category: 'CRM', features: Array.from({ length: 80 }, (_, i) => feat(i)), connectLive: ['Slack'], connectPlaceholder: ['Zoom'], importCsv: true })
    expect(p.length).toBeLessThanOrEqual(PROMPT_LIMIT)
    expect(p).toContain('ONLY the features listed')
    expect(p).toContain('Slack')
  })
  it('tells the builder not to copy the original', () => {
    const p = composeBuildPrompt({ product: 'Pipedrive', category: 'CRM', features: [feat(1)], connectLive: [], connectPlaceholder: [], importCsv: false })
    expect(p).toMatch(/do not copy Pipedrive/)
  })
})

describe('liveMatch', () => {
  it('maps detected names to what the builder can really connect', () => {
    expect(liveMatch('Google Calendar')).toBe('Google Calendar')
    expect(liveMatch('Slack')).toBe('Slack')
    expect(liveMatch('Kixie')).toBeNull()
  })
})

describe('sanitizeExtraction', () => {
  it('drops junk, caps lengths and strips markup characters from model output', () => {
    const out = sanitizeExtraction({
      product: 'Acme <script>', category: 'CRM',
      modules: [{ name: 'Deals', features: [{ name: 'Pipeline `view`', description: 'x'.repeat(500), core: true }, { name: '' }] }, { name: 'Empty', features: [] }],
      integrations: ['Slack', 'Slack', '  '],
    }, 'acme.com', true)
    expect(out?.modules).toHaveLength(1)
    expect(out?.modules[0].features).toHaveLength(1)
    expect(out?.modules[0].features[0].description.length).toBeLessThanOrEqual(140)
    expect(out?.product).not.toMatch(/[<>]/)
    expect(out?.integrations).toEqual(['Slack'])
  })
  it('returns null when nothing usable came back', () => {
    expect(sanitizeExtraction({ modules: [] }, 'acme.com', false)).toBeNull()
    expect(sanitizeExtraction(null, 'acme.com', false)).toBeNull()
  })
})

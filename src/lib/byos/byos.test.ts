import { describe, expect, it } from 'vitest'
import { isPrivateAddress, normalizeDomain } from './domain'
import { liveMatch } from './integrations'
import { featureFit, productVerdict, requiredInfra } from './infra'
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

describe('fit rules', () => {
  it('cant outranks everything; an outside service outranks simplified', () => {
    expect(featureFit({ fit: 'cant', needs: ['payments'] })).toBe('cant')
    expect(featureFit({ fit: 'lite', needs: ['email-sending'] })).toBe('provider')
    expect(featureFit({ fit: 'lite', needs: [] })).toBe('lite')
    expect(featureFit({ fit: 'build', needs: [] })).toBe('build')
    expect(featureFit({})).toBe('build')
  })

  it('judges how replaceable a whole product is, bluntly', () => {
    const mk = (fit: 'build' | 'lite' | 'cant', n: number) => Array.from({ length: n }, () => ({ fit }))
    expect(productVerdict([...mk('build', 9), ...mk('cant', 1)]).verdict).toBe('good')
    expect(productVerdict([...mk('build', 7), ...mk('cant', 3)]).verdict).toBe('partial')
    expect(productVerdict([...mk('build', 5), ...mk('cant', 5)]).verdict).toBe('poor')
    expect(productVerdict([...mk('build', 5), ...mk('lite', 5)]).verdict).toBe('partial')
  })

  it('lists each needed service once, in a stable order, ignoring cant features', () => {
    const picked = [
      { fit: 'build' as const, needs: ['email-sending' as const, 'payments' as const] },
      { fit: 'lite' as const, needs: ['email-sending' as const] },
      { fit: 'cant' as const, needs: ['sms-whatsapp' as const] },
    ]
    expect(requiredInfra(picked)).toEqual(['email-sending', 'payments'])
  })
})

describe('sanitizeExtraction fit fields', () => {
  it('validates fit and needs, and clears needs on features we cannot build', () => {
    const out = sanitizeExtraction({
      product: 'Acme', category: 'email', fitSummary: 'Deliverability cannot be replicated.',
      modules: [{ name: 'Sending', features: [
        { name: 'Campaigns', description: '', core: true, fit: 'build', needs: ['email-sending', 'bogus-kind'], note: 'Needs SES' },
        { name: 'Network', description: '', core: false, fit: 'cant', needs: ['payments'], note: 'No' },
        { name: 'Weird', description: '', core: false, fit: 'nonsense', needs: 'oops', note: '' },
      ] }],
      integrations: [],
    }, 'acme.com', true)
    const [a, b, c] = out!.modules[0].features
    expect(a.needs).toEqual(['email-sending'])
    expect(b.needs).toEqual([])
    expect(c).toMatchObject({ fit: 'build', needs: [] })
    expect(out!.fitSummary).toBe('Deliverability cannot be replicated.')
  })
})

describe('composeBuildPrompt with fit data', () => {
  it('tells the builder to write real integration code for needed services and never fake them', () => {
    const p = composeBuildPrompt({
      product: 'Mailchimp', category: 'email marketing',
      features: [
        { module: 'Campaigns', name: 'Send campaigns', description: 'Send to lists.', fit: 'build', needs: ['email-sending'], note: '' },
        { module: 'Insights', name: 'Smart send time', description: '', fit: 'lite', needs: [], note: 'Fixed rules only' },
      ],
      connectLive: [], connectPlaceholder: [], importCsv: false,
    })
    expect(p).toContain('Amazon SES')
    expect(p).toMatch(/Never simulate or fake/)
    expect(p).toContain('simplified version: Fixed rules only')
    expect(p.length).toBeLessThanOrEqual(PROMPT_LIMIT)
  })
})

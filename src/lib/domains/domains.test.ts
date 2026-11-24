import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeDomainsProvider } from './fake-provider'
import { memoryStore } from './memory-store'
import { createDomainOrder, fulfilOrder, QuoteChangedError } from './orders'
import { quoteDomain, quoteWorkspace, splitDomain, toUsdCents } from './pricing'
import { resetCostCache, searchDomains, toLabel, workspaceQuoteFor } from './search'
import { providerPath, siteRecords, workspaceRecords } from './dns'
import { dueReminder } from './dates'
import { RelayDomainsClient } from './relay-client'
import { signRelayBody, verifyRelaySignature } from './relay-sign'
import { policyLines, workspacePolicyLines } from './policy'
import { breaksCopyRules } from '@/lib/customer-copy-rules'
import { getProvider } from './index'

const contact = { name: 'Asha Rao', company: '', email: 'asha@example.com', address1: '1 MG Road', city: 'Pune', state: 'MH', zip: '411001', country: 'IN', phoneCc: '91', phone: '9876543210' }
const attachOk = async () => ({ attached: true, verified: false })

beforeEach(() => resetCostCache())

describe('pricing', () => {
  it('adds a flat $1 to the registry price', async () => {
    const t = await new FakeDomainsProvider().getCostTable()
    const q = quoteDomain('ashabakery.com', 1, t)!
    expect(q.registryCents).toBe(1099)
    expect(q.marginCents).toBe(100)
    expect(q.totalCents).toBe(1199)
    expect(q.renewalTotalCents).toBe(1299)
  })
  it('keeps the margin flat across terms', async () => {
    const t = await new FakeDomainsProvider().getCostTable()
    expect(quoteDomain('a1.com', 5, t)!.totalCents).toBe(1099 * 5 + 100)
  })
  it('matches .co.in before .in', () => {
    expect(splitDomain('shop.co.in')).toEqual({ label: 'shop', tld: 'co.in' })
    expect(splitDomain('shop.in')).toEqual({ label: 'shop', tld: 'in' })
  })
  it('converts INR cost up to the next cent', () => {
    expect(toUsdCents(100001, 'INR', 83)).toBe(1205)
    expect(() => toUsdCents(100, 'INR')).toThrow()
  })
  it('prices Workspace per seat per month with a flat margin', () => {
    const q = quoteWorkspace({ seats: 3, months: 12, costPerSeatMonthMinor: 600, currency: 'USD', marginPerSeatMonthCents: 50 })
    expect(q.registryCents).toBe(600 * 36)
    expect(q.marginCents).toBe(50 * 36)
    expect(q.totalCents).toBe(650 * 36)
  })
})

describe('search', () => {
  it('turns what people type into a label', () => {
    expect(toLabel('Asha Bakery')).toBe('ashabakery')
    expect(toLabel('https://ashabakery.com/menu')).toBe('ashabakery')
  })
  it('returns prices only for available names and hides TLDs without a price', async () => {
    const p = new FakeDomainsProvider()
    const { results } = await searchDomains(p, 'ashabakery')
    const by = Object.fromEntries(results.map(r => [r.tld, r]))
    expect(by.com.status).toBe('available')
    expect(by.com.quote?.totalCents).toBe(1199)
    expect(by.io.status).toBe('not_offered')
    expect(by.io.quote).toBeNull()
    const taken = await searchDomains(p, 'takenname')
    expect(taken.results.find(r => r.tld === 'com')).toMatchObject({ status: 'taken', quote: null })
  })
  it('quotes Workspace by region', async () => {
    const p = new FakeDomainsProvider()
    const india = await workspaceQuoteFor(p, 'in', 2, 12, undefined, {})
    expect(india?.perSeatMonthCostCents).toBe(300)
    expect(india?.perSeatMonthMarginCents).toBe(50)
  })
})

describe('buying a domain', () => {
  const setup = () => ({ provider: new FakeDomainsProvider(), mem: memoryStore() })
  const input = { userId: 'u1', domain: 'ashabakery.com', years: 1, projectId: 'p1', contact, confirmedTotalCents: 1199, acknowledged: true }

  it('refuses without the confirmation step', async () => {
    const { provider, mem } = setup()
    await expect(createDomainOrder({ provider, store: mem.store }, { ...input, acknowledged: false })).rejects.toThrow(/confirm/)
    expect(mem.orders.size).toBe(0)
  })
  it('refuses when the confirmed total is not the current total', async () => {
    const { provider, mem } = setup()
    await expect(createDomainOrder({ provider, store: mem.store }, { ...input, confirmedTotalCents: 999 })).rejects.toBeInstanceOf(QuoteChangedError)
    expect(mem.orders.size).toBe(0)
  })
  it('refuses a name that is no longer free', async () => {
    const { provider, mem } = setup()
    await expect(createDomainOrder({ provider, store: mem.store }, { ...input, domain: 'takenshop.com', confirmedTotalCents: 1199 })).rejects.toThrow(/no longer available/)
  })
  it('registers, writes DNS, attaches to the project and links the site after payment', async () => {
    const { provider, mem } = setup()
    const o = await createDomainOrder({ provider, store: mem.store }, input)
    expect(o.total_cents).toBe(1199)
    const r = await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(r).toMatchObject({ ok: true, status: 'active' })
    expect(provider.state.dns.get('ashabakery.com')?.map(x => `${x.type} ${x.host}`)).toEqual(['A @', 'CNAME www'])
    expect(mem.domains.get('ashabakery.com')).toMatchObject({ dns_written: true, vercel_attached: true })
    expect(mem.linked.p1).toBe('ashabakery.com')
  })
  it('does not register twice when the payment webhook is delivered twice', async () => {
    const { provider, mem } = setup()
    const o = await createDomainOrder({ provider, store: mem.store }, input)
    await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(provider.state.calls.filter(c => c === 'registerDomain')).toHaveLength(1)
  })
  it('keeps a paid order visible when registration fails', async () => {
    const { provider, mem } = setup()
    const o = await createDomainOrder({ provider, store: mem.store }, input)
    provider.failNext.registerDomain = 'Registry unavailable'
    const r = await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(r.status).toBe('needs_attention')
    expect((await mem.store.getOrder(o.id))?.error).toMatch(/Registry unavailable/)
  })
  it('still finishes when only the DNS write fails, shown as DNS pending', async () => {
    const { provider, mem } = setup()
    const o = await createDomainOrder({ provider, store: mem.store }, input)
    provider.failNext.addDnsRecord = 'dns down'
    const r = await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(r.ok).toBe(true)
    expect(mem.domains.get('ashabakery.com')?.dns_written).toBe(false)
  })
  it('sets up Workspace with mail records', async () => {
    const { provider, mem } = setup()
    const o = await mem.store.insertOrder({ user_id: 'u1', kind: 'workspace', domain: 'ashabakery.com', project_id: null, years: null, months: 12, seats: 3, region: 'in', registry_cents: 10800, margin_cents: 1800, total_cents: 12600, contact, policy_version: 'x' })
    expect((await fulfilOrder({ provider, store: mem.store }, o.id)).ok).toBe(true)
    expect(mem.workspaces.get('ashabakery.com')?.seats).toBe(3)
    expect(provider.state.dns.get('ashabakery.com')?.some(r => r.type === 'MX' && r.value === 'aspmx.l.google.com' && r.priority === 1)).toBe(true)
    expect(provider.state.dns.get('ashabakery.com')?.filter(r => r.type === 'MX')).toHaveLength(5)
  })
})

describe('dns records', () => {
  it('uses the same site records the custom-domain check expects', () => {
    expect(siteRecords()).toEqual([
      { type: 'A', host: '@', value: '76.76.21.21', ttl: 7200 },
      { type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com', ttl: 7200 },
    ])
  })
  it('never sends a TTL the provider would refuse', () => {
    for (const r of [...siteRecords(), ...workspaceRecords({ verificationToken: 'x' })]) expect(r.ttl).toBeGreaterThanOrEqual(7200)
  })
  it('maps records to provider calls', () => {
    expect(providerPath({ type: 'A', host: '@', value: '1.2.3.4', ttl: 300 })).toEqual({ path: 'dns/manage/add-ipv4-record.json', params: { value: '1.2.3.4', ttl: '300' } })
    expect(providerPath({ type: 'MX', host: '@', value: 'smtp.google.com', ttl: 3600, priority: 1 }).params.priority).toBe('1')
    expect(providerPath({ type: 'CNAME', host: 'www', value: 'x.example', ttl: 300 }).params.host).toBe('www')
  })
  it('adds a verification record only when we have one', () => {
    expect(workspaceRecords()).toHaveLength(6) // five MX + SPF
    expect(workspaceRecords({ verificationToken: 'google-site-verification=abc' })).toHaveLength(7)
  })
})

describe('reminders', () => {
  it('sends one reminder per threshold, then one notice after it has expired', () => {
    expect(dueReminder(40, [])).toBeNull()
    expect(dueReminder(30, [])).toBe(30)
    expect(dueReminder(13, [30])).toBe(14)
    expect(dueReminder(13, [30, 14])).toBeNull()
    expect(dueReminder(1, [30, 14, 7])).toBe(1)
    expect(dueReminder(-1, [])).toBe(0) // the single "it has expired" notice
    expect(dueReminder(-1, [0])).toBeNull()
  })
})

describe('relay client', () => {
  it('signs each request and never carries provider credentials', async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | null = null
    const fetchImpl = (async (url: string, init: RequestInit) => {
      seen = { url, headers: init.headers as Record<string, string>, body: String(init.body) }
      return new Response(JSON.stringify({ 'ashabakery.com': { status: 'available' }, 'ashabakery.in': { status: 'regthroughothers' } }))
    }) as unknown as typeof fetch
    const c = new RelayDomainsClient({ url: 'https://relay.test/', secret: 's3cret', fetchImpl, now: () => 1000 })
    const out = await c.checkAvailability('ashabakery', ['com', 'in'])
    expect(out).toEqual({ com: 'available', in: 'taken' })
    expect(seen!.url).toBe('https://relay.test/v1/call')
    expect(seen!.body).not.toMatch(/api-key|auth-userid/)
    expect(seen!.headers['x-relay-signature']).toBe(signRelayBody('s3cret', 1000, seen!.body))
    expect(verifyRelaySignature('s3cret', 1000, seen!.body, seen!.headers['x-relay-signature'], 1010)).toBe(true)
    expect(verifyRelaySignature('s3cret', 1000, seen!.body, seen!.headers['x-relay-signature'], 1100)).toBe(false)
    expect(verifyRelaySignature('other', 1000, seen!.body, seen!.headers['x-relay-signature'], 1010)).toBe(false)
  })
  it('turns provider errors into errors', async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ status: 'ERROR', message: 'Invalid contact' }))) as unknown as typeof fetch
    const c = new RelayDomainsClient({ url: 'https://relay.test', secret: 's', fetchImpl })
    await expect(c.ensureContact({ customerId: 1, contact })).rejects.toThrow('Invalid contact')
  })
  it('reads cost prices into minor units', async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ domcno: { addnewdomain: { '1': '9.99' }, renewdomain: { '1': '10.49' } } }))) as unknown as typeof fetch
    const c = new RelayDomainsClient({ url: 'https://relay.test', secret: 's', fetchImpl, env: {} })
    const t = await c.getCostTable()
    expect(t.domains.domcno.register[1]).toBe(999)
    expect(t.domains.domcno.renew[1]).toBe(1049)
  })
})

describe('provider selection', () => {
  it('is off when nothing is configured and refuses the fake on production', () => {
    expect(getProvider({})).toBeNull()
    expect(getProvider({ DOMAINS_PROVIDER: 'fake', VERCEL_ENV: 'production' })).toBeNull()
    expect(getProvider({ DOMAINS_PROVIDER: 'fake' })?.name).toBe('fake')
    expect(getProvider({ DOMAINS_RELAY_URL: 'https://r', DOMAINS_RELAY_SECRET: 's' })?.name).toBe('resellerclub-relay')
  })
})

describe('customer copy', () => {
  it('breaks none of the founder copy rules and states the price rule and refund window', () => {
    const lines = [...policyLines('com'), ...policyLines('io'), ...workspacePolicyLines(50)]
    for (const l of lines) expect(breaksCopyRules(l)).toBeNull()
    expect(policyLines('com').join(' ')).toMatch(/registry price plus a flat \$1/)
    expect(policyLines('com').join(' ')).toMatch(/4 days/)
    expect(policyLines('io').join(' ')).toMatch(/not published/)
  })
})

describe('provider answers found in the sandbox', () => {
  const clientFor = (reply: unknown) =>
    new RelayDomainsClient({ url: 'https://relay.example', secret: 's', fetchImpl: (async () => new Response(JSON.stringify(reply), { status: 200 })) as typeof fetch })
  it('treats HTTP 200 with status "Failed" as an error, not a success', async () => {
    await expect(clientFor({ status: 'Failed', msg: 'ttl : TTL should not be less than 7200.' }).addDnsRecord('a.com', { type: 'A', host: '@', value: '1.2.3.4', ttl: 7200 })).rejects.toThrow('TTL')
  })
  it('reads an unfinished domain order as pending, and a finished one with its expiry', async () => {
    expect((await clientFor({ domainname: 'a.in', orderstatus: [] }).getDomainDetails(1))).toMatchObject({ status: 'pending', expiresAt: null })
    const done = await clientFor({ domainname: 'a.com', orderstatus: ['transferlock'], endtime: '1827027350' }).getDomainDetails(2)
    expect(done.expiresAt).toBe('2027-11-24T03:35:50.000Z')
    expect(done.status).toBe('transferlock')
  })
  it('makes provider passwords that meet the rule: 9-16 chars with upper, lower, digit, special', async () => {
    const { providerPassword } = await import('./relay-client')
    for (let i = 0; i < 50; i++) {
      const p = providerPassword()
      expect(p.length).toBeGreaterThanOrEqual(9); expect(p.length).toBeLessThanOrEqual(16)
      expect(p).toMatch(/[A-Z]/); expect(p).toMatch(/[a-z]/); expect(p).toMatch(/[0-9]/); expect(p).toMatch(/[!@#%+]/)
    }
  })
})

describe('smooth journey: alternatives, emails, once-only notification', () => {
  it('offers close names that are free when the wanted name is taken, with real prices', async () => {
    const { suggestAlternatives } = await import('./search')
    const alts = await suggestAlternatives(new FakeDomainsProvider(), 'takenshop')
    // "taken..." is reported as taken by the fake; "gettakenshop" is the only variant that does not start with it.
    expect(alts.map(a => a.domain)).toEqual(['gettakenshop.com'])
    expect(alts[0].quote?.totalCents).toBe(1099 + 100)
  })
  it('finds nothing to suggest when every variant is taken, and never more than four', async () => {
    const { suggestAlternatives } = await import('./search')
    const none = await suggestAlternatives({ ...new FakeDomainsProvider(), checkAvailability: async () => ({ com: 'taken', in: 'taken' }), getCostTable: async () => new FakeDomainsProvider().getCostTable(), name: 'x' } as never, 'abc')
    expect(none).toEqual([])
    const many = await suggestAlternatives(new FakeDomainsProvider(), 'freshname')
    expect(many.length).toBeLessThanOrEqual(4)
    expect(many.length).toBeGreaterThan(0)
  })
  const mailOrder = { id: '12345678-aaaa-bbbb-cccc-1234567890ab', kind: 'domain' as const, domain: 'ashabakery.com', seats: null, months: null, years: null, total_cents: 1199, contact }
  it('writes honest customer emails that pass the copy rules', async () => {
    const { orderMail } = await import('./notify')
    const mails = [
      orderMail(mailOrder, 'done', 'https://wyberai.com'),
      orderMail({ ...mailOrder, kind: 'workspace', seats: 3, months: 12, total_cents: 12600 }, 'done', 'https://wyberai.com'),
      orderMail(mailOrder, 'attention', 'https://wyberai.com'),
    ]
    for (const m of mails) {
      expect(m.to).toBe('asha@example.com')
      expect(breaksCopyRules(m.text)).toBeNull()
      expect(m.text).not.toMatch(/resell|reseller|ResellerClub|solo|founder/i)
    }
    expect(mails[0].text).toContain('a few minutes to a few hours')
    expect(mails[1].text).toContain('admin@ashabakery.com')
    expect(mails[2].subject).toContain('needs one more step')
    expect(mails[2].text).toContain('12345678')
  })
  it('only the delivery that did the work reports it ran, so a retried webhook sends no second email', async () => {
    const { provider, mem } = (() => ({ provider: new FakeDomainsProvider(), mem: memoryStore() }))()
    const o = await mem.store.insertOrder({ user_id: 'u1', kind: 'domain', domain: 'ashabakery.com', project_id: null, years: 1, months: null, seats: null, region: null, registry_cents: 1099, margin_cents: 100, total_cents: 1199, contact, policy_version: 'x' })
    const first = await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    const second = await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(first).toMatchObject({ ok: true, ran: true })
    expect(second).toMatchObject({ ok: true, ran: false })
  })
})

describe('renewals', () => {
  const buyDomain = async () => {
    const provider = new FakeDomainsProvider()
    const mem = memoryStore()
    const o = await mem.store.insertOrder({ user_id: 'u1', kind: 'domain', domain: 'ashabakery.com', project_id: null, years: 1, months: null, seats: null, region: null, registry_cents: 1099, margin_cents: 100, total_cents: 1199, contact, policy_version: 'x' })
    await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    return { provider, mem }
  }
  it('prices a renewal at the registry renewal price plus the flat $1', async () => {
    const { quoteRenewal } = await import('./pricing')
    const t = await new FakeDomainsProvider().getCostTable()
    const q = quoteRenewal('ashabakery.com', 1, t)
    expect(q).toMatchObject({ registryCents: 1199, marginCents: 100, totalCents: 1299 })
    expect(quoteRenewal('ashabakery.com', 4, t)).toBeNull() // no renewal price for a 4 year term
  })
  it('renews a domain for the term, adds it after the current expiry, and resets the reminders', async () => {
    const { createRenewalOrder, renewalPreview } = await import('./orders')
    const { provider, mem } = await buyDomain()
    const before = new Date(mem.domains.get('ashabakery.com')!.expires_at!)
    const preview = await renewalPreview({ provider, store: mem.store }, { userId: 'u1', kind: 'domain', domain: 'ashabakery.com', years: 2 })
    expect(preview.totalCents).toBe(2 * 1199 + 100)
    expect(new Date(preview.newExpiresAt).getUTCFullYear()).toBe(before.getUTCFullYear() + 2)
    const order = await createRenewalOrder({ provider, store: mem.store }, { userId: 'u1', kind: 'domain', domain: 'ashabakery.com', years: 2, confirmedTotalCents: preview.totalCents, acknowledged: true })
    expect(order.kind).toBe('domain_renewal')
    const r = await fulfilOrder({ provider, store: mem.store }, order.id)
    expect(r).toMatchObject({ ok: true, status: 'active', ran: true })
    expect(new Date(mem.domains.get('ashabakery.com')!.expires_at!).getUTCFullYear()).toBe(before.getUTCFullYear() + 2)
    // a retried payment notification must not renew a second time
    const again = await fulfilOrder({ provider, store: mem.store }, order.id)
    expect(again.ran).toBe(false)
    expect(new Date(mem.domains.get('ashabakery.com')!.expires_at!).getUTCFullYear()).toBe(before.getUTCFullYear() + 2)
  })
  it('holds the same money rules as a purchase', async () => {
    const { createRenewalOrder } = await import('./orders')
    const { provider, mem } = await buyDomain()
    const base = { userId: 'u1', kind: 'domain' as const, domain: 'ashabakery.com', years: 1 }
    await expect(createRenewalOrder({ provider, store: mem.store }, { ...base, confirmedTotalCents: 1299, acknowledged: false })).rejects.toThrow(/confirm/)
    await expect(createRenewalOrder({ provider, store: mem.store }, { ...base, confirmedTotalCents: 999, acknowledged: true })).rejects.toBeInstanceOf(QuoteChangedError)
    await expect(createRenewalOrder({ provider, store: mem.store }, { ...base, years: 7, confirmedTotalCents: 1299, acknowledged: true })).rejects.toThrow(/Choose 1, 2, 3, 5 or 10/)
    expect([...mem.orders.values()].filter(o => o.kind === 'domain_renewal')).toHaveLength(0)
  })
  it("will not renew someone else's domain", async () => {
    const { createRenewalOrder } = await import('./orders')
    const { provider, mem } = await buyDomain()
    await expect(createRenewalOrder({ provider, store: mem.store }, { userId: 'someone-else', kind: 'domain', domain: 'ashabakery.com', years: 1, confirmedTotalCents: 1299, acknowledged: true })).rejects.toThrow(/not found/)
  })
  it('renews Workspace for 12 months with the same seats', async () => {
    const { createRenewalOrder, renewalPreview } = await import('./orders')
    const provider = new FakeDomainsProvider()
    const mem = memoryStore()
    const o = await mem.store.insertOrder({ user_id: 'u1', kind: 'workspace', domain: 'ashabakery.com', project_id: null, years: null, months: 12, seats: 3, region: 'in', registry_cents: 10800, margin_cents: 1800, total_cents: 12600, contact, policy_version: 'x' })
    await fulfilOrder({ provider, store: mem.store }, o.id)
    const before = new Date(mem.workspaces.get('ashabakery.com')!.expires_at!)
    const preview = await renewalPreview({ provider, store: mem.store }, { userId: 'u1', kind: 'workspace', domain: 'ashabakery.com' })
    expect(preview).toMatchObject({ seats: 3, term: 12 })
    const order = await createRenewalOrder({ provider, store: mem.store }, { userId: 'u1', kind: 'workspace', domain: 'ashabakery.com', confirmedTotalCents: preview.totalCents, acknowledged: true })
    expect(order).toMatchObject({ kind: 'workspace_renewal', seats: 3, months: 12, region: 'in' })
    expect((await fulfilOrder({ provider, store: mem.store }, order.id)).ok).toBe(true)
    expect(new Date(mem.workspaces.get('ashabakery.com')!.expires_at!).getUTCFullYear()).toBe(before.getUTCFullYear() + 1)
  })
  it('keeps a paid renewal visible when the provider step fails, and says so by email', async () => {
    const { createRenewalOrder } = await import('./orders')
    const { orderMail } = await import('./notify')
    const { provider, mem } = await buyDomain()
    const order = await createRenewalOrder({ provider, store: mem.store }, { userId: 'u1', kind: 'domain', domain: 'ashabakery.com', years: 1, confirmedTotalCents: 1299, acknowledged: true })
    provider.failNext.renewDomain = 'Registry unavailable'
    const r = await fulfilOrder({ provider, store: mem.store }, order.id)
    expect(r).toMatchObject({ ok: false, status: 'needs_attention', ran: true })
    expect(mem.orders.get(order.id)?.status).toBe('needs_attention')
    const m = orderMail(mem.orders.get(order.id)!, 'attention', 'https://wyberai.com')
    expect(m.text).toContain('the renewal of ashabakery.com')
    expect(breaksCopyRules(m.text)).toBeNull()
  })
  it('writes renewal emails and policy lines that pass the copy rules and no longer send people to support', async () => {
    const { orderMail } = await import('./notify')
    const { renewalPolicyLines, RENEWAL_LINE } = await import('./policy')
    const { reminderMail } = await import('./reminders')
    const base = { id: '12345678-aaaa-bbbb-cccc-1234567890ab', domain: 'ashabakery.com', total_cents: 1199, contact }
    const a = orderMail({ ...base, kind: 'domain_renewal', years: 2, months: null, seats: null }, 'done', 'https://wyberai.com')
    const b = orderMail({ ...base, kind: 'workspace_renewal', years: null, months: 12, seats: 3, total_cents: 12600 }, 'done', 'https://wyberai.com')
    for (const t of [a.text, b.text, ...renewalPolicyLines('domain'), ...renewalPolicyLines('workspace'), RENEWAL_LINE, reminderMail('domain', 'ashabakery.com', 7, 'https://wyberai.com').text]) {
      expect(breaksCopyRules(t)).toBeNull()
      expect(t).not.toMatch(/write to support|reseller/i)
    }
    expect(a.subject).toBe('ashabakery.com has been renewed')
    expect(a.text).toContain('2 more years')
    expect(b.text).toContain('3 seats')
  })
})

describe('Google Workspace stays hidden until switched on', () => {
  it('is off by default and on only with DOMAINS_WORKSPACE=on or the local fake sandbox', async () => {
    const { workspaceEnabled } = await import('./config')
    expect(workspaceEnabled({})).toBe(false)
    expect(workspaceEnabled({ DOMAINS_WORKSPACE: 'off' })).toBe(false)
    expect(workspaceEnabled({ DOMAINS_WORKSPACE: 'on' })).toBe(true)
    expect(workspaceEnabled({ DOMAINS_PROVIDER: 'fake' })).toBe(true)
  })
})

describe('settings pasted with hidden whitespace', () => {
  it('trims the relay url, secret and currency so a stray newline cannot cause "Bad signature"', () => {
    const p = getProvider({ DOMAINS_RELAY_URL: 'https://relay.example\n', DOMAINS_RELAY_SECRET: ' abc123\r\n', DOMAINS_PROVIDER_CURRENCY: 'inr ' })
    expect(p).not.toBeNull()
    expect((p as unknown as { currency: string }).currency).toBe('INR')
    expect(getProvider({ DOMAINS_RELAY_URL: 'https://relay.example', DOMAINS_RELAY_SECRET: '  \n' })).toBeNull()
  })
})

describe('payment page errors keep the provider reason', () => {
  it("reports the payment provider's status and message (never the key) when the page cannot start", async () => {
    const { startDodoCheckout } = await import('./checkout')
    const f = vi.fn(async () => new Response(JSON.stringify({ code: 'INVALID_REQUEST', message: 'Amount below the product minimum' }), { status: 422 }))
    vi.stubGlobal('fetch', f)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const order = { id: 'o1', user_id: 'u1', kind: 'domain', domain: 'a.in', total_cents: 857, contact } as never
    await expect(startDodoCheckout(order, { id: 'u1', email: 'a@b.com' }, 'https://wyberai.com', '/x', { DODO_PRODUCT_DOMAIN: 'prd_1', DODO_PAYMENTS_API_KEY: 'sk_secret_key' }))
      .rejects.toThrow(/422: Amount below the product minimum\). You have not been charged\./)
    const logged = JSON.stringify(spy.mock.calls)
    expect(logged).not.toContain('sk_secret_key')
    spy.mockRestore(); vi.unstubAllGlobals()
  })
})

describe('resilience: resume without doing anything twice', () => {
  const newOrder = (mem: ReturnType<typeof memoryStore>, kind: 'domain' | 'workspace' = 'domain') =>
    mem.store.insertOrder({ user_id: 'u1', kind, domain: 'ashabakery.com', project_id: null, years: kind === 'domain' ? 1 : null, months: kind === 'workspace' ? 12 : null, seats: kind === 'workspace' ? 2 : null, region: kind === 'workspace' ? 'in' : null, registry_cents: 1099, margin_cents: 100, total_cents: 1199, contact, policy_version: 'x' })
  it('resumes a failed order once the cause is fixed, and registers the domain only once', async () => {
    const { resumeOrder } = await import('./orders')
    const provider = new FakeDomainsProvider(); const mem = memoryStore()
    const o = await newOrder(mem)
    provider.failNext.registerDomain = 'Registry unavailable'
    expect(await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)).toMatchObject({ ok: false, status: 'needs_attention' })
    const r = await resumeOrder({ provider, store: mem.store, attach: attachOk }, o.id, 'needs_attention')
    expect(r).toMatchObject({ ok: true, status: 'active', ran: true })
    expect(provider.state.domains.size).toBe(1)
    expect(mem.domains.get('ashabakery.com')).toBeTruthy()
  })
  it('carries on after a cut-off: a domain registered but not recorded is found, not registered again', async () => {
    const { resumeOrder } = await import('./orders')
    const provider = new FakeDomainsProvider(); const mem = memoryStore()
    const o = await newOrder(mem)
    // The earlier attempt registered the domain, then the function was cut off before the order saved its id.
    await provider.registerDomain({ domain: 'ashabakery.com', years: 1, customerId: 1, contactId: 1, nameservers: [] })
    await mem.store.transition(o.id, 'awaiting_payment', 'registering')
    const r = await resumeOrder({ provider, store: mem.store, attach: attachOk }, o.id, 'registering')
    expect(r).toMatchObject({ ok: true, status: 'active' })
    expect(provider.state.domains.size).toBe(1)
    expect(mem.orders.get(o.id)?.rc_order_id).toBeGreaterThan(0)
  })
  it('does not resume an order that is already done or that someone else is resuming', async () => {
    const { resumeOrder } = await import('./orders')
    const provider = new FakeDomainsProvider(); const mem = memoryStore()
    const o = await newOrder(mem)
    await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    expect(await resumeOrder({ provider, store: mem.store }, o.id, 'needs_attention')).toMatchObject({ ran: false, ok: true })
  })
  it('never renews twice: a renewal the provider already applied is only recorded', async () => {
    const { createRenewalOrder, resumeOrder } = await import('./orders')
    const provider = new FakeDomainsProvider(); const mem = memoryStore()
    const o = await newOrder(mem)
    await fulfilOrder({ provider, store: mem.store, attach: attachOk }, o.id)
    const before = new Date(mem.domains.get('ashabakery.com')!.expires_at!)
    const rn = await createRenewalOrder({ provider, store: mem.store }, { userId: 'u1', kind: 'domain', domain: 'ashabakery.com', years: 1, confirmedTotalCents: 1299, acknowledged: true })
    // The provider renews, then the function is cut off before the new date is saved.
    const rcId = mem.domains.get('ashabakery.com')!.rc_order_id
    await provider.renewDomain({ orderId: rcId, years: 1, currentExpiryEpoch: Math.floor(before.getTime() / 1000) })
    await mem.store.transition(rn.id, 'awaiting_payment', 'registering')
    const r = await resumeOrder({ provider, store: mem.store }, rn.id, 'registering')
    expect(r.ok).toBe(true)
    // exactly one year added, not two
    expect(new Date(mem.domains.get('ashabakery.com')!.expires_at!).getUTCFullYear()).toBe(before.getUTCFullYear() + 1)
    expect(provider.state.calls.filter(c => c === 'renewDomain').length).toBe(1) // only the one the provider already applied; the resumed order did not call it again
  })
})

describe('after the expiry date', () => {
  it('sends one "it has expired" notice, only once and only for a month', async () => {
    const { dueReminder } = await import('./dates')
    const { reminderMail } = await import('./reminders')
    expect(dueReminder(-1, [30, 14, 7, 1])).toBe(0)
    expect(dueReminder(-5, [30, 14, 7, 1, 0])).toBeNull()
    expect(dueReminder(-31, [])).toBeNull()
    const m = reminderMail('domain', 'ashabakery.com', -3, 'https://wyberai.com')
    expect(m.subject).toBe('ashabakery.com has expired')
    expect(m.text).toContain('3 days ago')
    expect(breaksCopyRules(m.text)).toBeNull()
  })
  it('the purchase email is a thank-you with the order, next steps and the verification warning', async () => {
    const { orderMail } = await import('./notify')
    const m = orderMail({ id: '12345678-aaaa-bbbb-cccc-1234567890ab', kind: 'domain', domain: 'ashabakery.in', seats: null, months: null, years: 2, total_cents: 857, contact }, 'done', 'https://wyberai.com')
    expect(m.subject).toBe('Thank you: ashabakery.in is yours')
    for (const piece of ['ashabakery.in', '2 years', '$8.57', '12345678', 'within 15 days', 'free security certificate', '30, 14, 7 and 1 days']) expect(m.text).toContain(piece)
    expect(breaksCopyRules(m.text)).toBeNull()
    expect(m.text).not.toMatch(/resell|ResellerClub|solo|founder/i)
  })
})

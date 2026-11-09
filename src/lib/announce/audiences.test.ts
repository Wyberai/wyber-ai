import { describe, it, expect } from 'vitest'
import { planAudiences, exclusionFor, isTestAddressAllowed, maskEmail, type ProfileRow } from './audiences'

const p = (id: string, email: string | null, extra: Partial<ProfileRow> = {}): ProfileRow => ({ id, email, full_name: 'Asha Patel', plan: 'free', subscription_status: 'free', email_opt_out: false, ...extra })
const sets = (o: { builders?: string[]; owners?: string[]; sent?: string[] } = {}) => ({ builderIds: new Set(o.builders ?? []), projectOwnerIds: new Set(o.owners ?? []), alreadySent: new Set(o.sent ?? []) })

describe('exclusions', () => {
  it('drops people who must never get this', () => {
    expect(exclusionFor(p('1', null))).toBe('no-email')
    expect(exclusionFor(p('1', 'not-an-email'))).toBe('invalid')
    expect(exclusionFor(p('1', 'x@mailinator.com'))).toBe('fake-or-disposable')
    expect(exclusionFor(p('1', 'smoke@wyberai-smoke.test'))).toBe('fake-or-disposable')
    expect(exclusionFor(p('1', 'a@example.com'))).toBe('fake-or-disposable')
    expect(exclusionFor(p('1', 'a@indogmail.com'))).toBe('typo-domain')
    expect(exclusionFor(p('1', 'a@gaml.com'))).toBe('typo-domain')
    expect(exclusionFor(p('1', 'hello@wyberai.com'))).toBe('owned')
    expect(exclusionFor(p('1', 'me@tryreconsignal.com'))).toBe('owned')
    expect(exclusionFor(p('1', 'sumit.sutar259@gmail.com'))).toBe('owned')
    expect(exclusionFor(p('1', 'asha@gmail.com', { email_opt_out: true }))).toBe('opted-out')
  })
  it('keeps a normal address', () => {
    expect(exclusionFor(p('1', 'asha@gmail.com'))).toBeNull()
  })
})

describe('planAudiences', () => {
  const profiles = [
    p('spark', 'spark@gmail.com', { plan: 'spark', subscription_status: 'active' }),
    p('b1', 'b1@gmail.com'), p('b2', 'b2@gmail.com'),
    p('n1', 'n1@gmail.com'), p('n2', 'n2@gmail.com'), p('n3', 'n3@gmail.com'),
    p('started', 'started@gmail.com'),
    p('opt', 'opt@gmail.com', { email_opt_out: true }),
    p('own', 'hello@wyberai.com'),
    p('dup', 'B1@gmail.com'), // same address as b1, different account
  ]
  const input = { profiles, ...sets({ builders: ['b1', 'b2', 'spark', 'dup'], owners: ['b1', 'b2', 'started', 'spark', 'dup'] }) }

  it('puts each person in exactly one audience, highest priority first', () => {
    const plan = planAudiences(input)
    expect(plan.audiences['spark-subscriber'].remaining.map(r => r.id)).toEqual(['spark']) // a Spark builder is a Spark subscriber, not a builder
    expect(plan.audiences.builder.remaining.map(r => r.id)).toEqual(['b1', 'b2'])
    expect(plan.audiences.newcomer.remaining.map(r => r.id)).toEqual(['n1', 'n2', 'n3'])
  })

  it('holds back people who started a project but never spent credits', () => {
    const plan = planAudiences(input)
    expect(plan.heldBack).toBe(1)
    const all = Object.values(plan.audiences).flatMap(a => a.remaining.map(r => r.id))
    expect(all).not.toContain('started')
  })

  it('counts the exclusions and sends one email per address', () => {
    const plan = planAudiences(input)
    expect(plan.excluded['opted-out']).toBe(1)
    expect(plan.excluded.owned).toBe(1)
    expect(plan.eligible).toBe(7) // 10 profiles - opted out - owned - the duplicate address
    expect(Object.values(plan.audiences).flatMap(a => a.remaining.map(r => r.email))).not.toContain('hello@wyberai.com')
  })

  it('skips people who already got it, and says so', () => {
    const plan = planAudiences({ ...input, ...sets({ builders: ['b1', 'b2', 'spark'], owners: ['b1', 'b2', 'started', 'spark'], sent: ['b1', 'n1'] }) })
    expect(plan.audiences.builder.remaining.map(r => r.id)).toEqual(['b2'])
    expect(plan.audiences.builder.sent).toBe(1)
    expect(plan.audiences.builder.total).toBe(2)
    expect(plan.audiences.newcomer.remaining.map(r => r.id)).toEqual(['n2', 'n3'])
    expect(plan.alreadySent).toBe(2)
  })

  it('lower-cases addresses and takes a clean first name', () => {
    const plan = planAudiences({ profiles: [p('x', 'Asha.P@Gmail.com', { full_name: '  asha patel ' }), p('y', 'y@gmail.com', { full_name: '12345 !!' })], ...sets() })
    const [a, b] = plan.audiences.newcomer.remaining
    expect(a.email).toBe('asha.p@gmail.com')
    expect(a.firstName).toBe('asha')
    expect(b.firstName).toBeNull()
  })
})

describe('test sends are limited to addresses the founder owns', () => {
  it('allows owned domains only', () => {
    expect(isTestAddressAllowed('hello@wyberai.com')).toBe(true)
    expect(isTestAddressAllowed('a@continuumapi.com')).toBe(true)
    expect(isTestAddressAllowed('a@signalpulsehq.com')).toBe(true)
    expect(isTestAddressAllowed('customer@gmail.com')).toBe(false)
    expect(isTestAddressAllowed('x@wyberai.com.evil.com')).toBe(false)
    expect(isTestAddressAllowed('not an email')).toBe(false)
  })
})

describe('maskEmail', () => {
  it('hides most of the address', () => {
    expect(maskEmail('asha.patel@gmail.com')).toMatch(/^a\*+@gmail\.com$/)
    expect(maskEmail('asha.patel@gmail.com')).not.toContain('patel')
  })
})

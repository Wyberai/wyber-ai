import { describe, it, expect } from 'vitest'
import { weightedValue, isOpen, isStage, STAGES } from './stages'
import { normalizePhone, normalizeEmail, isOwnedEmail, type Contact } from './contact'
import { scoreContact } from './score'
import { todayQueue, endOfTodayIst, REPLY_SLA_HOURS, COLD_LEAD_MIN_SCORE } from './queue'
import { planSync, type Incoming } from './upsert'
import { parseCsv, csvToIncoming } from './csv'
import { buildBrief } from './brief'

const NOW = new Date('2026-11-10T06:00:00Z') // 11:30 IST on 10 Nov
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString()

let n = 0
const mk = (o: Partial<Contact> = {}): Contact => ({
  id: `c${++n}`, created_at: hoursAgo(100), updated_at: hoursAgo(100), name: `Person ${n}`,
  email: null, phone: null, phone_norm: null, company: null, title: null, country: null,
  segment: 'business', source: 'manual', source_ref: null, stage: 'new', value_usd: 0, score: 40, tags: [],
  next_action: null, next_action_at: null, last_touch_at: null, closed_at: null, lost_reason: null, notes: null, ...o,
})

describe('stages', () => {
  it('weights value by stage and treats won/lost/nurture as not open', () => {
    expect(weightedValue('proposal', 1000)).toBe(650)
    expect(weightedValue('won', 1000)).toBe(1000)
    expect(weightedValue('lost', 1000)).toBe(0)
    expect(weightedValue('new', Number.NaN)).toBe(0)
    expect(['won', 'lost', 'nurture'].some(s => isOpen(s as never))).toBe(false)
    expect(isOpen('replied')).toBe(true)
    expect(STAGES.every(isStage)).toBe(true)
    expect(isStage('closed')).toBe(false)
  })
})

describe('contact helpers', () => {
  it('matches Indian phone formats by the last 10 digits', () => {
    for (const f of ['+91 98765 43210', '098765-43210', '919876543210', '98765 43210']) expect(normalizePhone(f)).toBe('9876543210')
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone(null)).toBeNull()
  })
  it('normalises and validates emails', () => {
    expect(normalizeEmail('  Asha@Example.COM ')).toBe('asha@example.com')
    expect(normalizeEmail('nope')).toBeNull()
  })
  it('recognises the founder own addresses', () => {
    for (const e of ['hello@wyberai.com', 'x@tryreconsignal.com', 'me@continuumapi.com', 'sumit.sutar259@gmail.com']) expect(isOwnedEmail(e)).toBe(true)
    expect(isOwnedEmail('asha@example.com')).toBe(false)
    expect(isOwnedEmail(null)).toBe(false)
  })
})

describe('scoreContact', () => {
  const base = { source: 'apollo', segment: 'other' as const, email: null, phone: null, company: null, title: null, valueUsd: 0, tags: [] as string[] }
  it('rewards hot sources, decision makers and activity, with a reason for every point', () => {
    const cold = scoreContact(base)
    const hot = scoreContact({ ...base, source: 'expo', segment: 'business', email: 'a@b.co', phone: '9876543210', company: 'Acme', title: 'Founder & CEO', tags: ['built', 'published'] })
    expect(hot.score).toBeGreaterThan(cold.score + 60)
    expect(hot.reasons.length).toBeGreaterThan(6)
    expect(hot.reasons.join(' ')).toMatch(/decision-maker/)
  })
  it('penalises students and stays within 0..100', () => {
    expect(scoreContact({ ...base, segment: 'student' }).score).toBeLessThan(scoreContact(base).score)
    expect(scoreContact({ ...base, source: 'expo', segment: 'business', email: 'a@b.co', phone: '9', company: 'x', title: 'Owner', valueUsd: 1e9, tags: ['built', 'published', 'paid'] }).score).toBe(100)
    expect(scoreContact({ ...base, segment: 'student', source: 'whatsapp_list' }).score).toBeGreaterThanOrEqual(0)
  })
})

describe('todayQueue', () => {
  it('puts an overdue promised action first and says how late it is', () => {
    const q = todayQueue([mk({ name: 'Late', stage: 'contacted', next_action: 'Send proposal', next_action_at: hoursAgo(5) }), mk({ name: 'Other', stage: 'contacted', last_touch_at: hoursAgo(1) })], NOW)
    expect(q[0].name).toBe('Late')
    expect(q[0].reason).toBe('Overdue by 5h: Send proposal')
  })

  it('flags a hot inbound lead that has waited past the reply SLA, and ranks it above an ordinary overdue task', () => {
    const q = todayQueue([
      mk({ name: 'Expo lead', source: 'expo', created_at: hoursAgo(REPLY_SLA_HOURS + 2) }),
      mk({ name: 'Routine', stage: 'contacted', next_action: 'Check in', next_action_at: hoursAgo(1) }),
    ], NOW)
    expect(q[0].name).toBe('Expo lead')
    expect(q[0].reason).toMatch(/Reply overdue/)
  })

  it('does not nag about a brand-new lead in its first hour, or a hot lead already touched', () => {
    expect(todayQueue([mk({ source: 'expo', created_at: hoursAgo(0.3) })], NOW)).toHaveLength(0)
    expect(todayQueue([mk({ source: 'expo', created_at: hoursAgo(10), last_touch_at: hoursAgo(9) })], NOW)).toHaveLength(0)
  })

  it('includes actions due later today but not tomorrow', () => {
    const q = todayQueue([
      mk({ name: 'Today', stage: 'replied', next_action_at: new Date(NOW.getTime() + 3 * 3600_000).toISOString(), last_touch_at: hoursAgo(1) }),
      mk({ name: 'Tomorrow', stage: 'replied', next_action_at: new Date(NOW.getTime() + 30 * 3600_000).toISOString(), last_touch_at: hoursAgo(1) }),
    ], NOW)
    expect(q.map(x => x.name)).toEqual(['Today'])
  })

  it('surfaces active deals that have gone quiet for a week', () => {
    const q = todayQueue([mk({ name: 'Quiet', stage: 'proposal', last_touch_at: hoursAgo(24 * 9) }), mk({ name: 'Fresh', stage: 'proposal', last_touch_at: hoursAgo(24 * 2) })], NOW)
    expect(q.map(x => x.name)).toEqual(['Quiet'])
    expect(q[0].reason).toMatch(/Gone quiet 9 days/)
  })

  it('surfaces strong cold leads only above the score bar, and never closed or parked contacts', () => {
    const q = todayQueue([
      mk({ name: 'Strong', score: 70 }), mk({ name: 'Weak', score: 10 }),
      mk({ name: 'Won', stage: 'won', next_action_at: hoursAgo(5) }), mk({ name: 'Lost', stage: 'lost', next_action_at: hoursAgo(5) }), mk({ name: 'Parked', stage: 'nurture', next_action_at: hoursAgo(5) }),
    ], NOW)
    expect(q.map(x => x.name)).toEqual(['Strong'])
  })

  it('keeps a cold list out of Today unless it clears the bar, so real inbound leads are not buried', () => {
    const cold = Array.from({ length: 50 }, (_, i) => mk({ name: `Cold ${i}`, source: 'apollo', score: COLD_LEAD_MIN_SCORE - 2 }))
    expect(todayQueue(cold, NOW)).toHaveLength(0)
    expect(todayQueue([...cold, mk({ name: 'Inbound', source: 'expo', created_at: hoursAgo(5) })], NOW).map(x => x.name)).toEqual(['Inbound'])
    expect(todayQueue([mk({ name: 'Boosted', score: COLD_LEAD_MIN_SCORE })], NOW)).toHaveLength(1)
  })

  it('respects the limit and sorts by priority', () => {
    const many = Array.from({ length: 40 }, (_, i) => mk({ name: `P${i}`, stage: 'contacted', next_action_at: hoursAgo(1 + i % 5), score: i }))
    const q = todayQueue(many, NOW, 10)
    expect(q).toHaveLength(10)
    for (let i = 1; i < q.length; i++) expect(q[i - 1].priority).toBeGreaterThanOrEqual(q[i].priority)
  })

  it('computes end of day in IST', () => {
    expect(new Date(endOfTodayIst(new Date('2026-11-10T06:00:00Z'))).toISOString()).toBe('2026-11-10T18:30:00.000Z')
    expect(new Date(endOfTodayIst(new Date('2026-11-10T19:00:00Z'))).toISOString()).toBe('2026-11-11T18:30:00.000Z')
  })
})

describe('planSync', () => {
  const inc = (o: Partial<Incoming> = {}): Incoming => ({ name: 'Asha Patel', email: 'asha@example.com', phone: '+91 98765 43210', source: 'expo', source_ref: 'e1', segment: 'business', ...o })

  it('inserts a new person with a score, normalised fields and defaults', () => {
    const p = planSync([], [inc()], NOW)
    expect(p.inserts).toHaveLength(1)
    expect(p.inserts[0]).toMatchObject({ name: 'Asha Patel', email: 'asha@example.com', phone_norm: '9876543210', stage: 'new', segment: 'business', source: 'expo' })
    expect(p.inserts[0].score).toBeGreaterThan(40)
  })

  it('skips the founder own addresses and rows with nothing usable', () => {
    const p = planSync([], [inc({ email: 'hello@wyberai.com' }), { name: '', source: 'apollo' }, inc({ email: 'ok@example.com', source_ref: 'e2' })], NOW)
    expect(p.skipped.map(s => s.reason).sort()).toEqual(['invalid', 'owned'])
    expect(p.inserts).toHaveLength(1)
  })

  it('is idempotent: running the same source record twice adds nothing', () => {
    const first = planSync([], [inc()], NOW)
    const existing = first.inserts.map((r, i) => ({ ...r, id: `x${i}` }) as Contact)
    const second = planSync(existing, [inc()], NOW)
    expect(second.inserts).toHaveLength(0)
    expect(second.updates).toHaveLength(0)
  })

  it('matches the same person across sources by email, then by phone', () => {
    const existing = [mk({ id: 'a', email: 'asha@example.com', source: 'apollo', source_ref: 'ap1' }), mk({ id: 'b', phone: '9811111111', phone_norm: '9811111111', source: 'whatsapp_list' })]
    const p = planSync(existing, [inc({ source_ref: 'e9' }), inc({ name: 'Ravi', email: null, phone: '098111 11111', source: 'signup', source_ref: 's1' })], NOW)
    // Both were recognised as existing people (nothing inserted). Only "a" gains
    // information (the phone number); "b" has nothing new to fill, so no update.
    expect(p.inserts).toHaveLength(0)
    expect(p.updates.map(u => u.id)).toEqual(['a'])
    expect(p.updates[0].patch.phone_norm).toBe('9876543210')
  })

  it('fills blanks and merges tags but never overwrites edits or moves the stage', () => {
    const existing = mk({ id: 'a', email: 'asha@example.com', company: 'My Edited Co', stage: 'proposal', value_usd: 5000, tags: ['vip'], segment: 'software' })
    const p = planSync([existing], [inc({ company: 'Scraped Co', title: 'Founder', tags: ['built'], valueUsd: 100, segment: 'business', stage: 'new' })], NOW)
    const patch = p.updates[0].patch
    expect(patch.company).toBeUndefined()
    expect(patch.value_usd).toBeUndefined()
    expect(patch.segment).toBeUndefined()
    expect(patch.stage).toBeUndefined()
    expect(patch.title).toBe('Founder')
    expect(patch.tags!.sort()).toEqual(['built', 'vip'])
  })

  it('merges duplicates inside one import batch into a single row', () => {
    const p = planSync([], [inc({ source_ref: 'a' }), inc({ source: 'apollo', source_ref: 'b', company: 'Acme' }), inc({ name: 'Other', email: 'o@example.com', phone: null, source_ref: 'c' })], NOW)
    expect(p.inserts).toHaveLength(2)
    expect(p.inserts[0].company).toBe('Acme')
  })
})

describe('csv', () => {
  it('parses quotes, embedded commas, doubled quotes, newlines in fields and a BOM', () => {
    const rows = parseCsv('﻿name,note\r\n"Patel, Asha","said ""hi""\nthen left"\nRavi,plain\n')
    expect(rows).toEqual([['name', 'note'], ['Patel, Asha', 'said "hi"\nthen left'], ['Ravi', 'plain']])
  })

  it('maps Apollo-style headers, joins first and last name, and applies the import defaults', () => {
    const csv = 'First Name,Last Name,Email,Phone Number,Company Name,job_title,Location,Industry\nAsha,Patel,asha@acme.in,+91 98765 43210,Acme Tools,Founder,Ahmedabad,Mfg\n'
    const { incoming, unmapped } = csvToIncoming(csv, { source: 'apollo', segment: 'business', country: 'India', tags: ['expo-batch1'] })
    expect(incoming[0]).toMatchObject({ name: 'Asha Patel', email: 'asha@acme.in', company: 'Acme Tools', title: 'Founder', country: 'India', segment: 'business', source: 'apollo', tags: ['expo-batch1'] })
    expect(incoming[0].notes).toBe('City: Ahmedabad | Industry: Mfg')
    expect(unmapped).toEqual([])
  })

  it('carries over outreach state from a tracking sheet so contacted people are not re-queued as new', () => {
    const csv = [
      'First Name,Company,Job Title,WhatsApp Number,Sent (date),Replied,Slot booked,Notes',
      'Asha,Acme,Owner,9876543210,2026-11-05,,,',
      'Ravi,Beta,MD,9811111111,2026-11-05,Yes,,wants a GST tool',
      'Meera,Gamma,Partner,9822222222,2026-11-04,Yes,Yes,',
      'Kiran,Delta,Owner,9833333333,,,,',
      'Dev,Eps,Owner,9844444444,2026-11-05,No,No,',
    ].join('\n')
    const { incoming } = csvToIncoming(csv, { source: 'whatsapp_list', segment: 'business' })
    expect(incoming.map(i => i.stage)).toEqual(['contacted', 'replied', 'meeting_booked', undefined, 'contacted'])
    expect(incoming[0].lastTouchAt).toBe('2026-11-05T00:00:00.000Z')
    expect(incoming[3].lastTouchAt).toBeNull()
    expect(incoming[1].notes).toBe('wants a GST tool')
    const plan = planSync([], incoming, NOW)
    expect(plan.inserts.map(r => r.stage)).toEqual(['contacted', 'replied', 'meeting_booked', 'new', 'contacted'])
    expect(plan.inserts[0].last_touch_at).toBe('2026-11-05T00:00:00.000Z')
  })

  it('returns nothing for an empty or header-only file', () => {
    expect(csvToIncoming('', { source: 'x' }).incoming).toEqual([])
    expect(csvToIncoming('Name,Email\n', { source: 'x' }).incoming).toEqual([])
  })
})

describe('buildBrief', () => {
  it('summarises pipeline, weighted value, this-month wins, new leads and overdue actions', () => {
    const cs = [
      mk({ stage: 'proposal', value_usd: 10_000, next_action_at: hoursAgo(2), created_at: hoursAgo(24) }),
      mk({ stage: 'met', value_usd: 4_000, created_at: hoursAgo(24 * 20) }),
      mk({ stage: 'won', value_usd: 2_500, closed_at: '2026-11-03T00:00:00Z', created_at: hoursAgo(24 * 30) }),
      mk({ stage: 'won', value_usd: 9_999, closed_at: '2026-10-20T00:00:00Z', created_at: hoursAgo(24 * 40) }), // last month
      mk({ stage: 'lost', value_usd: 7_000, created_at: hoursAgo(24 * 60) }),
    ]
    const b = buildBrief(cs, NOW)
    expect(b.openCount).toBe(2)
    expect(b.openValueUsd).toBe(14_000)
    expect(b.weightedUsd).toBe(6_500 + 2_000)
    expect(b.wonMonthUsd).toBe(2_500)
    expect(b.wonMonthCount).toBe(1)
    expect(b.newLast7).toBe(1)
    expect(b.overdue).toBe(1)
    expect(b.text).toContain('Won this month: $2,500 (1 deal)')
    expect(b.text).toContain('Open pipeline: 2 opportunities, $14,000 total, $8,500 weighted')
  })

  it('reads cleanly when there is nothing yet', () => {
    const b = buildBrief([], NOW)
    expect(b.text).toContain('Won this month: $0 (0 deals)')
    expect(b.text).toContain('Nothing urgent in the queue.')
  })
})

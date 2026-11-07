import { describe, it, expect } from 'vitest'
import { expoLeadToIncoming, consultToIncoming, profileToIncoming, type ExpoLeadRow, type ConsultRow } from './sources'
import { planSync } from './upsert'

const expo = (o: Partial<ExpoLeadRow> = {}): ExpoLeadRow => ({
  id: 'e1', created_at: '2026-11-28T05:00:00Z', name: 'Asha Patel', whatsapp: '+91 98765 43210', email: 'asha@example.com',
  business: 'Patel Logistics', audience: 'Business owner', preferred_day: '28 Nov', pain_point: 'LR copies come back late',
  source: 'card / teg2026', status: 'new', ...o,
})

describe('expoLeadToIncoming', () => {
  it('maps audience to segment, keeps the pain point, and promises a reply within the hour', () => {
    const i = expoLeadToIncoming(expo())
    expect(i).toMatchObject({ source: 'expo', source_ref: 'e1', segment: 'business', stage: 'new', company: 'Patel Logistics', country: 'India' })
    expect(i.notes).toContain('LR copies come back late')
    expect(i.nextAction).toMatch(/WhatsApp/)
    expect(i.nextActionAt).toBe('2026-11-28T06:00:00.000Z')
    expect(i.tags).toEqual(['expo', 'teg2026', 'day:28nov'])
  })
  it('maps the lead-tool statuses onto pipeline stages', () => {
    const stage = (status: string) => expoLeadToIncoming(expo({ status })).stage
    expect([stage('met_at_booth'), stage('building'), stage('won'), stage('lost'), stage('weird')]).toEqual(['met', 'proposal', 'won', 'lost', 'new'])
    expect(expoLeadToIncoming(expo({ audience: 'Software company' })).segment).toBe('software')
    expect(expoLeadToIncoming(expo({ audience: 'Not given' })).segment).toBe('other')
    expect(expoLeadToIncoming(expo({ preferred_day: 'Any day' })).tags).toEqual(['expo', 'teg2026'])
  })
})

describe('consultToIncoming', () => {
  const m = (o: Partial<ConsultRow> = {}): ConsultRow => ({ id: 'm1', attendee_name: 'Ravi', attendee_email: 'ravi@example.com', scheduled_start: '2026-12-02T10:00:00Z', status: 'scheduled', converted: false, deal_value: null, notes: null, source: 'cal', ...o })
  it('turns a booked meeting into a "meeting booked" deal due at the meeting time', () => {
    expect(consultToIncoming(m())).toMatchObject({ stage: 'meeting_booked', nextActionAt: '2026-12-02T10:00:00Z', source: 'consult' })
  })
  it('maps completed, converted, cancelled and no-show', () => {
    expect(consultToIncoming(m({ status: 'completed' }))!.stage).toBe('met')
    expect(consultToIncoming(m({ converted: true, status: 'completed' }))!.stage).toBe('won')
    expect(consultToIncoming(m({ status: 'cancelled' }))!.stage).toBe('nurture')
    expect(consultToIncoming(m({ status: 'no_show' }))!.stage).toBe('nurture')
  })
  it('does not guess a currency for the recorded deal value', () => {
    const i = consultToIncoming(m({ deal_value: 40000, converted: true }))!
    expect(i.valueUsd).toBeUndefined()
    expect(i.notes).toContain('currency not recorded')
  })
  it('ignores a booking with no name and no email', () => {
    expect(consultToIncoming(m({ attendee_name: null, attendee_email: null }))).toBeNull()
  })
})

describe('profileToIncoming', () => {
  const p = { id: 'u1', email: 'dev@example.com', plan: 'free', country: 'IN', created_at: '2026-10-01T00:00:00Z' }
  it('only brings in signups that built something or pay', () => {
    expect(profileToIncoming(p, { built: false, published: false })).toBeNull()
    expect(profileToIncoming({ ...p, plan: 'spark' }, { built: false, published: false })!.tags).toContain('paid')
    const b = profileToIncoming(p, { built: true, published: true })!
    expect(b).toMatchObject({ source: 'signup_built', tags: ['signup', 'built', 'published'] })
  })
  it('skips accounts with no email', () => {
    expect(profileToIncoming({ ...p, email: null }, { built: true, published: false })).toBeNull()
  })
})

describe('end to end: the same person arriving from two sources becomes one contact', () => {
  it('merges an expo lead with their consult booking by email, keeping the first stage', () => {
    const plan = planSync([], [
      expoLeadToIncoming(expo({ email: 'asha@example.com', status: 'contacted' })),
      consultToIncoming({ id: 'm2', attendee_name: 'Asha Patel', attendee_email: 'asha@example.com', scheduled_start: '2026-12-02T10:00:00Z', status: 'scheduled', converted: false, deal_value: null, notes: 'wants GST tool', source: 'cal' })!,
    ])
    expect(plan.inserts).toHaveLength(1)
    expect(plan.inserts[0].stage).toBe('contacted')
    expect(plan.inserts[0].source).toBe('expo')
  })
})

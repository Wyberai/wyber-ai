import { describe, it, expect } from 'vitest'
import { summarizeIntent, MIN_PER_GROUP, loadIntentResults } from './intent-results'

const ev = (anon: string, variant: string, kind: string, door: string | null = null) => ({ anon_id: anon, variant, kind, door })
const visitors = (prefix: string, variant: string, n: number) => Array.from({ length: n }, (_, i) => ev(`${prefix}${i}`, variant, 'impression'))

describe('summarizeIntent', () => {
  it('counts each group separately, and counts a person once however many times they did something', () => {
    const events = [
      ...visitors('a', 'intent', 3), ...visitors('c', 'control', 2),
      ev('a0', 'intent', 'door_changed', 'business'), ev('a0', 'intent', 'door_changed', 'software'), ev('a1', 'intent', 'door_changed', 'business'),
      ev('a0', 'intent', 'chip_tapped'), ev('a0', 'intent', 'chip_tapped'), ev('a1', 'intent', 'submitted'),
    ]
    const r = summarizeIntent(events, [], new Set())
    expect(r.intent.visitors).toBe(3)
    expect(r.control.visitors).toBe(2)
    expect(r.intent.chose_a_door).toBe(2) // a0 and a1, not 3 clicks
    expect(r.intent.tapped_a_starter).toBe(1)
    expect(r.intent.submitted_a_prompt).toBe(1)
    expect(r.control.chose_a_door).toBe(0)
    expect(r.doors_chosen).toEqual({ business: 2, software: 1 })
  })

  it('links signups to their group, drops the founder, and works out who built something', () => {
    const profiles = [
      { id: 'u1', email: 'a@x.com', intent_variant: 'intent' }, { id: 'u2', email: 'b@x.com', intent_variant: 'intent' },
      { id: 'u3', email: 'c@x.com', intent_variant: 'control' }, { id: 'u4', email: 'hello@wyberai.com', intent_variant: 'intent' },
    ]
    const r = summarizeIntent(visitors('a', 'intent', 4).concat(visitors('c', 'control', 4)), profiles, new Set(['u1']))
    expect(r.intent.signups).toBe(2)
    expect(r.intent.signup_percent).toBe(50)
    expect(r.intent.built_something).toBe(1)
    expect(r.intent.built_percent_of_signups).toBe(50)
    expect(r.control.signups).toBe(1)
    expect(r.control.built_percent_of_signups).toBe(0)
  })

  it('never divides by zero', () => {
    const r = summarizeIntent([], [], new Set())
    expect(r.intent.signup_percent).toBeNull()
    expect(r.control.built_percent_of_signups).toBeNull()
  })

  it('says plainly when there is too little data, and stops saying so once both groups are big enough', () => {
    const few = summarizeIntent(visitors('a', 'intent', 10).concat(visitors('c', 'control', 10)), [], new Set())
    expect(few.enough_data).toBe(false)
    expect(few.verdict).toContain('Not enough yet')
    expect(few.verdict).toContain('10 on the adaptive page and 10 on the original')
    const many = summarizeIntent(visitors('a', 'intent', MIN_PER_GROUP).concat(visitors('c', 'control', MIN_PER_GROUP)), [], new Set())
    expect(many.enough_data).toBe(true)
    expect(many.verdict).toContain('noise')
  })
})

describe('loadIntentResults', () => {
  const NOW = new Date('2026-11-20T00:00:00Z')
  const fake = (tables: Record<string, unknown[] | { error: string }>) => ({
    from: (t: string) => {
      const api: Record<string, unknown> = {}
      for (const m of ['select', 'gte', 'not', 'in', 'limit']) api[m] = () => api
      api.then = (ok: (v: unknown) => unknown) => { const v = tables[t]; return Promise.resolve(Array.isArray(v) ? { data: v, error: null } : v ? { data: null, error: { message: (v as { error: string }).error } } : { data: [], error: null }).then(ok) }
      return api
    },
  })
  it('reports a missing events table instead of inventing numbers', async () => {
    expect(await loadIntentResults(fake({ intent_events: { error: 'relation does not exist' } }), 14, NOW)).toMatchObject({ error: expect.stringContaining('Experiment data unavailable') })
  })
  it('loads events, profiles and builds together', async () => {
    const r = await loadIntentResults(fake({
      intent_events: [ev('a1', 'intent', 'impression'), ev('c1', 'control', 'impression')],
      profiles: [{ id: 'u1', email: 'a@x.com', intent_variant: 'intent' }], projects: [{ user_id: 'u1' }],
    }), 14, NOW) as { intent: { visitors: number; built_something: number }; days: number }
    expect(r.days).toBe(14)
    expect(r.intent.visitors).toBe(1)
    expect(r.intent.built_something).toBe(1)
  })
})

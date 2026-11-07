import { describe, it, expect } from 'vitest'
import { FUNNEL_EVENTS, sanitizeProps, MAX_PROP_KEYS, MAX_PROP_STRING } from './funnel-events'

describe('FUNNEL_EVENTS', () => {
  it('contains the credit-wall and conversion events the report reads', () => {
    for (const e of [
      'first_generation_started', 'editor_credit_wall_shown', 'editor_simple_build_offered',
      'editor_simple_build_chosen', 'editor_out_of_credits_upgrade_clicked', 'checkout_initiated', 'app_published',
    ]) expect(FUNNEL_EVENTS.has(e)).toBe(true)
  })
  it('does not allow arbitrary or noisy events', () => {
    expect(FUNNEL_EVENTS.has('homepage_segment_shown')).toBe(false)
    expect(FUNNEL_EVENTS.has('')).toBe(false)
  })
})

describe('sanitizeProps', () => {
  it('keeps small primitives', () => {
    expect(sanitizeProps({ cost: 30, tier: 'small', ok: true, none: null })).toEqual({ cost: 30, tier: 'small', ok: true, none: null })
  })
  it('drops objects, arrays, functions, NaN and Infinity', () => {
    expect(sanitizeProps({ a: { x: 1 }, b: [1], c: () => 1, d: NaN, e: Infinity, ok: 1 })).toEqual({ ok: 1 })
  })
  it('caps string length and key count', () => {
    const out = sanitizeProps({ s: 'x'.repeat(500) })
    expect(out.s).toHaveLength(MAX_PROP_STRING)
    const many = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]))
    expect(Object.keys(sanitizeProps(many))).toHaveLength(MAX_PROP_KEYS)
  })
  it('cleans odd keys and handles non-objects', () => {
    expect(sanitizeProps({ 'a b$c': 1, '!!!': 2 })).toEqual({ abc: 1 })
    expect(sanitizeProps(null)).toEqual({})
    expect(sanitizeProps('x')).toEqual({})
    expect(sanitizeProps([1, 2])).toEqual({})
  })
})

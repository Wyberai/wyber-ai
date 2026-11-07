import { describe, it, expect } from 'vitest'
import { normalizePhone, resolveLeadSource, LEAD_STATUSES } from './expo-leads'
import { encodeAttribution } from './signup-attribution'

describe('normalizePhone', () => {
  it('treats common Indian formats as the same number', () => {
    const forms = ['+91 98765 43210', '09876543210', '98765-43210', '919876543210']
    expect(new Set(forms.map(normalizePhone))).toEqual(new Set(['9876543210']))
  })
  it('handles junk', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('abc')).toBe('')
  })
})

describe('resolveLeadSource', () => {
  const cookie = encodeAttribution({ source: 'linkedin', medium: 'social', campaign: 'expo', referrerHost: null, landingPath: '/' })

  it('prefers the form utm values', () => {
    expect(resolveLeadSource('card / teg2026', cookie)).toEqual({ source: 'card / teg2026', utmSource: 'card', utmCampaign: 'teg2026' })
  })
  it('falls back to the first-touch cookie when the form had no utm', () => {
    expect(resolveLeadSource('direct', cookie)).toEqual({ source: 'linkedin / expo', utmSource: 'linkedin', utmCampaign: 'expo' })
    expect(resolveLeadSource('', cookie).utmSource).toBe('linkedin')
  })
  it('is direct when nothing is known, and ignores a bad cookie', () => {
    expect(resolveLeadSource('', null)).toEqual({ source: 'direct', utmSource: null, utmCampaign: null })
    expect(resolveLeadSource('direct', 'garbage').source).toBe('direct')
  })
})

describe('LEAD_STATUSES', () => {
  it('starts at new and matches the SQL check constraint', () => {
    expect(LEAD_STATUSES[0]).toBe('new')
    expect([...LEAD_STATUSES]).toEqual(['new','contacted','meeting_booked','met_at_booth','building','won','lost'])
  })
})

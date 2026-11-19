import { describe, it, expect } from 'vitest'
import { extractFactsFromText, mergeFacts } from './facts'
import { parseFactsFromPrompt } from './generate'
import { factsSuffix } from '../website-facts'

describe('facts typed into the brief', () => {
  it('reads a name, a place, a WhatsApp number and hours that the owner wrote', () => {
    const f = extractFactsFromText('Website for Haveli Khamma, a homestay in the old blue city of Jodhpur. Guests enquire on WhatsApp 98765 43210. Reception is open 8am to 10pm daily.')
    expect(f.name).toBe('Haveli Khamma')
    expect(f.city).toBe('Jodhpur')
    expect(f.whatsapp).toBe('919876543210')
    expect(f.hours).toMatch(/^8am to 10pm/)
  })
  it('a number after "call" is a phone, not WhatsApp; an email is an email', () => {
    const f = extractFactsFromText('Website for a dental clinic in Ahmedabad. Call 98765 43210 or write to care@clinic.example.')
    expect(f.phone).toBe('98765 43210')
    expect(f.whatsapp).toBeUndefined()
    expect(f.email).toBe('care@clinic.example')
  })
  it('invents nothing: a generic brief yields no name and no contact facts', () => {
    const f = extractFactsFromText('Website for a family dental clinic that does check-ups and braces')
    expect(f).toEqual({})
  })
  it('an ambiguous second number is not guessed', () => {
    const f = extractFactsFromText('Website for Sunrise Yoga. Numbers 98765 43210 and 91234 56780 are both in use.')
    expect(f.whatsapp).toBeUndefined()
    expect(f.phone).toBeUndefined()
  })
  it('the exact "Make it yours" suffix wins over typed facts', () => {
    const p = 'Website for Haveli Khamma in Jodhpur, WhatsApp 90000 11111.' + factsSuffix({ name: 'Haveli Khamma', area: 'Navchokiya, Jodhpur', whatsapp: '98765 43210', hours: '' })
    const f = parseFactsFromPrompt(p)
    expect(f.whatsapp).toBe('919876543210')
    expect(f.city).toBe('Navchokiya, Jodhpur')
  })
  it('mergeFacts keeps typed facts the suffix does not cover', () => {
    expect(mergeFacts({ city: 'X' }, { city: 'Y', email: 'a@b.co' })).toEqual({ city: 'X', email: 'a@b.co' })
  })
})

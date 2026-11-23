import { describe, it, expect } from 'vitest'
import { isIndianPrompt } from './locale'
import { currencyFor } from '../saas-spec/generate'

describe('isIndianPrompt', () => {
  it('knows the small cities the old list missed (live: Nashik got dollars)', () => {
    for (const p of ['A mobile app for a home tuition teacher in Nashik', 'clinic in Kolhapur', 'shop in Mysuru', 'dairy in Anand, Gujarat', 'bakery, Thrissur']) expect(isIndianPrompt(p)).toBe(true)
  })
  it('knows rupee wording and +91 numbers', () => {
    for (const p of ['fees of Rs. 500 a month', 'price in rupees', 'call +91 98765 43210', 'budget ₹2 lakh']) expect(isIndianPrompt(p)).toBe(true)
  })
  it('does not turn a US or UK brief into rupees', () => {
    for (const p of ['Indian restaurant in Chicago', 'Anand runs a gym in Austin', 'tuition centre in Leeds', 'a salon in Salem, Oregon']) expect(isIndianPrompt(p)).toBe(false)
  })
  it('the SaaS pipeline uses the same check, and still honours euros and pounds', () => {
    expect(currencyFor('invoicing for a studio in Nashik')).toBe('₹')
    expect(currencyFor('billing for a shop in Berlin, prices in euro')).toBe('€')
    expect(currencyFor('crm for a plumber in Leeds, GBP')).toBe('£')
    expect(currencyFor('crm for a plumber in Denver')).toBe('$')
  })
})

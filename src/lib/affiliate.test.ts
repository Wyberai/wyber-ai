import { describe, it, expect } from 'vitest'
import { computeCommission, AFFILIATE_COMMISSION_RATE } from './affiliate'

describe('computeCommission', () => {
  it('computes 30% of a charge, rounded to cents', () => {
    expect(computeCommission(20)).toBe(6)
    expect(computeCommission(9.99)).toBe(3)
    expect(computeCommission(19.99)).toBe(6)
  })

  it('respects a custom rate', () => {
    expect(computeCommission(100, 0.1)).toBe(10)
  })

  it('never returns a negative or non-finite commission for bad input', () => {
    expect(computeCommission(0)).toBe(0)
    expect(computeCommission(-50)).toBe(0)
    expect(computeCommission(NaN)).toBe(0)
    expect(computeCommission(Infinity)).toBe(0)
  })

  it('default rate matches the advertised 30%', () => {
    expect(AFFILIATE_COMMISSION_RATE).toBe(0.30)
  })
})

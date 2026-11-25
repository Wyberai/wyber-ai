import { describe, expect, it } from 'vitest'
import { paymentCoversOrder } from './payment-check'

describe('the amount paid must cover the order before the registrar is charged', () => {
  it('accepts an exact or higher USD payment', () => {
    expect(paymentCoversOrder(1399, { total_amount: 1399, currency: 'USD' }).verdict).toBe('ok')
    expect(paymentCoversOrder(1399, { total_amount: 1500, currency: 'USD' }).verdict).toBe('ok')
  })
  it('holds a payment that is lower than the total (a buyer who lowered the pay-what-you-want amount)', () => {
    const r = paymentCoversOrder(1399, { total_amount: 100, currency: 'USD' })
    expect(r.verdict).toBe('short')
  })
  it('holds a payment made in another currency, since the order is in USD', () => {
    expect(paymentCoversOrder(1399, { total_amount: 200000, currency: 'INR' }).verdict).toBe('short')
  })
  it('treats a missing currency as USD and a missing amount as unverified (alert, do not block real orders)', () => {
    expect(paymentCoversOrder(1399, { total_amount: 1399 }).verdict).toBe('ok')
    expect(paymentCoversOrder(1399, {}).verdict).toBe('unverified')
    expect(paymentCoversOrder(1399, undefined).verdict).toBe('unverified')
  })
  it('reads the amount from the other field names the provider has used', () => {
    expect(paymentCoversOrder(500, { settlement_amount: 500 }).verdict).toBe('ok')
    expect(paymentCoversOrder(500, { amount: 499 }).verdict).toBe('short')
  })
})

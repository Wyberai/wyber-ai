import { describe, it, expect, vi } from 'vitest'
import { accrueAffiliateCommission, reverseAffiliateCommissionForPayment } from './affiliate'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lightweight fluent+thenable mock: each entry in `queue` is the resolved
// value for one `.from(...)` call, consumed in the exact order the function
// under test calls them (traced by hand against affiliate.ts — fragile to
// refactors, but this repo has no existing Supabase-mocking convention to
// build on, and these two functions are short/stable enough that a strict
// call-order queue is the pragmatic choice over a heavier ORM-style mock).
function makeMockAdmin(queue: Record<string, unknown>[]): SupabaseClient {
  let i = 0
  const chain: Record<string, unknown> = {}
  const passthrough = ['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete']
  for (const m of passthrough) chain[m] = vi.fn(() => chain)
  // Terminal methods AND bare awaits (insert/update with no .select()) all
  // resolve to the next queued response — real supabase-js query builders
  // are themselves thenable, which is what makes `await admin.from(...).insert(...)`
  // work without an explicit `.then()` call in the real client.
  chain.maybeSingle = vi.fn(() => Promise.resolve(queue[i++]))
  chain.single = vi.fn(() => Promise.resolve(queue[i++]))
  ;(chain as { then: (resolve: (v: unknown) => void) => void }).then = (resolve) => resolve(queue[i++])
  return { from: vi.fn(() => chain) } as unknown as SupabaseClient
}

describe('accrueAffiliateCommission', () => {
  it('does nothing when the payer was not referred by anyone', async () => {
    const admin = makeMockAdmin([])
    await accrueAffiliateCommission(admin, {
      referredByUserId: null, referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'starter_monthly', chargeUsd: 29,
    })
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('does nothing when the referrer is not an APPROVED affiliate', async () => {
    const admin = makeMockAdmin([{ data: null }]) // affiliates lookup finds nothing
    await accrueAffiliateCommission(admin, {
      referredByUserId: 'user-a', referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'starter_monthly', chargeUsd: 29,
    })
    // Only the affiliates lookup should have run — no commission insert.
    expect(admin.from).toHaveBeenCalledTimes(1)
    expect(admin.from).toHaveBeenCalledWith('affiliates')
  })

  it('inserts a commission and increments the pending balance for an approved affiliate', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'aff-1' } },       // affiliates lookup: approved
      { error: null },                  // commission insert: success
      { data: { affiliate_pending_usd: 10 } }, // current balance read
      { error: null },                  // balance update
    ])
    await accrueAffiliateCommission(admin, {
      referredByUserId: 'user-a', referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'starter_monthly', chargeUsd: 29,
    })
    expect(admin.from).toHaveBeenCalledWith('affiliate_commissions')
    expect(admin.from).toHaveBeenCalledWith('profiles')
  })

  it('treats a duplicate-payment unique violation as a silent no-op, not an error', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'aff-1' } },
      { error: { code: '23505', message: 'duplicate key' } }, // already accrued for this payment
    ])
    await expect(accrueAffiliateCommission(admin, {
      referredByUserId: 'user-a', referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'starter_monthly', chargeUsd: 29,
    })).resolves.not.toThrow()
  })

  it('never throws even if every DB call fails', async () => {
    const admin: SupabaseClient = {
      from: vi.fn(() => { throw new Error('DB is down') }),
    } as unknown as SupabaseClient
    await expect(accrueAffiliateCommission(admin, {
      referredByUserId: 'user-a', referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'starter_monthly', chargeUsd: 29,
    })).resolves.not.toThrow()
  })

  it('skips zero-value charges (e.g. unpriced plans) without inserting a commission', async () => {
    const admin = makeMockAdmin([{ data: { id: 'aff-1' } }])
    await accrueAffiliateCommission(admin, {
      referredByUserId: 'user-a', referredUserId: 'user-b', dodoEventType: 'payment.succeeded',
      dodoPaymentId: 'pay_1', planKey: 'growth_monthly', chargeUsd: 0,
    })
    expect(admin.from).not.toHaveBeenCalledWith('affiliate_commissions')
  })
})

describe('reverseAffiliateCommissionForPayment', () => {
  it('does nothing when no commission exists for this payment', async () => {
    const admin = makeMockAdmin([{ data: null }])
    await reverseAffiliateCommissionForPayment(admin, 'pay_unknown')
    expect(admin.from).toHaveBeenCalledTimes(1)
  })

  it('reverses a pending commission and decrements the balance', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'com-1', affiliate_id: 'aff-1', commission_usd: 8.7, status: 'pending' } },
      { error: null }, // status update to reversed
      { data: { user_id: 'user-a' } }, // affiliate -> owning user
      { data: { affiliate_pending_usd: 20 } }, // current balance
      { error: null }, // balance decrement
    ])
    await reverseAffiliateCommissionForPayment(admin, 'pay_1')
    expect(admin.from).toHaveBeenCalledWith('affiliates')
  })

  it('does NOT touch the balance for a commission already marked paid', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'com-1', affiliate_id: 'aff-1', commission_usd: 8.7, status: 'paid' } },
    ])
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await reverseAffiliateCommissionForPayment(admin, 'pay_1')
    // Only the initial lookup ran — no update/decrement calls for an
    // already-paid commission (money already left the building manually).
    expect(admin.from).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('is a no-op for a commission already reversed (does not double-decrement)', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'com-1', affiliate_id: 'aff-1', commission_usd: 8.7, status: 'reversed' } },
    ])
    await reverseAffiliateCommissionForPayment(admin, 'pay_1')
    expect(admin.from).toHaveBeenCalledTimes(1)
  })
})

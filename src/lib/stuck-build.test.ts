import { describe, it, expect, vi } from 'vitest'
import { withTimeout, isBuildStuck, STUCK_BUILD_IDLE_MS } from './stuck-build'

describe('withTimeout', () => {
  it('returns the value when it arrives in time', async () => {
    expect(await withTimeout(Promise.resolve([1]), 1000, [])).toEqual([1])
  })
  it('returns the fallback when the promise never settles (the hung plan request)', async () => {
    vi.useFakeTimers()
    const p = withTimeout(new Promise<number[]>(() => {}), 25_000, [])
    await vi.advanceTimersByTimeAsync(25_001)
    expect(await p).toEqual([])
    vi.useRealTimers()
  })
  it('returns the fallback instead of rejecting', async () => {
    expect(await withTimeout(Promise.reject(new Error('boom')), 1000, 'fallback')).toBe('fallback')
  })
})

describe('isBuildStuck', () => {
  const base = { isGenerating: true, inflight: 0, lastActivityAt: 0, now: STUCK_BUILD_IDLE_MS + 1 }
  it('is stuck when working, nothing running, and idle long enough', () => expect(isBuildStuck(base)).toBe(true))
  it('is not stuck while a request is running', () => expect(isBuildStuck({ ...base, inflight: 1 })).toBe(false))
  it('is not stuck when recently active', () => expect(isBuildStuck({ ...base, now: 1000 })).toBe(false))
  it('is not stuck when nothing is generating', () => expect(isBuildStuck({ ...base, isGenerating: false })).toBe(false))
})

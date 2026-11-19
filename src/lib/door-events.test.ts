import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn(async () => ({ error: null }))
const hit = vi.fn(async () => true)
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({ rpc }) }))
vi.mock('@/lib/agency/limits', () => ({ hit: (...a: unknown[]) => (hit as (...x: unknown[]) => Promise<boolean>)(...a) }))

import { isDoorEvent, DOORS, STEPS } from './door-events'
import { POST } from '@/app/api/door-event/route'
import { NextRequest } from 'next/server'

const req = (body: unknown) => new NextRequest('http://x/api/door-event', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'x-forwarded-for': '1.2.3.4' } })

describe('door events allowlist', () => {
  it('accepts every door/step pair and nothing else', () => {
    for (const d of DOORS) for (const s of STEPS) expect(isDoorEvent(d, s)).toBe(true)
    expect(isDoorEvent('admin', 'view')).toBe(false)
    expect(isDoorEvent('home', 'drop table')).toBe(false)
    expect(isDoorEvent(undefined, undefined)).toBe(false)
    expect(isDoorEvent(1, 2)).toBe(false)
  })
})

describe('POST /api/door-event', () => {
  beforeEach(() => { rpc.mockClear(); hit.mockClear(); hit.mockResolvedValue(true) })

  it('counts a valid event and answers 204', async () => {
    const res = await POST(req({ door: 'solve', step: 'view' }))
    expect(res.status).toBe(204)
    expect(rpc).toHaveBeenCalledWith('door_count_inc', { p_door: 'solve', p_step: 'view' })
  })

  it('ignores unknown names, bad JSON and extra fields without erroring', async () => {
    expect((await POST(req({ door: 'x', step: 'view' }))).status).toBe(204)
    expect((await POST(req('not json'))).status).toBe(204)
    await POST(req({ door: 'home', step: 'view', text: 'my secret idea', user: 'a@b.c' }))
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('door_count_inc', { p_door: 'home', p_step: 'view' })
  })

  it('does not count once the per-visitor limit is hit', async () => {
    hit.mockResolvedValue(false)
    expect((await POST(req({ door: 'home', step: 'view' }))).status).toBe(204)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('never shows an error when the database fails', async () => {
    rpc.mockRejectedValueOnce(new Error('down'))
    expect((await POST(req({ door: 'home', step: 'view' }))).status).toBe(204)
  })
})

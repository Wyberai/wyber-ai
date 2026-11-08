import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { intentAvailable } from './server'
import { OWNER_COOKIE, ownerToken } from '@/lib/owner-preview'

const req = (headers: Record<string, string> = {}) => new NextRequest('http://localhost/api/intent', { method: 'POST', headers })

afterEach(() => { vi.unstubAllEnvs() })

describe('intentAvailable', () => {
  it('is off for the public while the flag is off, even from India', async () => {
    vi.stubEnv('NEXT_PUBLIC_INTENT_EXPERIMENT', ''); vi.stubEnv('NODE_ENV', 'production')
    expect(await intentAvailable(req({ 'x-vercel-ip-country': 'IN' }))).toBe(false)
  })
  it('with the flag on, India only (in production)', async () => {
    vi.stubEnv('NEXT_PUBLIC_INTENT_EXPERIMENT', '1'); vi.stubEnv('NODE_ENV', 'production')
    expect(await intentAvailable(req({ 'x-vercel-ip-country': 'IN' }))).toBe(true)
    expect(await intentAvailable(req({ 'x-vercel-ip-country': 'US' }))).toBe(false)
    expect(await intentAvailable(req())).toBe(false)
  })
  it('the owner always has it, flag or no flag, because their browser carries the private owner cookie', async () => {
    vi.stubEnv('OWNER_PREVIEW_KEY', 'test-key'); vi.stubEnv('NEXT_PUBLIC_INTENT_EXPERIMENT', ''); vi.stubEnv('NODE_ENV', 'production')
    const token = await ownerToken()
    expect(token).not.toBe('')
    expect(await intentAvailable(req({ cookie: `${OWNER_COOKIE}=${token}` }))).toBe(true)
  })
  it('a forged or wrong owner cookie gets nothing', async () => {
    vi.stubEnv('OWNER_PREVIEW_KEY', 'test-key'); vi.stubEnv('NEXT_PUBLIC_INTENT_EXPERIMENT', ''); vi.stubEnv('NODE_ENV', 'production')
    expect(await intentAvailable(req({ cookie: `${OWNER_COOKIE}=deadbeef` }))).toBe(false)
    expect(await intentAvailable(req({ cookie: `${OWNER_COOKIE}=true` }))).toBe(false)
  })
  it('with no owner key configured the owner path is disabled entirely', async () => {
    vi.stubEnv('OWNER_PREVIEW_KEY', ''); vi.stubEnv('NEXT_PUBLIC_INTENT_EXPERIMENT', ''); vi.stubEnv('NODE_ENV', 'production')
    expect(await intentAvailable(req({ cookie: `${OWNER_COOKIE}=` }))).toBe(false)
  })
})

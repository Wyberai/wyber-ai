import { describe, it, expect, vi, afterEach } from 'vitest'
import { normalizeUrl, safeFetch } from './safe-url'

afterEach(() => vi.restoreAllMocks())

describe('normalizeUrl', () => {
  it('refuses internal addresses and non-web schemes', () => {
    for (const bad of ['http://localhost', 'http://127.0.0.1', 'http://10.0.0.5', 'http://169.254.169.254/latest', 'ftp://x.test', 'file:///etc/passwd']) {
      expect(normalizeUrl(bad), bad).toBeNull()
    }
  })
  it('adds https and accepts a public host', () => {
    expect(normalizeUrl('example.org')?.toString()).toBe('https://example.org/')
  })
})

describe('safeFetch', () => {
  it('stops a redirect to an internal address', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }))
    await expect(safeFetch('https://public.test/')).rejects.toThrow('blocked')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
  it('follows a safe redirect', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/home' } }))
      .mockResolvedValueOnce(new Response('hello', { status: 200 }))
    const res = await safeFetch('https://public.test/')
    expect(await res.text()).toBe('hello')
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('gives up on a redirect loop', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 302, headers: { location: 'https://public.test/' } }))
    await expect(safeFetch('https://public.test/')).rejects.toThrow('redirects')
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'
import { guardTools, keyUsable, normalizeKeyOptions, scopesFor, READ_ONLY_SCOPE, KEY_LIMIT } from './guard'

describe('which keys can be used', () => {
  const now = new Date('2026-11-25T00:00:00Z')
  it('refuses revoked, expired and missing keys, accepts the rest', () => {
    expect(keyUsable(null, now)).toBe(false)
    expect(keyUsable({ active: false }, now)).toBe(false)
    expect(keyUsable({ active: true, expires_at: '2026-11-24T23:59:59Z' }, now)).toBe(false)
    expect(keyUsable({ active: true, expires_at: '2026-11-25T00:00:00Z' }, now)).toBe(false) // expires at that instant
    expect(keyUsable({ active: true, expires_at: '2027-01-01T00:00:00Z' }, now)).toBe(true)
    expect(keyUsable({ active: true, expires_at: null }, now)).toBe(true)
    expect(keyUsable({ active: true }, now)).toBe(true) // a key from before the expiry column existed
  })
  it('a read key presents the read-only scope, everything else is full access as before', () => {
    expect(scopesFor({ scope: 'read' })).toEqual([READ_ONLY_SCOPE])
    expect(scopesFor({ scope: 'full' })).toEqual([])
    expect(scopesFor({})).toEqual([])
  })
})

describe('creating a key', () => {
  const now = new Date('2026-11-25T00:00:00Z')
  it('defaults to full access with no expiry, as keys always were', () => {
    expect(normalizeKeyOptions({}, now)).toEqual({ ok: true, name: 'Default', scope: 'full', expiresAt: null })
  })
  it('takes read-only and an expiry, and works the date out', () => {
    expect(normalizeKeyOptions({ name: 'Cursor', scope: 'read', expiresInDays: 90 }, now)).toEqual({ ok: true, name: 'Cursor', scope: 'read', expiresAt: '2027-02-23T00:00:00.000Z' })
  })
  it('refuses anything it does not recognise instead of guessing', () => {
    expect(normalizeKeyOptions({ scope: 'admin' }, now).ok).toBe(false)
    expect(normalizeKeyOptions({ expiresInDays: 7 }, now).ok).toBe(false)
    expect(normalizeKeyOptions({ expiresInDays: -1 }, now).ok).toBe(false)
  })
  it('cleans the name: no control characters, trimmed, at most 60 characters', () => {
    const r = normalizeKeyOptions({ name: `  My\u0000 agent\n${'x'.repeat(100)}` }, now)
    expect(r.ok && r.name.length).toBeLessThanOrEqual(60)
    expect(r.ok && /[\u0000-\u001f]/.test(r.name)).toBe(false)
    expect(KEY_LIMIT).toBe(20)
  })
})

describe('the read-only guard in front of every tool', () => {
  const makeServer = () => {
    const registered: Record<string, (...a: unknown[]) => Promise<{ isError?: boolean; content?: { text: string }[] }>> = {}
    const server = { marker: 'kept', tool(...args: unknown[]) { registered[args[0] as string] = args[args.length - 1] as never; return this } }
    guardTools(server)
    return { server, registered }
  }
  const call = (fn: (...a: unknown[]) => Promise<unknown>, scopes: string[], withArgs = true) =>
    withArgs ? fn({ id: 1 }, { authInfo: { scopes } }) : fn({ authInfo: { scopes } })

  it('lets a read-only key read, and stops it changing anything', async () => {
    const { server, registered } = makeServer()
    const reads = vi.fn(async () => ({ content: [{ type: 'text', text: 'ok' }] }))
    const writes = vi.fn(async () => ({ content: [{ type: 'text', text: 'changed' }] }))
    server.tool('list_projects', 'List', {}, { readOnlyHint: true }, reads)
    server.tool('delete_project', 'Delete', {}, { readOnlyHint: false, destructiveHint: true }, writes)
    expect((await call(registered.list_projects, [READ_ONLY_SCOPE]) as { isError?: boolean }).isError).toBeUndefined()
    const blocked = await call(registered.delete_project, [READ_ONLY_SCOPE]) as { isError?: boolean; content: { text: string }[] }
    expect(blocked.isError).toBe(true)
    expect(blocked.content[0].text).toContain('read-only')
    expect(reads).toHaveBeenCalledTimes(1)
    expect(writes).not.toHaveBeenCalled()
  })
  it('a full-access key can call every tool, exactly as before', async () => {
    const { server, registered } = makeServer()
    const writes = vi.fn(async () => ({ content: [{ type: 'text', text: 'changed' }] }))
    server.tool('delete_project', 'Delete', {}, { readOnlyHint: false }, writes)
    expect((await call(registered.delete_project, []) as { isError?: boolean }).isError).toBeUndefined()
    expect(writes).toHaveBeenCalledTimes(1)
  })
  it('a tool that does not say it only reads is treated as one that changes things', async () => {
    const { server, registered } = makeServer()
    const cb = vi.fn(async () => ({ content: [{ type: 'text', text: 'x' }] }))
    server.tool('mystery', 'No annotations', cb)               // name, description, callback only
    server.tool('mystery2', 'Annotated badly', {}, { title: 'x' }, cb)
    expect((await call(registered.mystery, [READ_ONLY_SCOPE], false) as { isError?: boolean }).isError).toBe(true)
    expect((await call(registered.mystery2, [READ_ONLY_SCOPE]) as { isError?: boolean }).isError).toBe(true)
    expect(cb).not.toHaveBeenCalled()
  })
  it('keeps the original arguments and the server it belongs to', async () => {
    const { server, registered } = makeServer()
    const seen: unknown[] = []
    server.tool('echo', 'Echo', {}, { readOnlyHint: true }, async (...a: unknown[]) => { seen.push(...a); return { content: [] } })
    await call(registered.echo, [])
    expect(seen[0]).toEqual({ id: 1 })
    expect(server.marker).toBe('kept')
  })
})

// The real key check, with a stand-in database.
const rows: Record<string, Record<string, unknown>> = {}
let lastLookup = ''
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: (_c: string, v: string) => { lastLookup = v; return { single: async () => ({ data: rows[v] ?? null }) } } }),
      update: () => ({ eq: () => Promise.resolve({}) }),
    }),
  }),
}))
vi.mock('@/lib/oauth/tokens', () => ({ verifyAccessToken: () => null }))

describe('the MCP key check', () => {
  beforeEach(() => { for (const k of Object.keys(rows)) delete rows[k] })
  const sha = (s: string) => createHash('sha256').update(s).digest('hex')
  const req = (key: string) => new Request('https://x.test/api/mcp', { headers: { 'x-api-key': key } })

  it('looks the key up by its hash, never by the key itself', async () => {
    const { verifyToken } = await import('./auth')
    rows[sha('wyb_good')] = { id: 'k1', user_id: 'u1', active: true }
    const info = await verifyToken(req('wyb_good'))
    expect(info?.extra?.userId).toBe('u1')
    expect(lastLookup).toBe(sha('wyb_good'))
    expect(info?.scopes).toEqual([])
  })
  it('a read-only key carries the read-only scope', async () => {
    const { verifyToken } = await import('./auth')
    rows[sha('wyb_read')] = { id: 'k2', user_id: 'u1', active: true, scope: 'read' }
    expect((await verifyToken(req('wyb_read')))?.scopes).toEqual([READ_ONLY_SCOPE])
  })
  it('refuses a revoked key, an expired key and an unknown key', async () => {
    const { verifyToken } = await import('./auth')
    rows[sha('wyb_revoked')] = { id: 'k3', user_id: 'u1', active: false }
    rows[sha('wyb_old')] = { id: 'k4', user_id: 'u1', active: true, expires_at: '2020-01-01T00:00:00Z' }
    expect(await verifyToken(req('wyb_revoked'))).toBeUndefined()
    expect(await verifyToken(req('wyb_old'))).toBeUndefined()
    expect(await verifyToken(req('wyb_nope'))).toBeUndefined()
    expect(await verifyToken(req(''))).toBeUndefined()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The REST door, with the tool server and the limiter stood in, so what is checked is the door itself: who gets in, what
// is forwarded, and what comes back.
let allowed = true
const calls: Array<{ method: string; params?: unknown }> = []
let answer: { status: number; rpc: unknown } = { status: 200, rpc: { result: { content: [{ type: 'text', text: '{"ok":1}' }] } } }

vi.mock('@/lib/agency/limits', () => ({ hit: async () => allowed }))
vi.mock('@/lib/api-gateway/call', () => ({ callMcp: async (_req: unknown, method: string, params?: unknown) => { calls.push({ method, params }); return answer } }))

const call = (name: string, body: string, headers: Record<string, string> = { 'x-api-key': 'wyb_test' }) =>
  new NextRequest(`https://x.test/api/v1/tools/${name}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })

describe('POST /api/v1/tools/{name}', () => {
  beforeEach(() => { allowed = true; calls.length = 0; answer = { status: 200, rpc: { result: { content: [{ type: 'text', text: '{"projects":["a"]}' }] } } } })

  it('runs the tool with the arguments and returns its result', async () => {
    const { POST } = await import('./tools/[name]/route')
    const res = await POST(call('list_projects', '{"limit":5}'), { params: Promise.resolve({ name: 'list_projects' }) })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, result: { projects: ['a'] } })
    expect(calls).toEqual([{ method: 'tools/call', params: { name: 'list_projects', arguments: { limit: 5 } } }])
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
  it('asks for a key when there is none, and calls nothing', async () => {
    const { POST } = await import('./tools/[name]/route')
    const res = await POST(call('list_projects', '{}', {}), { params: Promise.resolve({ name: 'list_projects' }) })
    expect(res.status).toBe(401)
    expect(calls).toHaveLength(0)
  })
  it('passes on a refusal of the key itself as 401', async () => {
    answer = { status: 401, rpc: null }
    const { POST } = await import('./tools/[name]/route')
    const res = await POST(call('list_projects', '{}'), { params: Promise.resolve({ name: 'list_projects' }) })
    expect(res.status).toBe(401)
    expect((await res.json()).error).toContain('not valid')
  })
  it('a read-only key that tries to change something gets 403 with the reason', async () => {
    answer = { status: 200, rpc: { result: { isError: true, content: [{ type: 'text', text: 'This API key is read-only, so it cannot make changes.' }] } } }
    const { POST } = await import('./tools/[name]/route')
    const res = await POST(call('delete_project', '{"project_id":"p"}'), { params: Promise.resolve({ name: 'delete_project' }) })
    expect(res.status).toBe(403)
    expect((await res.json()).error).toContain('read-only')
  })
  it('limits how fast one key can call, and says when to try again', async () => {
    allowed = false
    const { POST } = await import('./tools/[name]/route')
    const res = await POST(call('list_projects', '{}'), { params: Promise.resolve({ name: 'list_projects' }) })
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('60')
    expect(calls).toHaveLength(0)
  })
  it('refuses odd tool names and malformed bodies before forwarding anything', async () => {
    const { POST } = await import('./tools/[name]/route')
    expect((await POST(call('..%2Fmcp', '{}'), { params: Promise.resolve({ name: '../mcp' }) })).status).toBe(404)
    expect((await POST(call('list_projects', 'not json'), { params: Promise.resolve({ name: 'list_projects' }) })).status).toBe(400)
    expect(calls).toHaveLength(0)
  })
})

describe('GET /api/v1/tools and the OpenAPI description', () => {
  beforeEach(() => { allowed = true; calls.length = 0 })
  it('lists the tools for a valid key and needs a key to do it', async () => {
    answer = { status: 200, rpc: { result: { tools: [{ name: 'list_projects', description: 'List', annotations: { readOnlyHint: true } }] } } }
    const { GET } = await import('./tools/route')
    const ok = await GET(new NextRequest('https://x.test/api/v1/tools', { headers: { 'x-api-key': 'wyb_test' } }))
    expect(ok.status).toBe(200)
    expect((await ok.json()).tools[0]).toMatchObject({ name: 'list_projects', readOnly: true })
    expect((await GET(new NextRequest('https://x.test/api/v1/tools'))).status).toBe(401)
  })
  it('the OpenAPI document is public, describes both calls, and names the key header', async () => {
    const { GET } = await import('./openapi.json/route')
    const spec = await (GET()).json()
    expect(spec.openapi).toMatch(/^3\./)
    expect(Object.keys(spec.paths)).toEqual(['/api/v1/tools', '/api/v1/tools/{name}'])
    expect(spec.components.securitySchemes.ApiKey).toEqual({ type: 'apiKey', in: 'header', name: 'x-api-key' })
  })
})

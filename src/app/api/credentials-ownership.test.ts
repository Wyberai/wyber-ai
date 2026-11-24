import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Saving a credential on a project: only on a project the caller may change. The service-role write in /api/tools would
// otherwise let anyone who knew a project id replace someone else's saved connection and take it over.

const upserts: Array<{ table: string; row: Record<string, unknown> }> = []
let allowed = true
const ownerCalls: string[] = []

vi.mock('@/lib/project-access', () => ({
  mayActOnProject: async (_db: unknown, userId: string, projectId: string) => { ownerCalls.push(`${userId}:${projectId}`); return allowed },
}))
vi.mock('@/lib/supabase/server', () => {
  const db = { from: (table: string) => ({ upsert: (row: Record<string, unknown>) => { upserts.push({ table, row }); return { error: null, select: () => ({ single: async () => ({ data: row, error: null }) }) } } }) }
  return {
    createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'attacker' } } }) }, ...db }),
    createAdminClient: async () => db,
  }
})

const post = (path: string, body: unknown) => new NextRequest(`https://x.test${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

describe('saving a credential on a project', () => {
  beforeEach(() => {
    upserts.length = 0; ownerCalls.length = 0; allowed = true
    process.env.CREDENTIAL_ENCRYPTION_KEY = 'k'.repeat(40)
    process.env.SECRETS_ENCRYPTION_KEY = 'ab'.repeat(32)
  })

  it('/api/tools refuses a project the caller may not change, and writes nothing', async () => {
    const { TOOL_REGISTRY } = await import('@/lib/tool-registry')
    const tool = TOOL_REGISTRY.find(t => t.credentials.length > 0)!
    const credentials = Object.fromEntries(tool.credentials.map(c => [c.key, 'value-123456']))
    allowed = false
    const { POST } = await import('./tools/route')
    const res = await POST(post('/api/tools', { projectId: 'victims-project', toolId: tool.id, credentials }))
    expect(res.status).toBe(404)
    expect(upserts).toHaveLength(0)
    expect(ownerCalls).toEqual(['attacker:victims-project'])
  })

  it('/api/tools still saves on a project the caller may change, encrypted', async () => {
    const { TOOL_REGISTRY } = await import('@/lib/tool-registry')
    const tool = TOOL_REGISTRY.find(t => t.credentials.length > 0)!
    const credentials = Object.fromEntries(tool.credentials.map(c => [c.key, 'value-123456']))
    const { POST } = await import('./tools/route')
    const res = await POST(post('/api/tools', { projectId: 'my-project', toolId: tool.id, credentials }))
    expect(res.status).toBe(200)
    expect(upserts).toHaveLength(1)
    const saved = upserts[0].row
    expect(saved.project_id).toBe('my-project')
    expect(saved.user_id).toBe('attacker') // the caller, because here the caller is the owner
    expect(JSON.stringify(saved.config)).not.toContain('value-123456') // never saved readable
  })

  it('/api/connectors refuses a project the caller may not change, and writes nothing', async () => {
    allowed = false
    const { POST } = await import('./connectors/route')
    const res = await POST(post('/api/connectors', { projectId: 'victims-project', service: 'resend', apiKey: 'sk-1234567890' }))
    expect(res.status).toBe(404)
    expect(upserts).toHaveLength(0)
  })

  it('/api/connectors still saves on an allowed project, encrypted, and rejects a malformed request', async () => {
    const { POST } = await import('./connectors/route')
    const ok = await POST(post('/api/connectors', { projectId: 'my-project', service: 'resend', apiKey: 'sk-1234567890' }))
    expect(ok.status).toBe(200)
    expect(String(upserts[0].row.api_key)).not.toContain('sk-1234567890')
    upserts.length = 0
    const bad = await POST(post('/api/connectors', { projectId: 'my-project', service: 'resend' }))
    expect(bad.status).toBe(400)
    expect(upserts).toHaveLength(0)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const runAll = vi.fn()
const previewAll = vi.fn()
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => ({}) }))
vi.mock('@/lib/ops/agents/llm', () => ({ anthropicCaller: () => async () => ({ text: '', inputTokens: 0, outputTokens: 0, model: 'm' }) }))
vi.mock('@/lib/ops/agents/run', () => ({ runAll: (...a: unknown[]) => runAll(...a) }))
vi.mock('@/lib/ops/agents/preview', () => ({ previewAll: (...a: unknown[]) => previewAll(...a) }))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '', auth: string | null = 'Bearer s3cret') =>
  GET(new NextRequest(`http://localhost/api/cron/ops-agents${qs}`, { headers: auth ? { authorization: auth } : {} }))

beforeEach(() => {
  process.env.CRON_SECRET = 's3cret'
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  delete process.env.OPS_AGENTS_DISABLED
  runAll.mockReset().mockResolvedValue([{ agent: 'outreach', created: 4, errors: 1 }, { agent: 'followup', created: 2, errors: 0 }])
  previewAll.mockReset().mockResolvedValue([{ agent: 'outreach', wouldDraft: 5, pending: 0, note: null }])
})

describe('GET /api/cron/ops-agents', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await call('', null)).status).toBe(401)
    expect((await call('', 'Bearer nope')).status).toBe(401)
    expect(runAll).not.toHaveBeenCalled()
  })

  it('stops completely when the master switch is on', async () => {
    process.env.OPS_AGENTS_DISABLED = 'true'
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'OPS_AGENTS_DISABLED' })
    expect(runAll).not.toHaveBeenCalled()
    expect(previewAll).not.toHaveBeenCalled()
  })

  it('dry run only previews: no model calls', async () => {
    const body = await (await call('?dry=1')).json()
    expect(body).toMatchObject({ dry: true, preview: [{ agent: 'outreach', wouldDraft: 5 }] })
    expect(runAll).not.toHaveBeenCalled()
  })

  it('does nothing without an AI key', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'ANTHROPIC_API_KEY not set' })
    expect(runAll).not.toHaveBeenCalled()
  })

  it('runs every agent and totals what was drafted', async () => {
    expect(await (await call()).json()).toMatchObject({ ok: true, created: 6, errors: 1 })
    expect(runAll).toHaveBeenCalledTimes(1)
  })
})

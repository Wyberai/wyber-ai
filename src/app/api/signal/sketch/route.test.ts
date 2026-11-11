import { describe, it, expect, vi, beforeEach } from 'vitest'

const hit = vi.fn(async (..._a: unknown[]) => true)
const aiSketch = vi.fn(async (..._a: unknown[]): Promise<unknown> => ({ title: 'T' }))
vi.mock('@/lib/agency/limits', () => ({ hit: (...a: unknown[]) => hit(...a) }))
vi.mock('@/lib/signal/sketch-ai', () => ({ aiSketch: (...a: unknown[]) => aiSketch(...a) }))

import { POST } from './route'
import { NextRequest } from 'next/server'

const req = (b: unknown) => new NextRequest('http://x/api/signal/sketch', { method: 'POST', body: JSON.stringify(b), headers: { 'x-forwarded-for': '9.9.9.9' } })
let n = 0
const text = () => `a tuition centre fee tracker number ${++n}`

describe('POST /api/signal/sketch', () => {
  beforeEach(() => { hit.mockClear(); aiSketch.mockClear(); hit.mockResolvedValue(true); process.env.ANTHROPIC_API_KEY = 'k'; delete process.env.SIGNAL_AI_SKETCH })

  it('returns the sketch for a valid request', async () => {
    const j = await (await POST(req({ door: 'idea', text: text(), type: 'app' }))).json()
    expect(j.sketch).toEqual({ title: 'T' })
  })
  it('is off without a key or with the kill switch, and never calls the model', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect((await (await POST(req({ door: 'idea', text: text() }))).json()).sketch).toBeNull()
    process.env.ANTHROPIC_API_KEY = 'k'; process.env.SIGNAL_AI_SKETCH = 'off'
    expect((await (await POST(req({ door: 'idea', text: text() }))).json()).sketch).toBeNull()
    expect(aiSketch).not.toHaveBeenCalled()
  })
  it('rejects bad input without calling the model', async () => {
    expect((await (await POST(req({ door: 'nope', text: text() }))).json()).sketch).toBeNull()
    expect((await (await POST(req({ door: 'idea', text: 'short' }))).json()).sketch).toBeNull()
    expect(aiSketch).not.toHaveBeenCalled()
  })
  it('stops at the per-visitor limit and at the site-wide daily cap', async () => {
    hit.mockResolvedValueOnce(false)
    expect((await (await POST(req({ door: 'idea', text: text() }))).json()).sketch).toBeNull()
    hit.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    expect((await (await POST(req({ door: 'idea', text: text() }))).json()).sketch).toBeNull()
    expect(aiSketch).not.toHaveBeenCalled()
  })
  it('answers a repeated question from memory without another model call', async () => {
    const t = text()
    await POST(req({ door: 'idea', text: t })); await POST(req({ door: 'idea', text: t }))
    expect(aiSketch).toHaveBeenCalledTimes(1)
  })
  it('falls back to null when the model fails', async () => {
    aiSketch.mockResolvedValueOnce(null)
    expect((await (await POST(req({ door: 'problem', text: text() }))).json()).sketch).toBeNull()
  })
})

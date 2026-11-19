import { describe, it, expect } from 'vitest'
import { costUsd, parseMessageJson, SseUsage } from './ai-usage'

describe('costUsd', () => {
  it('prices Sonnet 5.5 at $2 in, $10 out, $2.50 cache write, $0.10 cache read', () => {
    // The real build measured on 2026-11-09: 14,146 out, 71,041 cache write, 57,220 cache read.
    const c = costUsd('claude-sonnet-5-5', { input: 6, output: 14146, cacheWrite: 71041, cacheRead: 57220 })
    expect(c).toBeCloseTo(0.3248, 3)
  })
  it('prices Haiku 5.5 at the small-prompt rate and switches over 100k tokens', () => {
    expect(costUsd('claude-haiku-5-5', { input: 1000, output: 100, cacheWrite: 0, cacheRead: 0 })).toBeCloseTo(0.00015, 5)
    expect(costUsd('claude-haiku-5-5', { input: 200_000, output: 0, cacheWrite: 0, cacheRead: 0 })).toBeCloseTo(0.1, 4)
  })
  it('does not guess a price for an unknown model', () => {
    expect(costUsd('some-other-model', { input: 1, output: 1, cacheWrite: 0, cacheRead: 0 })).toBeNull()
  })
})

describe('parseMessageJson', () => {
  it('reads usage and model from a messages response', () => {
    const r = parseMessageJson({ model: 'claude-haiku-5-5', usage: { input_tokens: 12, output_tokens: 3, cache_read_input_tokens: 5 } })
    expect(r).toEqual({ model: 'claude-haiku-5-5', usage: { input: 12, output: 3, cacheWrite: 0, cacheRead: 5 } })
  })
  it('returns null when there is no usage', () => {
    expect(parseMessageJson({ error: 'x' })).toBeNull()
    expect(parseMessageJson(null)).toBeNull()
  })
})

describe('SseUsage', () => {
  const stream = [
    'event: message_start',
    'data: {"type":"message_start","message":{"model":"claude-sonnet-5-5","usage":{"input_tokens":6,"output_tokens":1,"cache_creation_input_tokens":100,"cache_read_input_tokens":50}}}',
    '',
    'event: content_block_delta',
    'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hi"}}',
    '',
    'event: message_delta',
    'data: {"type":"message_delta","usage":{"output_tokens":42}}',
    '',
  ].join('\n')

  it('combines message_start and the final message_delta', () => {
    const s = new SseUsage(); s.push(stream)
    expect(s.result()).toEqual({ model: 'claude-sonnet-5-5', usage: { input: 6, output: 42, cacheWrite: 100, cacheRead: 50 } })
  })
  it('handles a stream split at arbitrary byte boundaries', () => {
    const s = new SseUsage()
    for (let i = 0; i < stream.length; i += 7) s.push(stream.slice(i, i + 7))
    expect(s.result()?.usage.output).toBe(42)
    expect(s.result()?.usage.cacheWrite).toBe(100)
  })
  it('returns null when no usage events were seen', () => {
    const s = new SseUsage(); s.push('event: ping\ndata: {"type":"ping"}\n\n')
    expect(s.result()).toBeNull()
  })
})

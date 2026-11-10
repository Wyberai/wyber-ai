import { describe, it, expect } from 'vitest'
import { buildClassifierSystem, parseClassifierReply, classifyDirection, classifyDirectionVote, tallyVotes, pickDirectionSmart, CLASSIFIER_MODEL } from './direction-classifier'
import { DIRECTION_IDS, DIRECTIONS } from './design-directions'

const reply = (text: string, ok = true, status = 200) => async () => ({ ok, status, json: async () => ({ content: [{ type: 'text', text }] }) })
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

describe('classifier prompt', () => {
  it('lists every website direction with its fit terms and exclusions', () => {
    const s = buildClassifierSystem('website')
    for (const d of DIRECTIONS.filter(x => x.surfaces.includes('website'))) {
      expect(s).toContain(`${d.id} |`)
      expect(s).toContain(d.notFor)
    }
    expect(s).toContain('Reply with ONLY compact JSON')
    expect(s).toContain('"booking form" does not make a law firm a marketplace')
  })

  it('offers apps only app-capable directions', () => {
    const s = buildClassifierSystem('app')
    for (const d of DIRECTIONS) expect(s.includes(`${d.id} |`), d.id).toBe(d.surfaces.includes('app'))
  })

  it('uses the light-work model (Haiku 5.5)', () => {
    expect(CLASSIFIER_MODEL).toBe('claude-haiku-5-5')
  })
})

describe('parseClassifierReply', () => {
  it('accepts a valid id, with or without surrounding text', () => {
    expect(parseClassifierReply('{"id":"lg-wordmark"}', 'website')).toBe('lg-wordmark')
    expect(parseClassifierReply('Sure! {"id": "ag-earth"} done', 'website')).toBe('ag-earth')
  })
  it('rejects unknown ids, wrong-surface ids, non-strings and garbage', () => {
    expect(parseClassifierReply('{"id":"made-up"}', 'website')).toBeNull()
    expect(parseClassifierReply('{"id":"hl-anti-clinical"}', 'app')).toBeNull() // website-only direction
    expect(parseClassifierReply('{"id":42}', 'website')).toBeNull()
    expect(parseClassifierReply('not json', 'website')).toBeNull()
    expect(parseClassifierReply('', 'website')).toBeNull()
  })
})

describe('classifyDirection', () => {
  const key = 'test-key'
  it('returns the id the model chose', async () => {
    expect(await classifyDirection('a law firm', { apiKey: key, fetchImpl: reply('{"id":"lg-wordmark"}') as never })).toBe('lg-wordmark')
  })
  it('returns null (so the caller falls back) on HTTP errors, thrown errors, invalid ids and missing keys', async () => {
    expect(await classifyDirection('x', { apiKey: key, fetchImpl: reply('{"id":"lg-wordmark"}', false, 500) as never })).toBeNull()
    expect(await classifyDirection('x', { apiKey: key, fetchImpl: (async () => { throw new Error('network') }) as never })).toBeNull()
    expect(await classifyDirection('x', { apiKey: key, fetchImpl: reply('{"id":"nope"}') as never })).toBeNull()
    expect(await classifyDirection('x', { apiKey: '', fetchImpl: reply('{"id":"lg-wordmark"}') as never })).toBeNull()
    expect(await classifyDirection('   ', { apiKey: key, fetchImpl: reply('{"id":"lg-wordmark"}') as never })).toBeNull()
  })
  it('sends a small, safe request: Haiku, no thinking, low effort, trimmed prompt', async () => {
    let body: any
    const spy = (async (_u: string, init: { body: string }) => { body = JSON.parse(init.body); return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"id":"ag-earth"}' }] }) } }) as never
    await classifyDirection('r'.repeat(5000), { apiKey: key, fetchImpl: spy })
    expect(body.model).toBe('claude-haiku-5-5')
    expect(body.thinking).toEqual({ type: 'disabled' })
    expect(body.output_config).toEqual({ effort: 'low' })
    expect(body.max_tokens).toBeLessThanOrEqual(100)
    expect(body.messages[0].content.length).toBe(1500)
  })
})

describe('pickDirectionSmart', () => {
  it('an explicit id wins without calling the model', async () => {
    let called = false
    const r = await pickDirectionSmart('x', { id: 'dk-studio', apiKey: 'k', fetchImpl: (async () => { called = true; return reply('{"id":"ag-earth"}')() }) as never })
    expect(r).toMatchObject({ source: 'explicit' })
    expect(r.direction.id).toBe('dk-studio')
    expect(called).toBe(false)
  })
  it('uses the classifier when it answers', async () => {
    const r = await pickDirectionSmart('driving school', { apiKey: 'k', fetchImpl: reply('{"id":"br-saturated"}') as never })
    expect(r.source).toBe('classifier')
    expect(r.direction.id).toBe('br-saturated')
  })
  it('falls back to the keyword deal when the classifier fails, and always returns a real direction', async () => {
    const r = await pickDirectionSmart('A law firm in Ahmedabad', { apiKey: 'k', fetchImpl: reply('', false, 503) as never, rnd: seeded(3) })
    expect(r.source).toBe('keywords')
    expect(r.direction.id).toBe('lg-wordmark')
    const none = await pickDirectionSmart('whatever', { apiKey: '', rnd: seeded(2) })
    expect(DIRECTION_IDS).toContain(none.direction.id)
  })
})

describe('majority vote', () => {
  const seq = (ids: (string | null)[]) => { let i = 0; return (async () => { const id = ids[i++ % ids.length]; return id ? { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({ id }) }] }) } : { ok: false, status: 500, json: async () => ({}) } }) as never }

  it('tallyVotes: majority wins, a stray vote is outvoted, a full split or no votes is null, a lone valid vote is accepted', () => {
    expect(tallyVotes(['ed-brand-world', 'fb-warm-appetite', 'ed-brand-world'])).toBe('ed-brand-world')
    expect(tallyVotes(['a', 'b', 'c'].map(() => null))).toBeNull()
    expect(tallyVotes(['br-saturated', 'ed-brand-world', 'mn-signal'])).toBeNull()
    expect(tallyVotes([null, 'ag-earth', null])).toBe('ag-earth')
    expect(tallyVotes([])).toBeNull()
  })

  it('a stray draw (the restaurant direction for a driving school) is outvoted by two agreeing calls', async () => {
    const id = await classifyDirectionVote('driving school', { apiKey: 'k', votes: 3, fetchImpl: seq(['fb-warm-appetite', 'br-saturated', 'br-saturated']) })
    expect(id).toBe('br-saturated')
  })

  it('a three-way split returns null so the caller falls back to the keyword deal', async () => {
    const r = await pickDirectionSmart('a business website', { apiKey: 'k', votes: 3, fetchImpl: seq(['br-saturated', 'ed-brand-world', 'mn-signal']), rnd: () => 0.5 })
    expect(r.source).toBe('keywords')
  })

  it('makes the requested number of calls in parallel (capped at 5) and tolerates failures', async () => {
    let calls = 0
    const counting = (async () => { calls++; return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"id":"ag-earth"}' }] }) } }) as never
    await classifyDirectionVote('x', { apiKey: 'k', votes: 9, fetchImpl: counting })
    expect(calls).toBe(5)
    expect(await classifyDirectionVote('x', { apiKey: 'k', votes: 3, fetchImpl: seq([null, 'ag-earth', 'ag-earth']) })).toBe('ag-earth')
  })
})

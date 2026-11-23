import { describe, it, expect } from 'vitest'
import { askForJson, languagesFor, seededRandom, parseFactsFromPrompt, imageDirective, IMAGE_HYGIENE, BANNED_CLAIMS, IMAGE_BRIEF_BANNED, withTimeout, UI } from './index'

const reply = (text: string, i = 1, o = 1) => ({ text, inputTokens: i, outputTokens: o })

describe('shared core: the model loop', () => {
  it('returns the first reply that passes validation and counts every call', async () => {
    let used = 0
    const r = await askForJson<{ a: number }>({ call: async () => reply('{"a":1}', 10, 20), system: 's', user: 'u', validate: () => [], onUsage: x => { used += x.outputTokens } })
    expect(r).toEqual({ ok: true, value: { a: 1 } })
    expect(used).toBe(20)
  })
  it('repairs once, sending the problems and the previous reply back', async () => {
    const seen: string[] = []
    const r = await askForJson<{ n: number }>({
      call: async (_s, u) => { seen.push(u); return reply(seen.length === 1 ? '{"n":1}' : '{"n":2}') },
      system: 's', user: 'u', validate: v => ((v as { n: number }).n === 2 ? [] : ['n must be 2']),
    })
    expect(r.ok).toBe(true)
    expect(seen[1]).toMatch(/n must be 2/)
    expect(seen[1]).toMatch(/Previous reply:\n\{"n":1\}/)
  })
  it('never throws: bad JSON, a model error and a timeout all end as ok:false', async () => {
    expect((await askForJson({ call: async () => reply('nope'), system: '', user: '', validate: () => [] })).ok).toBe(false)
    expect((await askForJson({ call: async () => { throw new Error('overloaded') }, system: '', user: '', validate: () => [] })).ok).toBe(false)
    const slow = await askForJson({ call: () => new Promise(() => {}), system: '', user: '', validate: () => [], timeoutMs: 20, attempts: 1 })
    expect(slow.ok).toBe(false)
    await expect(withTimeout(new Promise(() => {}), 10)).rejects.toThrow(/timeout/)
  })
  it('stops after the attempts it was given', async () => {
    let calls = 0
    await askForJson({ call: async () => { calls++; return reply('{}') }, system: '', user: '', validate: () => ['x'], attempts: 3 })
    expect(calls).toBe(3)
  })
})

describe('shared core: the pieces every pillar reuses', () => {
  it('languages, seeded random, facts and image hygiene work without any website code', () => {
    expect(languagesFor('clinic in Surat', {})).toEqual(['en', 'hi', 'gu'])
    const a = seededRandom('p'), b = seededRandom('p')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(parseFactsFromPrompt('Website for Sunrise Yoga in Pune, WhatsApp 98765 43210').whatsapp).toBe('919876543210')
    expect(imageDirective({ brief: 'soft light', ratio: '4/3' }, 'A quiet studio.')).toContain(IMAGE_HYGIENE)
    expect(imageDirective({ brief: 'soft light', ratio: '4/5' }, 'x')).toMatch(/\| 9:16\}\}$/)
    expect(BANNED_CLAIMS.test('the best studio!')).toBe(true)
    expect(IMAGE_BRIEF_BANNED.test('a sign reading call now')).toBe(true)
    expect(Object.keys(UI)).toEqual(['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn'])
  })
  it('the website pillar re-exports the core, so there is one implementation', async () => {
    const core = await import('./index')
    const web = await import('../website-spec')
    expect(web.parseFactsFromPrompt).toBe(core.parseFactsFromPrompt)
    expect(web.languagesFor).toBe(core.languagesFor)
    expect(web.seededRandom).toBe(core.seededRandom)
    expect(web.BANNED_CLAIMS).toBe(core.BANNED_CLAIMS)
    expect(web.imageDirective).toBe(core.imageDirective)
  })
})

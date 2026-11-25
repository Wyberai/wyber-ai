import { describe, it, expect } from 'vitest'
import { scrubClaims, BANNED_CLAIMS } from './claims'
import { askForJson } from './ask'

describe('scrubClaims', () => {
  it('takes unproven claims out of every string and leaves keys, numbers and structure alone', () => {
    const v = { title: 'The best pickles in town!', n: 3, items: [{ text: 'Award-winning jars, made by hand' }, { text: 'Fresh batches' }] }
    const out = scrubClaims(v)
    expect(out.n).toBe(3)
    expect(Object.keys(out)).toEqual(['title', 'n', 'items'])
    expect(JSON.stringify(out)).not.toMatch(BANNED_CLAIMS)
    expect(out.items[1].text).toBe('Fresh batches')
    expect(out.title).toBe('The pickles in town.')
  })
  it('does not touch an object it does not need to', () => {
    const v = { a: 'Home-made jars', b: ['one', 'two'] }
    expect(scrubClaims(v)).toEqual(v)
  })
})

describe('askForJson scrub (last resort)', () => {
  const ok = (v: unknown) => (JSON.stringify(v).match(BANNED_CLAIMS) ? ['contains a claim'] : [])
  const call = (text: string) => async () => ({ text, inputTokens: 1, outputTokens: 1 })

  it('a reply that only has a stray claim ships after the claim is stripped, instead of failing the build', async () => {
    const r = await askForJson<{ t: string }>({ call: call(JSON.stringify({ t: 'The best jars' })), system: 's', user: 'u', validate: ok, scrub: v => scrubClaims(v) })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.t).toBe('The jars')
  })
  it('still fails when the scrubbed reply is not valid for some other reason, and when no scrub is given', async () => {
    const bad = (v: unknown) => ((v as { t?: string }).t === 'The jars' ? ['wrong'] : ok(v))
    const r1 = await askForJson({ call: call(JSON.stringify({ t: 'The best jars' })), system: 's', user: 'u', validate: bad, scrub: v => scrubClaims(v) })
    expect(r1.ok).toBe(false)
    const r2 = await askForJson({ call: call(JSON.stringify({ t: 'The best jars' })), system: 's', user: 'u', validate: ok })
    expect(r2.ok).toBe(false)
  })
})

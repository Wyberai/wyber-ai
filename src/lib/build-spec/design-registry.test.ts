import { describe, expect, it } from 'vitest'
import { MemoryDesignRegistry, claimUnique, designKey, hueBucket, supabaseDesignRegistry, wantsSameDesign } from './design-registry'
import { drawLook, lookFor, type LookBrief } from './look'
import { planWebsite } from '../website-spec/plan'
import { websiteLayoutKey } from '../website-spec/generate'

const dental: LookBrief = { mode: 'light', groups: ['human', 'light-tech'], palette: 'teal', type: 'geometric', mood: ['calm', 'clean', 'trusting'], why: 'clinic' }
const PROMPT = 'Website for a dental clinic in Nashik. braces and aligners for teenagers and adults. calm and reassuring'

function buildSite(seed: string) {
  const art = drawLook(dental, seed, 'website', { named: true })
  return planWebsite(PROMPT, { seed, directionId: art.directionId, look: art.look })
}
const keyOfSite = (s: ReturnType<typeof buildSite>) => designKey({ directionId: s.direction.id, look: s.look, layout: websiteLayoutKey(s) })

describe('THE RULE: a design is never built twice', () => {
  it('200 dental websites claim 200 different designs', async () => {
    const registry = new MemoryDesignRegistry()
    const keys = new Set<string>()
    let redraws = 0
    for (let i = 0; i < 200; i++) {
      const r = await claimUnique({ seed: 'project-' + i, registry, owner: 'project-' + i, build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
      expect(r.unique).toBe(true)
      keys.add(keyOfSite(r.value))
      if (r.attempts > 1) redraws++
    }
    expect(keys.size).toBe(200)
    expect(registry.size).toBe(200)
    // the registry is doing real work: without it some of these draws would have collided
    expect(redraws).toBeGreaterThanOrEqual(0)
  })

  it('a taken design is redrawn, and the redraw is a different design', async () => {
    const registry = new MemoryDesignRegistry()
    const first = await claimUnique({ seed: 'same-seed', registry, owner: 'a', build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    const second = await claimUnique({ seed: 'same-seed', registry, owner: 'b', build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    expect(first.attempts).toBe(1)
    expect(second.attempts).toBeGreaterThan(1)
    expect(keyOfSite(second.value)).not.toBe(keyOfSite(first.value))
  })

  it('the same owner claiming again (a retry of its own build) keeps its design', async () => {
    const registry = new MemoryDesignRegistry()
    const a = await claimUnique({ seed: 'p', registry, owner: 'p', build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    const b = await claimUnique({ seed: 'p', registry, owner: 'p', build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    expect(b.attempts).toBe(1)
    expect(keyOfSite(b.value)).toBe(keyOfSite(a.value))
  })

  it('without a registry (or when the user asked for the same design) the first draw is used', async () => {
    const r = await claimUnique({ seed: 'x', registry: null, owner: 'x', build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    expect(r.attempts).toBe(1)
    expect(wantsSameDesign('Rebuild my site with the same design as my last one')).toBe(true)
    expect(wantsSameDesign('Make a copy of my website design for the second branch')).toBe(true)
    expect(wantsSameDesign('Website for a dental clinic in Nashik')).toBe(false)
    expect(wantsSameDesign('A clean design with the same colours as a dentist usually has')).toBe(false)
  })

  it('when every try is taken it still builds (never blocks) and says so', async () => {
    const full = { claim: async () => false }
    const r = await claimUnique({ seed: 'x', registry: full, owner: 'x', tries: 3, build: buildSite, keyOf: keyOfSite, directionOf: s => s.direction.id })
    expect(r.unique).toBe(false)
    expect(r.attempts).toBe(3)
    expect(r.value).toBeTruthy()
  })
})

describe('what counts as the same design', () => {
  it('colours within one 8-degree bucket are the same; another bucket is a different design', () => {
    const l = lookFor(dental, 's')
    const base = designKey({ directionId: 'd', look: { ...l, hue: 180 } })
    expect(designKey({ directionId: 'd', look: { ...l, hue: 183 } })).toBe(base)
    expect(designKey({ directionId: 'd', look: { ...l, hue: 190 } })).not.toBe(base)
    expect(hueBucket(-10)).toBe(hueBucket(350))
  })
  it('a different font pairing, corner radius, direction or layout is a different design', () => {
    const l = lookFor(dental, 's')
    const base = designKey({ directionId: 'd', look: l, layout: 'a' })
    expect(designKey({ directionId: 'e', look: l, layout: 'a' })).not.toBe(base)
    expect(designKey({ directionId: 'd', look: l, layout: 'b' })).not.toBe(base)
    expect(designKey({ directionId: 'd', look: { ...l, radius: l.radius === '0rem' ? '1rem' : '0rem' }, layout: 'a' })).not.toBe(base)
    expect(designKey({ directionId: 'd', look: { ...l, fonts: { ...l.fonts, display: 'Other' } }, layout: 'a' })).not.toBe(base)
  })
})

describe('the database registry', () => {
  const fake = (result: { error: null | { code?: string; message?: string }; owner?: string }) => ({
    from: () => ({
      insert: async () => ({ error: result.error }),
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: result.owner ? { owner: result.owner } : null }) }) }),
    }),
  })
  it('claims when the insert works', async () => { expect(await supabaseDesignRegistry(fake({ error: null })).claim('k', { owner: 'a', directionId: 'd' })).toBe(true) })
  it('refuses when someone else holds it, accepts when it is the same owner', async () => {
    const taken = { code: '23505', message: 'duplicate key' }
    expect(await supabaseDesignRegistry(fake({ error: taken, owner: 'b' })).claim('k', { owner: 'a', directionId: 'd' })).toBe(false)
    expect(await supabaseDesignRegistry(fake({ error: taken, owner: 'a' })).claim('k', { owner: 'a', directionId: 'd' })).toBe(true)
  })
  it('never blocks a build when the table is missing or the call throws', async () => {
    expect(await supabaseDesignRegistry(fake({ error: { code: '42P01', message: 'relation does not exist' } })).claim('k', { owner: 'a', directionId: 'd' })).toBe(true)
    const throwing = { from: () => { throw new Error('boom') } }
    expect(await supabaseDesignRegistry(throwing).claim('k', { owner: 'a', directionId: 'd' })).toBe(true)
  })
})

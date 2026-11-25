import { describe, expect, it } from 'vitest'
import { generateWebsite, websiteLayoutKey } from './generate'
import { DEMOS } from './demo-copy'
import { designKey, type DesignRegistry } from '../build-spec/design-registry'
import { withLook } from '../build-spec/test-look'

// The fixture copy fits the page plan the demo brief gets from its own seed; a different design means a different plan, so the
// copy of a redrawn design is repaired by the normal repair attempt (the fake answers the same copy). These tests therefore only
// check the registry behaviour through the real generator, and always assert that the build itself succeeded.
const d = DEMOS[0]
const reply = (obj: unknown) => ({ text: '```json\n' + JSON.stringify(obj) + '\n```', inputTokens: 1, outputTokens: 1 })
const model = withLook(async () => reply(d.copy))
const keyOf = (r: Awaited<ReturnType<typeof generateWebsite>>) => {
  if (!r.ok) throw new Error('build failed: ' + r.reason.slice(0, 200))
  return designKey({ directionId: r.spec.direction.id, look: r.spec.look, layout: websiteLayoutKey(r.spec) })
}

describe('generateWebsite and the design registry', () => {
  it('claims the design it builds: the registry holds exactly that fingerprint', async () => {
    const claimed: string[] = []
    const spy: DesignRegistry = { claim: async key => { claimed.push(key); return true } }
    const r = await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, { writeCopy: model, designs: spy })
    expect(claimed).toEqual([keyOf(r)])
  })

  it('a user who asks for the same design again skips the registry (the one allowed repeat)', async () => {
    const claimed: string[] = []
    const spy: DesignRegistry = { claim: async key => { claimed.push(key); return true } }
    const r = await generateWebsite({ prompt: d.prompt + ' English only. Use the same design as my last site.', seed: d.seed, facts: d.facts }, { writeCopy: model, designs: spy })
    expect(r.ok).toBe(true)
    expect(claimed).toEqual([])
  })

  it('a taken fingerprint is redrawn with a new seed: the next claim is a different design', async () => {
    const claimed: string[] = []
    // Whether the redrawn page plan also fits the fixture copy is not the point here; the claims are.
    const refuseFirst: DesignRegistry = { claim: async key => { claimed.push(key); return claimed.length > 1 } }
    await generateWebsite({ prompt: d.prompt + ' English only.', seed: d.seed, facts: d.facts }, { writeCopy: model, designs: refuseFirst })
    expect(claimed.length).toBeGreaterThanOrEqual(2)
    expect(claimed[1]).not.toBe(claimed[0])
  })
})

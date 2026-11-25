import { describe, it, expect } from 'vitest'
import { DIRECTIONS } from './design-directions'
import { renderDirectionBrief } from './direction-brief'

// 18 Nov 2026: a law firm brief with no firm name was dealt "Giant wordmark", whose composition says the firm's name IS the hero. With no
// name (and an honesty rule against inventing one) the model enlarged the category word LEGAL. Every direction brief now carries a
// rule for facts the owner has not given.
describe('every direction brief handles missing facts', () => {
  for (const d of DIRECTIONS) {
    it(`${d.id} forbids stand-ins and invented facts`, () => {
      const brief = renderDirectionBrief(d)
      expect(brief).toMatch(/MISSING FACTS/)
      expect(brief).toMatch(/A category word is not a name/)
      expect(brief).toMatch(/do NOT set LEGAL, CLINIC/)
      expect(brief).toMatch(/Put no notes to the owner on the page/)
    })
  }
  it('no longer tells the model to ship invented facts as marked placeholders', () => {
    const brief = renderDirectionBrief(DIRECTIONS[0])
    expect(brief).not.toMatch(/must be clearly marked for the owner to replace/)
    expect(brief).toMatch(/must not appear at all/)
  })
})

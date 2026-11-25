import { describe, expect, it } from 'vitest'
import { explainableNoChange } from './no-change-reply'

describe('a turn with no file changes', () => {
  it("shows the model's own explanation when it explains instead of claiming to have built something", () => {
    const t = "I'd rather not write three patient reviews for you. Made-up reviews break Google's review policy and can mislead patients, which consumer-protection rules treat as an unfair practice. I can add a Patient reviews section that is ready for real ones, with a button to your Google reviews page. Want me to add that now, or will you send me the reviews?"
    expect(explainableNoChange(t)).toBe(t)
  })
  it('never shows a reply that claims the work was done (the old guard against false success)', () => {
    expect(explainableNoChange("I've added the testimonials section with three reviews and wired it into the page navigation so it is easy to find.")).toBeNull()
    expect(explainableNoChange('Done. The page now shows a reviews section between the fees and the questions, with three patient quotes in cards.')).toBeNull()
  })
  it('ignores file blocks and markers, and says nothing for empty or tiny replies', () => {
    expect(explainableNoChange('')).toBeNull()
    expect(explainableNoChange('ok')).toBeNull()
    const withBlock = '<edit path="src/a.tsx">\n<<<<<<< SEARCH\nx\n=======\ny\n>>>>>>> REPLACE\n</edit>'
    expect(explainableNoChange(withBlock)).toBeNull()
  })
  it('a very long reply is not shown as an explanation', () => {
    expect(explainableNoChange('Reviews are tricky. '.repeat(200))).toBeNull()
  })
})

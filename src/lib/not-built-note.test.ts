import { describe, expect, it } from 'vitest'
import { notBuiltList, notBuiltSentence } from './not-built-note'

const plan = (notBuilt: unknown) => ({ 'src/build-spec.json': JSON.stringify({ spec: { brief: { notBuilt } } }) })

describe('not-built note', () => {
  it('says what was left out, in one plain sentence', () => {
    expect(notBuiltSentence(plan(['sign-in with three roles', 'a report by payment mode']))).toBe("Not built yet: sign-in with three roles and a report by payment mode. Ask and I'll add what can be added.")
  })
  it('is silent when nothing was left out, or the plan is missing or broken', () => {
    expect(notBuiltSentence(plan([]))).toBe('')
    expect(notBuiltSentence({})).toBe('')
    expect(notBuiltSentence({ 'src/build-spec.json': '{oops' })).toBe('')
  })
  it('reads the editor store shape ({ content }) and ignores non-strings', () => {
    expect(notBuiltList({ 'src/build-spec.json': { content: JSON.stringify({ spec: { brief: { notBuilt: ['maps', 3, ''] } } }) } })).toEqual(['maps'])
  })
})

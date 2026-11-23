import { describe, expect, it } from 'vitest'
import { buildLanguagePrompt, languagesFromReply, validateLanguageReply } from './languages'

describe('model-decided language toggles', () => {
  it('accepts offered codes, in order, English first, no repeats', () => {
    expect(validateLanguageReply({ languages: ['kn', 'hi'] })).toEqual([])
    expect(languagesFromReply({ languages: ['kn', 'hi', 'kn'] })).toEqual(['en', 'kn', 'hi'])
  })
  it('an empty list is a valid answer (an export brand needs no toggle)', () => {
    expect(validateLanguageReply({ languages: [] })).toEqual([])
    expect(languagesFromReply({ languages: [] })).toEqual(['en'])
  })
  it('rejects unknown codes, more than three, and a non-array', () => {
    expect(validateLanguageReply({ languages: ['fr'] })[0]).toMatch(/unknown language codes/)
    expect(validateLanguageReply({ languages: ['hi', 'mr', 'gu', 'ta'] })[0]).toMatch(/at most three/)
    expect(validateLanguageReply({ languages: 'hi' })[0]).toMatch(/array/)
  })
  it('the question names every offered language and carries the brief', () => {
    const p = buildLanguagePrompt('Pickle kitchen in Nagpur')
    for (const c of ['hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn']) expect(p.system).toContain(c + ' =')
    expect(p.user).toContain('Nagpur')
  })
})

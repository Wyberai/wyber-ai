import { describe, it, expect } from 'vitest'
import { CHECKLIST_ITEMS, checklistProgress, sanitizeChecklistState } from './launch-checklist'

describe('checklistProgress', () => {
  it('is 0 of N when nothing is checked', () => {
    const p = checklistProgress({})
    expect(p.done).toBe(0)
    expect(p.total).toBe(CHECKLIST_ITEMS.length)
    expect(p.complete).toBe(false)
  })

  it('counts only checked items', () => {
    const p = checklistProgress({ pricing: { checked: true }, support: { checked: false } })
    expect(p.done).toBe(1)
  })

  it('is complete only when every item is checked', () => {
    const all = Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.id, { checked: true }]))
    expect(checklistProgress(all).complete).toBe(true)
    const missingOne = { ...all, [CHECKLIST_ITEMS[0].id]: { checked: false } }
    expect(checklistProgress(missingOne).complete).toBe(false)
  })
})

describe('sanitizeChecklistState', () => {
  it('returns an empty object for non-object input', () => {
    expect(sanitizeChecklistState(null)).toEqual({})
    expect(sanitizeChecklistState('nonsense')).toEqual({})
    expect(sanitizeChecklistState(undefined)).toEqual({})
  })

  it('drops unknown item ids', () => {
    const out = sanitizeChecklistState({ not_a_real_item: { checked: true } })
    expect(out).toEqual({})
  })

  it('keeps known items and coerces checked to a boolean', () => {
    const out = sanitizeChecklistState({ pricing: { checked: 'yes' } })
    expect(out.pricing).toEqual({ checked: true })
  })

  it('keeps a trimmed note when present, omits it when blank', () => {
    const out = sanitizeChecklistState({
      positioning: { checked: true, note: '  For indie bakers who hate spreadsheets  ' },
      support: { checked: true, note: '   ' },
    })
    expect(out.positioning).toEqual({ checked: true, note: 'For indie bakers who hate spreadsheets' })
    expect(out.support).toEqual({ checked: true })
  })

  it('caps a note at 280 chars', () => {
    const long = 'x'.repeat(500)
    const out = sanitizeChecklistState({ pricing: { checked: true, note: long } })
    expect(out.pricing.note?.length).toBe(280)
  })
})

import { describe, it, expect } from 'vitest'
import { formatAppsBuiltStat } from './apps-built-stats'

describe('formatAppsBuiltStat', () => {
  it('formats thousands with one decimal + k+', () => {
    expect(formatAppsBuiltStat(2400)).toBe('2.4k+')
    expect(formatAppsBuiltStat(2489)).toBe('2.4k+')
    expect(formatAppsBuiltStat(10500)).toBe('10.5k+')
  })

  it('floors sub-1000 counts to the nearest 100 with a +', () => {
    expect(formatAppsBuiltStat(950)).toBe('900+')
    expect(formatAppsBuiltStat(199)).toBe('100+')
  })

  it('shows the raw count under 100 with no +', () => {
    expect(formatAppsBuiltStat(42)).toBe('42')
    expect(formatAppsBuiltStat(0)).toBe('0')
  })
})

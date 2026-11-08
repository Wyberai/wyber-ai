import { describe, it, expect } from 'vitest'
import { readableOn, contrastRatio, luminance } from './color-contrast'

describe('readableOn', () => {
  it('uses white on dark colours and black on light ones', () => {
    expect(readableOn('#0b0d12')).toBe('#ffffff')
    expect(readableOn('#1e3a8a')).toBe('#ffffff')
    expect(readableOn('#ffffff')).toBe('#000000')
    expect(readableOn('#fde68a')).toBe('#000000')
  })

  it('picks the better of the two on mid-tones where a fixed white label fails', () => {
    // teal, orange and a light indigo: white is below 4.5:1 on each, black is above it
    for (const c of ['#0d9488', '#f97316', '#6366f1']) {
      const pick = readableOn(c)
      expect(pick).toBe('#000000')
      expect(contrastRatio(pick, c)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio('#ffffff', c)).toBeLessThan(contrastRatio(pick, c))
    }
  })

  it('accepts short hex and survives garbage', () => {
    expect(readableOn('#fff')).toBe('#000000')
    expect(readableOn('#000')).toBe('#ffffff')
    expect(['#ffffff', '#000000']).toContain(readableOn('not a colour'))
    expect(luminance('')).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import {
  MOBILE_DIRECTIONS, MOBILE_DIRECTION_IDS, getMobileDirectionById, pickMobileDirection, renderMobileBrief,
  contrast, parseMobileClassifierReply, buildMobileClassifierSystem,
} from './mobile-directions'

const hex = (s: string) => /^#[0-9A-Fa-f]{6}$/.test(s)

describe('mobile directions library', () => {
  it('has 12 uniquely identified directions with both light and dark bases', () => {
    expect(MOBILE_DIRECTIONS.length).toBe(12)
    expect(new Set(MOBILE_DIRECTION_IDS).size).toBe(12)
    expect(MOBILE_DIRECTIONS.filter(d => d.mode === 'dark').length).toBeGreaterThanOrEqual(3)
    expect(MOBILE_DIRECTIONS.filter(d => d.mode === 'light').length).toBeGreaterThanOrEqual(6)
  })

  for (const d of MOBILE_DIRECTIONS) {
    describe(d.id, () => {
      it('is readable: text, secondary text and onAccent pass contrast', () => {
        expect(contrast(d.theme.text, d.theme.bg)).toBeGreaterThanOrEqual(7)
        expect(contrast(d.theme.text, d.theme.surface)).toBeGreaterThanOrEqual(7)
        expect(contrast(d.theme.textSecondary, d.theme.bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(d.theme.textSecondary, d.theme.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(d.theme.textMuted, d.theme.bg)).toBeGreaterThanOrEqual(3)
        expect(contrast(d.theme.onAccent, d.theme.accent)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(d.theme.accent, d.theme.bg)).toBeGreaterThanOrEqual(3)
      })
      it('has valid hex tokens and no pure black or white ground on dark bases', () => {
        for (const k of ['bg', 'surface', 'elevated', 'text', 'textSecondary', 'textMuted', 'accent', 'onAccent', 'success', 'warning', 'danger'] as const) {
          expect(hex(d.theme[k]), `${d.id}.${k}`).toBe(true)
        }
        if (d.mode === 'dark') expect(d.theme.bg.toLowerCase()).not.toBe('#000000')
      })
      it('has status colours readable on its ground', () => {
        for (const k of ['success', 'warning', 'danger'] as const) expect(contrast(d.theme[k], d.theme.bg)).toBeGreaterThanOrEqual(3.5)
      })
      it('accent is not an unexamined purple', () => {
        const h = d.theme.accent.replace('#', '')
        const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
        const purple = b > r * 0.9 && b > g * 1.4 && r > g * 1.1
        expect(purple).toBe(false)
      })
      it('is fully specified', () => {
        expect(d.anchors.length).toBeGreaterThan(0)
        expect(d.moves.length).toBeGreaterThanOrEqual(3)
        expect(d.fits.length).toBeGreaterThanOrEqual(10)
        for (const v of [d.vibe, d.composition, d.motion, d.imageBrief, d.notFor, d.pitfall]) expect(v.length).toBeGreaterThan(20)
      })
    })
  }
})

describe('mobile deal by fit', () => {
  const cases: [string, string[]][] = [
    ['A habit tracker with daily streaks', ['m-paper-notes', 'm-play-bright', 'm-calm-sage']],
    ['Meditation and sleep app with breathing exercises', ['m-calm-sage']],
    ['UPI wallet to send money to friends', ['m-cash-bold']],
    ['Expense tracker to split bills with roommates', ['m-ledger-calm']],
    ['Running app with training plans', ['m-sport-energy']],
    ['Language learning app with flashcards and quizzes for kids', ['m-play-bright']],
    ['Food delivery app for a local restaurant with menu and orders', ['m-market-warm']],
    ['Delivery partner app for riders to mark orders delivered', ['m-field-tool', 'm-market-warm']],
    ['Tide and weather forecast app for surfers', ['m-sky-data']],
    ['Luxury jewellery boutique app with private membership', ['m-luxe-dark']],
    ['Community app to share photos and chat with friends', ['m-social-feed']],
    ['News and magazine reader with podcasts', ['m-reader-editorial']],
  ]
  for (const [p, ok] of cases) {
    it(`${p}`, () => expect(ok).toContain(pickMobileDirection(p).id))
  }
  it('no-signal prompts get a generalist, never a niche direction', () => {
    const picks = new Set([0, 0.4, 0.99].map(r => pickMobileDirection('an app', () => r).id))
    for (const id of picks) expect(getMobileDirectionById(id)?.generalist).toBe(true)
  })
})

describe('mobile brief and classifier', () => {
  it('brief carries exact theme values, hard rules and the invented-facts rule', () => {
    const d = MOBILE_DIRECTIONS[2]
    const b = renderMobileBrief(d)
    expect(b).toContain(d.theme.bg)
    expect(b).toContain(d.theme.accent)
    expect(b).toContain(d.mode === 'dark' ? 'light-content' : 'dark-content')
    expect(b).toContain('INVENTED FACTS ARE PLACEHOLDERS')
    expect(b).toContain('no hex or rgba inside a StyleSheet')
    expect(b).toContain('44px')
  })
  it('parses only valid ids', () => {
    expect(parseMobileClassifierReply('{"id":"m-cash-bold"}')).toBe('m-cash-bold')
    expect(parseMobileClassifierReply('{"id":"nope"}')).toBeNull()
    expect(parseMobileClassifierReply('garbage')).toBeNull()
  })
  it('classifier system lists every direction', () => {
    const s = buildMobileClassifierSystem()
    for (const id of MOBILE_DIRECTION_IDS) expect(s).toContain(id)
  })
})

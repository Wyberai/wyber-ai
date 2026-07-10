import { describe, it, expect } from 'vitest'
import { PALETTES, pickPalette, getPaletteById, pickPaletteOptions, renderDesignBrief } from './design-palettes'

const REQUIRED_TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
]
const HSL = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/

describe('design-palettes — every palette is complete + well-formed', () => {
  it('has a unique id and all required tokens in valid HSL-channel form', () => {
    const ids = new Set<string>()
    for (const pal of PALETTES) {
      expect(ids.has(pal.id), `duplicate id ${pal.id}`).toBe(false)
      ids.add(pal.id)
      for (const t of REQUIRED_TOKENS) {
        expect(pal.tokens[t], `${pal.id} missing --${t}`).toBeTruthy()
        expect(pal.tokens[t], `${pal.id} --${t} not HSL channels`).toMatch(HSL)
      }
      expect(pal.fontSans).toBeTruthy()
      expect(pal.fontDisplay).toBeTruthy()
      expect(pal.label, `${pal.id} missing label`).toBeTruthy()
      expect(pal.label.length, `${pal.id} label too long for UI cards`).toBeLessThanOrEqual(24)
      expect(pal.gradientHero).toContain('hsl(')
      expect(['light', 'dark']).toContain(pal.mode)
    }
  })

  it('keeps foreground visibly distinct from background (basic contrast guard)', () => {
    const lightnessOf = (hsl: string) => Number(hsl.split(/\s+/)[2].replace('%', ''))
    for (const pal of PALETTES) {
      const bg = lightnessOf(pal.tokens.background)
      const fg = lightnessOf(pal.tokens.foreground)
      expect(Math.abs(bg - fg), `${pal.id} low bg/fg contrast`).toBeGreaterThan(40)
      const pr = lightnessOf(pal.tokens.primary)
      const prf = lightnessOf(pal.tokens['primary-foreground'])
      expect(Math.abs(pr - prf), `${pal.id} low primary contrast`).toBeGreaterThan(30)
    }
  })
})

describe('design-palettes — pickPalette', () => {
  it('matches a vertical from prompt keywords', () => {
    const p = pickPalette('a crypto trading wallet dashboard', () => 0)
    expect(p.domains.some((d) => 'crypto trading wallet dashboard'.includes(d))).toBe(true)
  })

  it('falls back to the full set when nothing matches', () => {
    const p = pickPalette('zzzz nonsense', () => 0)
    expect(PALETTES).toContain(p)
  })

  it('does NOT narrow on generic keywords (todo/app/dashboard) — uses the full pool for variety', () => {
    // 'app'/'dashboard' are weak → full pool, so index 0 is the first palette
    // overall, NOT one of the indigo saas palettes. Proves generic apps vary.
    expect(pickPalette('a simple todo app dashboard', () => 0).id).toBe(PALETTES[0].id)
    // and a strong vertical still narrows correctly
    expect(pickPalette('a health tracker app', () => 0).domains).toContain('health')
  })

  it('is deterministic given a fixed RNG', () => {
    const a = pickPalette('a wellness meditation app', () => 0.0)
    const b = pickPalette('a wellness meditation app', () => 0.0)
    expect(a.id).toBe(b.id)
  })
})

describe('design-palettes — getPaletteById', () => {
  it('returns the palette for a known id and undefined otherwise', () => {
    expect(getPaletteById('fintech-emerald-dark')?.id).toBe('fintech-emerald-dark')
    expect(getPaletteById('no-such-palette')).toBeUndefined()
    expect(getPaletteById(undefined)).toBeUndefined()
    expect(getPaletteById('')).toBeUndefined()
  })
})

describe('design-palettes — pickPaletteOptions', () => {
  // deterministic LCG so shuffles are reproducible but not degenerate
  const seededRnd = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  it('returns n distinct palettes', () => {
    for (const seed of [1, 42, 999]) {
      const opts = pickPaletteOptions('a crm for florists', 3, seededRnd(seed))
      expect(opts).toHaveLength(3)
      expect(new Set(opts.map((p) => p.id)).size).toBe(3)
    }
  })

  it('puts strong-domain matches first', () => {
    const opts = pickPaletteOptions('a crypto trading wallet', 3, seededRnd(7))
    // fintech palettes match 'crypto'/'trading'/'wallet' — the first option must be one of them
    expect(opts[0].domains.some((d) => 'a crypto trading wallet'.includes(d))).toBe(true)
  })

  it('offers contrasting modes when the pool allows it', () => {
    const opts = pickPaletteOptions('zzzz nonsense', 3, seededRnd(3))
    expect(new Set(opts.map((p) => p.mode)).size).toBeGreaterThan(1)
  })

  it('is deterministic given a fixed RNG and caps at the pool size', () => {
    const a = pickPaletteOptions('a health tracker', 3, seededRnd(5)).map((p) => p.id)
    const b = pickPaletteOptions('a health tracker', 3, seededRnd(5)).map((p) => p.id)
    expect(a).toEqual(b)
    expect(pickPaletteOptions('x', 999, seededRnd(1))).toHaveLength(PALETTES.length)
  })
})

describe('design-palettes — renderDesignBrief', () => {
  it('emits a :root block with the palette tokens, fonts and gradient', () => {
    const pal = PALETTES.find((p) => p.id === 'fintech-emerald-dark')!
    const brief = renderDesignBrief(pal)
    expect(brief).toContain('--primary: 152 64% 46%;')
    expect(brief).toContain("--font-sans: 'Switzer'")
    expect(brief).toContain('--gradient-hero:')
    expect(brief).toContain('DESIGN BRIEF')
  })

  it('tells the model to enable dark mode for a dark palette only', () => {
    const dark = renderDesignBrief(PALETTES.find((p) => p.mode === 'dark')!)
    const light = renderDesignBrief(PALETTES.find((p) => p.mode === 'light')!)
    expect(dark).toContain('className="dark"')
    expect(light).not.toContain('className="dark"')
  })
})

import { describe, expect, it } from 'vitest'
import { DIRECTIONS, hslToHex } from '../design-directions'
import { contrastRatio } from '../color-contrast'
import { ANY_DIRECTION_FONT_WEIGHTS } from '../direction-fonts'
import { HUE_FAMILIES, PAIRINGS, lookFor, pickDirectionForLook, recolorTokens, resolveLook, validateLookBrief, type LookBrief } from './look'
import { renderTokensCss } from './tokens'

const parse = (s: string): [number, number, number] => { const m = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(s)!; return [Number(m[1]), Number(m[2]), Number(m[3])] }
const hex = (s: string) => hslToHex(parse(s))

describe('font pairings', () => {
  it('only name families the platform loads, with a weight the family really has', () => {
    for (const [feel, { list }] of Object.entries(PAIRINGS)) {
      for (const p of list) {
        for (const f of [p.display, p.body]) expect(ANY_DIRECTION_FONT_WEIGHTS[f], `${feel}: ${f}`).toBeTruthy()
        expect(ANY_DIRECTION_FONT_WEIGHTS[p.display], `${feel}: ${p.display} weight ${p.displayWeight}`).toContain(p.displayWeight)
      }
    }
  })
})

describe('recolouring a palette keeps it readable', () => {
  const PAIRS: [string, string][] = [['foreground', 'background'], ['card-foreground', 'card'], ['muted-foreground', 'background'], ['primary-foreground', 'primary']]
  it('every direction x every colour family keeps each text pair at its original contrast (never below 4.5 when it started above)', () => {
    const bad: string[] = []
    for (const d of DIRECTIONS) {
      for (const [fam, { range }] of Object.entries(HUE_FAMILIES)) {
        const t = recolorTokens(d.palette.tokens, (range[0] + range[1]) / 2)
        for (const [fg, bg] of PAIRS) {
          if (!d.palette.tokens[fg] || !d.palette.tokens[bg]) continue
          const before = contrastRatio(hex(d.palette.tokens[fg]), hex(d.palette.tokens[bg]))
          const after = contrastRatio(hex(t[fg]), hex(t[bg]))
          if (after < Math.min(before, 4.5) - 0.05) bad.push(`${d.id} ${fam} ${fg}/${bg}: ${before.toFixed(2)} -> ${after.toFixed(2)}`)
        }
      }
    }
    expect(bad).toEqual([])
  })
  it('neutral palettes stay neutral and the hue actually changes for tinted ones', () => {
    const cream = DIRECTIONS.find(d => d.id === 'ty-poster')!
    const t = recolorTokens(cream.palette.tokens, 180)
    expect(parse(t.background)[0]).toBe(180)
    const white = DIRECTIONS.find(d => d.id === 'lt-luxe-fintech')!
    expect(recolorTokens(white.palette.tokens, 180).background).toBe(white.palette.tokens.background)
  })
  it('the CSS carries the skin: new fonts and a recoloured primary', () => {
    const look = lookFor({ mode: 'light', groups: ['human'], palette: 'teal', type: 'geometric', mood: ['calm'], why: '' }, 'x')
    const css = renderTokensCss('ty-poster', ['en'], '', look)
    expect(css).toContain(`'${look.fonts.display}'`)
    expect(css).toMatch(new RegExp(`--primary: ${Math.round(look.hue)}`))
  })
})

describe('the art director', () => {
  const dental: LookBrief = { mode: 'light', groups: ['human', 'light-tech'], palette: 'teal', type: 'geometric', mood: ['calm', 'clean', 'trusting'], why: 'clinic' }
  const gaming: LookBrief = { mode: 'dark', groups: ['dark', 'brand-block'], palette: 'indigo', type: 'display-bold', mood: ['loud'], why: 'games' }

  it('validates the model answer', () => {
    expect(validateLookBrief(dental)).toEqual([])
    expect(validateLookBrief({ ...dental, palette: 'neon' })[0]).toMatch(/palette/)
    expect(validateLookBrief({ ...dental, groups: [] })[0]).toMatch(/groups/)
    expect(validateLookBrief({ ...dental, mode: 'grey' })[0]).toMatch(/mode/)
  })

  it('a dental brief and a gaming brief get opposite faces', () => {
    for (let i = 0; i < 20; i++) {
      expect(pickDirectionForLook(dental, 'd' + i, 'website', { named: true }).palette.mode).toBe('light')
      expect(pickDirectionForLook(gaming, 'g' + i, 'website', { named: true }).palette.mode).toBe('dark')
    }
  })

  it('60 dental builds give many distinct looks, all in the colours the director chose (never cream and orange by accident)', () => {
    const looks = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const d = pickDirectionForLook(dental, 's' + i, 'website', { named: true })
      const l = lookFor(dental, 's' + i)
      expect(l.hue).toBeGreaterThanOrEqual(HUE_FAMILIES.teal.range[0])
      expect(l.hue).toBeLessThanOrEqual(HUE_FAMILIES.teal.range[1])
      looks.add([d.id, l.hue, l.fonts.display, l.fonts.body].join('|'))
    }
    expect(looks.size).toBeGreaterThanOrEqual(40)
  })

  it('an avoided direction is not picked again', () => {
    const first = pickDirectionForLook(dental, 'a', 'website', { named: true })
    for (let i = 0; i < 30; i++) expect(pickDirectionForLook(dental, 'a' + i, 'website', { named: true, avoid: [first.id] }).id).not.toBe(first.id)
  })

  it('resolveLook uses the model answer, and returns null when the model gives nothing usable', async () => {
    const ok = await resolveLook('dental clinic in Nashik', 's', 'website', async () => ({ text: JSON.stringify(dental), inputTokens: 1, outputTokens: 1 }), () => {})
    expect(ok?.look.family).toBe('teal')
    expect(ok?.brief.mode).toBe('light')
    const bad = await resolveLook('x', 's', 'website', async () => ({ text: 'no json', inputTokens: 1, outputTokens: 1 }), () => {})
    expect(bad).toBeNull()
  })
})

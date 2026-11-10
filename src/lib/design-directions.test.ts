import { describe, it, expect } from 'vitest'
import { DIRECTIONS, DIRECTION_IDS, getDirectionById, hslToHex } from './design-directions'
import { dealDirections, pickDirection, renderDirectionBrief, surfaceFor } from './direction-brief'
import { lintAgainstDirection } from './direction-lint'
import { DIRECTION_FONT_WEIGHTS, directionFontsUrl, detectDirectionFonts, extraFontLinks } from './direction-fonts'
import { contrastRatio } from './color-contrast'

const BASE_FONTS = new Set(['Switzer', 'General Sans', 'Instrument Serif', 'Fraunces', 'Playfair Display', 'Lora', 'JetBrains Mono'])
const TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
]
const hex = (v: string) => {
  const [h, s, l] = v.replace(/%/g, '').split(' ').map(Number)
  return hslToHex([h, s, l])
}
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

describe('direction library integrity', () => {
  it('has 26 uniquely identified directions', () => {
    expect(DIRECTIONS.length).toBe(26)
    expect(new Set(DIRECTION_IDS).size).toBe(26)
  })

  it.each(DIRECTIONS.map(d => [d.id, d] as const))('%s is complete, anchored and well-formed', (_id, d) => {
    expect(d.anchors.length).toBeGreaterThan(0)
    for (const a of d.anchors) expect(a.site).toMatch(/\./)
    for (const t of TOKENS) expect(d.palette.tokens[t], t).toMatch(/^\d{1,3}(\.\d+)? \d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/)
    expect(d.composition.length).toBeGreaterThan(80)
    expect(d.moves.length).toBeGreaterThanOrEqual(3)
    expect(d.imageBrief.length).toBeGreaterThan(30)
    expect(d.fits.length).toBeGreaterThan(3)
    expect(d.surfaces.length).toBeGreaterThan(0)
    // no glow anywhere in the library; gradients are a deliberate small budget
    expect(d.rules.glow).toBe(false)
    expect(d.rules.gradientBudget).toBeLessThanOrEqual(3)
  })

  it.each(DIRECTIONS.map(d => [d.id, d] as const))('%s uses only loadable fonts with a real display weight', (_id, d) => {
    for (const fam of [d.fonts.display, d.fonts.body, d.fonts.mono]) {
      expect(BASE_FONTS.has(fam) || DIRECTION_FONT_WEIGHTS[fam], `font not loadable: ${fam}`).toBeTruthy()
    }
    const w = DIRECTION_FONT_WEIGHTS[d.fonts.display]
    if (w) expect(w, `${d.fonts.display} has no weight ${d.fonts.displayWeight}`).toContain(d.fonts.displayWeight)
  })

  it.each(DIRECTIONS.map(d => [d.id, d] as const))('%s meets WCAG contrast for the pairs the UI depends on', (_id, d) => {
    const t = d.palette.tokens
    // 6+ rather than 7: a saturated ground (coral, yellow) cannot reach AAA with any ink; AA text is 4.5.
    expect(contrastRatio(hex(t.foreground), hex(t.background)), 'foreground on background').toBeGreaterThanOrEqual(6)
    expect(contrastRatio(hex(t['primary-foreground']), hex(t.primary)), 'primary-foreground on primary').toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(hex(t['muted-foreground']), hex(t.background)), 'muted-foreground on background').toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(hex(t['muted-foreground']), hex(t.muted)), 'muted-foreground on muted').toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(hex(t['destructive-foreground']), hex(t.destructive)), 'destructive-foreground on destructive').toBeGreaterThanOrEqual(4.5)
  })

  it('mixes light and dark and is not a dark-purple monoculture', () => {
    const dark = DIRECTIONS.filter(d => d.palette.mode === 'dark').length
    expect(dark).toBeGreaterThan(2)
    expect(dark).toBeLessThan(DIRECTIONS.length / 2)
    // primary hue 250–310 (violet/purple) is not used by any direction
    for (const d of DIRECTIONS) {
      const [h, s] = d.palette.tokens.primary.replace(/%/g, '').split(' ').map(Number)
      expect(s < 15 || h < 250 || h > 310, `${d.id} primary is purple`).toBe(true)
    }
  })

  it('ink is tinted (not pure #000) wherever tintedInk is promised', () => {
    for (const d of DIRECTIONS.filter(x => x.rules.tintedInk)) {
      expect(hex(d.palette.tokens.foreground), d.id).not.toBe('#000000')
    }
  })
})

describe('dealDirections / pickDirection', () => {
  it('returns n distinct directions', () => {
    const got = dealDirections('a website', 3, { rnd: seeded(7) })
    expect(got.length).toBe(3)
    expect(new Set(got.map(d => d.id)).size).toBe(3)
  })

  it('fits the business: restaurants, law, property, agriculture, fitness', () => {
    const top = (p: string) => dealDirections(p, 3, { rnd: seeded(3) }).map(d => d.id)
    expect(top('a restaurant and bakery in Pune')).toEqual(expect.arrayContaining([expect.stringMatching(/^fb-/)]))
    expect(top('website for our law firm and advocates')).toContain('lg-wordmark')
    expect(top('real estate developer residential apartments')).toEqual(expect.arrayContaining([expect.stringMatching(/^re-/)]))
    expect(top('rice export and agro commodity business')).toContain('ag-earth')
    expect(top('gym and fitness club')).toEqual(expect.arrayContaining([expect.stringMatching(/^br-/)]))
  })

  it('does not fire keywords inside other words', () => {
    const ids = dealDirections('steamed momos', 3, { rnd: seeded(5) }).map(d => d.id)
    // "tea" must not match inside "steamed"
    expect(ids).not.toContain('ag-earth')
  })

  it('apps only get app-capable directions', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const d of dealDirections('project management dashboard', 3, { projectType: 'saas', rnd: seeded(seed) })) {
        expect(d.surfaces).toContain('app')
      }
    }
    expect(surfaceFor('webapp')).toBe('app')
    expect(surfaceFor('website')).toBe('website')
    expect(surfaceFor(undefined)).toBe('website')
  })

  it('varies across builds for the same vague prompt, but only among neutral directions', () => {
    const picks = new Set<string>()
    for (let seed = 1; seed <= 80; seed++) picks.add(pickDirection('a business website', { rnd: seeded(seed) }).id)
    expect(picks.size).toBeGreaterThanOrEqual(4)
    for (const id of picks) expect(getDirectionById(id)!.generalist, id).toBe(true)
  })

  it('an explicit id wins; an unknown id falls back to a fit', () => {
    expect(pickDirection('anything', { id: 'dk-studio' }).id).toBe('dk-studio')
    expect(pickDirection('anything', { id: 'nope', rnd: seeded(1) })).toBeTruthy()
    expect(getDirectionById('nope')).toBeUndefined()
  })
})

describe('renderDirectionBrief', () => {
  it.each(DIRECTIONS.map(d => [d.id, d] as const))('%s renders a complete, self-consistent brief', (_id, d) => {
    const b = renderDirectionBrief(d)
    expect(b).not.toMatch(/undefined|NaN|\[object/)
    expect(b).toContain(`:root {`)
    expect(b).toContain(`--font-display: '${d.fonts.display}'`)
    expect(b).toContain('OWNED IDEA')
    expect(b).toContain('NO glow or ambient-light effects')
    expect(b).toContain('Do NOT wrap every section in Reveal/Stagger')
    // found by a real build: the model interpolated a directive (src={`{{wyber-image: ${p.prompt}…}}`}), which cannot resolve
    expect(b).toContain('IMAGE DIRECTIVES MUST BE LITERAL')
    expect(b).toContain('NEVER build a directive with a template literal')
    for (const t of ['background', 'primary', 'muted-foreground', 'ring']) expect(b).toContain(`--${t}:`)
    expect(b).toContain(d.palette.mode === 'dark' ? 'DARK direction' : 'src/index.css')
  })
})

describe('lintAgainstDirection', () => {
  const dir = getDirectionById('ed-brand-world')!
  const file = (c: string) => ({ 'src/App.tsx': { content: c } })

  it('passes a clean build', () => {
    expect(lintAgainstDirection({ ...file('export default function App(){ return <main className="bg-background text-foreground"><h1 className="text-6xl">Hi</h1></main> }'), 'src/index.css': { content: "--font-display: 'Newsreader'; --font-sans: 'Hanken Grotesk';" } }, dir)).toEqual([])
  })

  it('flags glow, gradients over budget, pure black, purple, reveal-everywhere and missing fonts', () => {
    const slop = `<AuroraBackground /><div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-black bg-black" />` + '<Reveal>x</Reveal>'.repeat(8)
    const rules = lintAgainstDirection({ ...file(slop), 'src/index.css': { content: ':root{}' } }, dir).map(f => f.rule)
    for (const r of ['no-glow', 'gradient-budget', 'tinted-ink', 'no-purple', 'reveal-everywhere', 'direction-font']) expect(rules).toContain(r)
  })

  it('does not count dot-grid textures or loading shimmers as decorative gradients (found in a real webapp build)', () => {
    const acid = getDirectionById('b2b-acid-mono')! // gradient budget 0
    const css = [
      'body { background-image: radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px); background-size: 24px 24px }',
      '.skeleton { background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%); animation: shimmer 1.4s infinite }',
    ].join('\n')
    const rules = lintAgainstDirection({ 'src/index.css': { content: css } }, acid).map(f => f.rule)
    expect(rules).not.toContain('gradient-budget')
  })

  it('still counts a real decorative hero gradient', () => {
    const acid = getDirectionById('b2b-acid-mono')!
    const rules = lintAgainstDirection({ 'src/index.css': { content: '.hero { background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))) }' } }, acid).map(f => f.rule)
    expect(rules).toContain('gradient-budget')
  })

  it('ignores the platform kit file and tests', () => {
    expect(lintAgainstDirection({ 'src/wyber-ui.tsx': { content: '<AuroraBackground />' } }, dir)).toEqual([])
  })
})

describe('direction fonts', () => {
  it('builds a css2 url only from known families and ignores the rest', () => {
    const u = directionFontsUrl(['Inter Tight', 'Not A Font', 'Newsreader'])!
    expect(u).toContain('family=Inter+Tight:wght@300;400;500;600;700')
    expect(u).toContain('family=Newsreader:wght@300;400;500;600;700')
    expect(u).not.toContain('Not+A+Font')
    expect(u.endsWith('&display=swap')).toBe(true)
    expect(directionFontsUrl(['Switzer', 'Nope'])).toBeNull()
  })

  it('detects only the families a stylesheet names and adds nothing otherwise', () => {
    expect(detectDirectionFonts("--font-sans: 'Hanken Grotesk', system-ui; --font-display: 'Newsreader'")).toEqual(['Newsreader', 'Hanken Grotesk'])
    expect(extraFontLinks(":root{ --font-sans: 'Switzer' }")).toBe('')
    expect(extraFontLinks('')).toBe('')
    expect(extraFontLinks("--font-display: 'Rubik'")).toContain('family=Rubik:wght@400;500;700')
  })

  it('every direction family produces a valid link', () => {
    for (const d of DIRECTIONS) {
      const link = extraFontLinks(`--font-display: '${d.fonts.display}'; --font-sans: '${d.fonts.body}'; --font-mono: '${d.fonts.mono}'`)
      const needed = [d.fonts.display, d.fonts.body, d.fonts.mono].filter(f => DIRECTION_FONT_WEIGHTS[f])
      for (const f of needed) expect(link, `${d.id}:${f}`).toContain(`family=${f.replace(/ /g, '+')}`)
    }
  })
})

import { sanitizeFiles } from './sanitize-files'

describe('direction fonts reach the built page (sanitizeFiles)', () => {
  const base = (cssText: string) => ({
    'src/App.tsx': { content: 'export default function App(){ return <div/> }' },
    'src/index.css': { content: cssText },
    'index.html': { content: '<!DOCTYPE html><html><head><title>x</title></head><body><div id="root"></div></body></html>' },
  })
  const html = (out: Record<string, unknown>) => (out['index.html'] as { content: string }).content

  it('injects a font link only for the direction families the CSS names', () => {
    const out = sanitizeFiles(base(":root{ --font-display: 'Newsreader'; --font-sans: 'Hanken Grotesk'; }") as never) as Record<string, unknown>
    expect(html(out)).toContain('fonts.googleapis.com/css2?family=Newsreader')
    expect(html(out)).toContain('family=Hanken+Grotesk')
    expect(html(out)).not.toContain('family=Rubik')
  })

  it('is a strict no-op for builds that use no direction font', () => {
    const out = sanitizeFiles(base(":root{ --font-sans: 'Switzer'; }") as never) as Record<string, unknown>
    expect(html(out)).not.toContain('fonts.googleapis.com/css2?family=Newsreader')
    expect(html(out)).not.toMatch(/display=swap/)
  })

  it('is idempotent', () => {
    const once = sanitizeFiles(base("--font-display: 'Rubik'") as never) as Record<string, unknown>
    const twice = sanitizeFiles(once as never) as Record<string, unknown>
    expect((html(twice).match(/family=Rubik/g) ?? []).length).toBe(1)
  })
})

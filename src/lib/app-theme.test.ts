import { describe, it, expect } from 'vitest'
import { parseAppTheme, writeAppTheme, themeToCss, hexToHslChannels, hslChannelsToHex } from './app-theme'

const SAMPLE = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 199 89% 48%;
  --primary-foreground: 0 0% 100%;
  --chart-1: 220 70% 50%;
  --radius: 0.75rem;
  --font-sans: 'Switzer';
  --font-display: 'General Sans';
}

body { margin: 0; }
.custom { color: hsl(var(--primary)); }`

describe('parseAppTheme', () => {
  it('reads tokens, radius and fonts out of :root', () => {
    const t = parseAppTheme(SAMPLE)
    expect(t.tokens.primary).toBe('199 89% 48%')
    expect(t.tokens.background).toBe('240 10% 3.9%')
    expect(t.tokens['chart-1']).toBe('220 70% 50%')
    expect(t.radius).toBe('0.75rem')
    expect(t.fontSans).toBe('Switzer')
    expect(t.fontDisplay).toBe('General Sans')
  })

  it('returns an empty theme when no :root block exists', () => {
    expect(parseAppTheme('body { margin: 0 }').tokens).toEqual({})
    expect(parseAppTheme('').tokens).toEqual({})
  })
})

describe('writeAppTheme', () => {
  it('rewrites token values while preserving unknown declarations and the rest of the file', () => {
    const out = writeAppTheme(SAMPLE, { tokens: { primary: '270 80% 65%' }, radius: '1rem', fontDisplay: 'Fraunces' })
    expect(out).toContain('--primary: 270 80% 65%;')
    expect(out).toContain('--background: 240 10% 3.9%;') // preserved
    expect(out).toContain('--chart-1: 220 70% 50%;')     // unknown var preserved
    expect(out).toContain('--radius: 1rem;')
    expect(out).toContain("--font-display: 'Fraunces';")
    expect(out).toContain("--font-sans: 'Switzer';")     // untouched font preserved
    expect(out).toContain('@tailwind base;')
    expect(out).toContain('.custom { color: hsl(var(--primary)); }')
  })

  it('round-trips: parse(write(css, theme)) returns the theme', () => {
    const theme = { tokens: { primary: '350 78% 58%', background: '30 40% 99%' }, radius: '0.5rem', fontSans: 'Switzer' }
    const t = parseAppTheme(writeAppTheme(SAMPLE, theme))
    expect(t.tokens.primary).toBe('350 78% 58%')
    expect(t.tokens.background).toBe('30 40% 99%')
    expect(t.radius).toBe('0.5rem')
  })

  it('inserts a :root block after @tailwind directives when none exists', () => {
    const out = writeAppTheme('@tailwind base;\n@tailwind utilities;\nbody{margin:0}', { tokens: { primary: '199 89% 48%' } })
    expect(out.indexOf('@tailwind utilities;')).toBeLessThan(out.indexOf(':root {'))
    expect(out).toContain('--primary: 199 89% 48%;')
    expect(out).toContain('body{margin:0}')
  })

  it('handles an empty file', () => {
    const out = writeAppTheme('', { tokens: { primary: '199 89% 48%' } })
    expect(parseAppTheme(out).tokens.primary).toBe('199 89% 48%')
  })
})

describe('themeToCss', () => {
  it('serializes an instant-override :root block', () => {
    const css = themeToCss({ tokens: { primary: '270 80% 65%' }, radius: '1rem', fontSans: 'Switzer' })
    expect(css).toContain(':root {')
    expect(css).toContain('--primary: 270 80% 65%;')
    expect(css).toContain('--radius: 1rem;')
    expect(css).toContain("--font-sans: 'Switzer';")
  })
})

// Every prebuilt gallery template (src/lib/templates/prebuilt/*.ts) ships its
// own --bg/--surface/--accent/--text token set, read directly as literal
// colors (`background: var(--bg)`) — not the shadcn set above, which those
// templates never reference. Regression coverage for the bug where applying
// a theme to one of these projects silently changed nothing visible.
const LEGACY_SAMPLE = `:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--accent:#0EA5E9;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
body{background:var(--bg);color:var(--text)}`

describe('writeAppTheme — legacy prebuilt-template token names', () => {
  it('overlays --bg/--accent/--text so a legacy-template project actually changes', () => {
    const out = writeAppTheme(LEGACY_SAMPLE, { tokens: { background: '0 0% 100%', primary: '260 80% 60%', foreground: '240 10% 4%' } })
    expect(out).toContain('--bg: hsl(0 0% 100%);')
    expect(out).toContain('--accent: hsl(260 80% 60%);')
    expect(out).toContain('--text: hsl(240 10% 4%);')
  })

  it('preserves a bare (non-custom-property) declaration inside :root, like a direct font-family', () => {
    const out = writeAppTheme(LEGACY_SAMPLE, { tokens: { primary: '199 89% 48%' } })
    expect(out).toContain("font-family:'Space Grotesk',sans-serif")
  })

  it('leaves untouched legacy vars (e.g. --elevated, --border) intact', () => {
    const out = writeAppTheme(LEGACY_SAMPLE, { tokens: { primary: '199 89% 48%' } })
    expect(out).toContain('--elevated: #18181b;')
    expect(out).toContain('--border: rgba(255,255,255,0.07);')
  })
})

describe('themeToCss — legacy prebuilt-template token names', () => {
  it('also emits the legacy overlay for the instant preview flash', () => {
    const css = themeToCss({ tokens: { background: '0 0% 100%', primary: '260 80% 60%' } })
    expect(css).toContain('--bg: hsl(0 0% 100%);')
    expect(css).toContain('--accent: hsl(260 80% 60%);')
  })
})

describe('hex ↔ hsl channels', () => {
  it('round-trips the brand accent', () => {
    const hex = hslChannelsToHex('199 89% 48%')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    const back = hexToHslChannels(hex)
    const [h, s, l] = back.split(' ').map(v => parseFloat(v))
    expect(Math.abs(h - 199)).toBeLessThanOrEqual(2)
    expect(Math.abs(s - 89)).toBeLessThanOrEqual(3)
    expect(Math.abs(l - 48)).toBeLessThanOrEqual(2)
  })

  it('handles achromatic + invalid inputs', () => {
    expect(hslChannelsToHex('0 0% 100%')).toBe('#ffffff')
    expect(hexToHslChannels('#000000')).toBe('0 0% 0%')
    expect(hslChannelsToHex('garbage')).toBe('#000000')
    expect(hexToHslChannels('nope')).toBe('0 0% 0%')
  })
})

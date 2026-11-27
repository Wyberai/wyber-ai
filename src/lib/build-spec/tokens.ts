import { getDirectionById, hslToHex } from '../design-directions'
import { contrastRatio, luminance } from '../color-contrast'
import { directionFontsUrl } from '../direction-fonts'
import type { LangId } from './types'
import { skinDirection, type Look } from './look'

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
  'destructive-foreground', 'border', 'input', 'ring',
]
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const SCRIPT_FONTS: Partial<Record<LangId, { css: string; family: string }>> = {
  hi: { css: "'Noto Sans Devanagari'", family: 'Noto+Sans+Devanagari:wght@400;500;600' },
  mr: { css: "'Noto Sans Devanagari'", family: 'Noto+Sans+Devanagari:wght@400;500;600' },
  ta: { css: "'Noto Sans Tamil'", family: 'Noto+Sans+Tamil:wght@400;500;600' },
  te: { css: "'Noto Sans Telugu'", family: 'Noto+Sans+Telugu:wght@400;500;600' },
  kn: { css: "'Noto Sans Kannada'", family: 'Noto+Sans+Kannada:wght@400;500;600' },
  bn: { css: "'Noto Sans Bengali'", family: 'Noto+Sans+Bengali:wght@400;500;600' },
  gu: { css: "'Noto Sans Gujarati'", family: 'Noto+Sans+Gujarati:wght@400;500;600' },
}

type HSL = [number, number, number]
const parseHsl = (v: string | undefined): HSL | null => {
  const m = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(v ?? '')
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/**
 * The readable version of a brand colour used as TEXT on the page and card grounds. Null when the colour already reads (4.5:1),
 * so palettes that were fine are untouched. Fills (bg-primary and the label on them) are never changed.
 */
export function textSafe(tokens: Record<string, string>, key: 'primary' | 'destructive'): string | null {
  const colour = parseHsl(tokens[key])
  const grounds = [parseHsl(tokens.background), parseHsl(tokens.card)].filter(Boolean) as HSL[]
  if (!colour || !grounds.length) return null
  // badges put a 10% tint of the colour behind its own label, so that tinted ground counts too
  const tint = (g: string) => '#' + [1, 3, 5].map(i => Math.round(parseInt(g.slice(i, i + 2), 16) * 0.9 + parseInt(hslToHex(colour).slice(i, i + 2), 16) * 0.1).toString(16).padStart(2, '0')).join('')
  const behind = grounds.map(g => hslToHex(g)).flatMap(g => [g, tint(g)])
  const worst = (c: HSL) => Math.min(...behind.map(g => contrastRatio(hslToHex(c), g)))
  if (worst(colour) >= 4.5) return null
  const darken = luminance(hslToHex(grounds[0])) > 0.18
  let c = colour
  for (let i = 0; i < 100 && worst(c) < 4.6; i++) c = [c[0], c[1], Math.max(0, Math.min(100, c[2] + (darken ? -1 : 1)))]
  return c[0] + ' ' + c[1] + '% ' + c[2] + '%'
}

function textInkCss(tokens: Record<string, string>): string {
  return (['primary', 'destructive'] as const).map(key => {
    const ink = textSafe(tokens, key)
    return ink ? '.text-' + key + ' { color: hsl(' + ink + '); }\n' : ''
  }).join('')
}

/** index.css for any generated product: the direction's tokens, fonts and base styles. `extra` is appended before the reduced-motion block. */
/**
 * Modern-CSS motion and type layer shared by every generated site (23 Nov 2026). Each part is progressive enhancement: the page is complete without it.
 * - text-wrap: balance on headings and pretty on running text (no orphans, even line lengths).
 * - Scroll-driven reveals: blocks marked data-sv fade and rise while they enter, driven by the scroll position (no JavaScript). Only where the
 *   browser supports animation-timeline; the sections fall back to framer-motion elsewhere and never mark the block, so nothing is ever left hidden.
 * - View Transitions: the default crossfade is tuned to the one easing curve; reduced motion switches it off.
 */
export const MOTION_CSS = `h1, h2, h3, h4 { text-wrap: balance; }
p, li, dd, blockquote, figcaption { text-wrap: pretty; }
::view-transition-group(*) { animation-duration: 0.45s; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes wyber-sv { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-sv] { animation: wyber-sv linear both; animation-timeline: view(); animation-range: entry calc(var(--sv-d, 0) * 1%) entry calc(35% + var(--sv-d, 0) * 1%); }
  }
}
@media print { [data-sv] { animation: none; } }`

export function renderTokensCss(directionId: string, langs: LangId[] = ['en'], extra = '', look?: Look | null): string {
  const d0 = getDirectionById(directionId)
  if (!d0) throw new Error('unknown direction ' + directionId)
  // the art director's skin: a hue for this business and a font pairing (colour contrast is re-checked in recolorTokens)
  const d = look ? skinDirection(d0, look) : d0
  const scriptFallback = langs.map(l => SCRIPT_FONTS[l]?.css).filter(Boolean).map(x => x + ', ').join('')
  const vars = TOKEN_ORDER.filter(k => d.palette.tokens[k]).map(k => '  --' + k + ': ' + d.palette.tokens[k] + ';').join('\n')
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
*, *::before, *::after { box-sizing: border-box; }

:root {
${vars}
  --radius: ${d.palette.radius};
  --font-sans: '${d.fonts.body}', ${scriptFallback}${FALLBACK};
  --font-display: '${d.fonts.display}', '${d.fonts.body}', ${scriptFallback}${FALLBACK};
  --font-mono: '${d.fonts.mono}', ui-monospace, monospace;
}

html { scroll-behavior: smooth; }
body {
  margin: 0;
  padding: 0;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.font-display { font-family: var(--font-display); font-weight: ${d.fonts.displayWeight}; letter-spacing: ${d.fonts.displayTracking}; }
.font-mono { font-family: var(--font-mono); }
${textInkCss(d.palette.tokens)}${MOTION_CSS}
${extra}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  [data-sv] { animation: none; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
`
}

export function fontsHrefFor(directionId: string, langs: LangId[] = ['en'], look?: Look | null): string {
  const d0 = getDirectionById(directionId)
  if (!d0) throw new Error('unknown direction ' + directionId)
  const d = look ? { ...d0, fonts: { ...d0.fonts, display: look.fonts.display, body: look.fonts.body } } : d0
  const base = directionFontsUrl([d.fonts.display, d.fonts.body, d.fonts.mono]) ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  const extra = langs.map(l => SCRIPT_FONTS[l]?.family).filter(Boolean).map(f => '&family=' + f).join('')
  return extra ? base.replace('&display=swap', extra + '&display=swap') : base
}

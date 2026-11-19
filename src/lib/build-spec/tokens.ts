import { getDirectionById } from '../design-directions'
import { directionFontsUrl } from '../direction-fonts'
import type { LangId } from './types'

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
  'destructive-foreground', 'border', 'input', 'ring',
]
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const SCRIPT_FONTS: Partial<Record<LangId, { css: string; family: string }>> = {
  hi: { css: "'Noto Sans Devanagari'", family: 'Noto+Sans+Devanagari:wght@400;500;600' },
  gu: { css: "'Noto Sans Gujarati'", family: 'Noto+Sans+Gujarati:wght@400;500;600' },
}

/** index.css for any generated product: the direction's tokens, fonts and base styles. `extra` is appended before the reduced-motion block. */
export function renderTokensCss(directionId: string, langs: LangId[] = ['en'], extra = ''): string {
  const d = getDirectionById(directionId)
  if (!d) throw new Error('unknown direction ' + directionId)
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
${extra}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
`
}

export function fontsHrefFor(directionId: string, langs: LangId[] = ['en']): string {
  const d = getDirectionById(directionId)
  if (!d) throw new Error('unknown direction ' + directionId)
  const base = directionFontsUrl([d.fonts.display, d.fonts.body, d.fonts.mono]) ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  const extra = langs.map(l => SCRIPT_FONTS[l]?.family).filter(Boolean).map(f => '&family=' + f).join('')
  return extra ? base.replace('&display=swap', extra + '&display=swap') : base
}

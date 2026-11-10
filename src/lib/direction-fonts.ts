// Fonts for design directions (see docs/web-design-direction-research.md).
//
// Every family here is SIL OFL from Google Fonts. Weights were checked against Google's own
// metadata (fonts.google.com/metadata/fonts) and the generated URL was tested for HTTP 200 on
// 10 Nov 2026 — a wrong weight in a css2 URL makes the WHOLE request 400, so do not hand-edit
// weights without re-testing (direction-fonts.test.ts guards the shape).
//
// Families already loaded for every build by design-system.ts GOOGLE_FONTS_LINKS
// (Playfair Display, Lora, JetBrains Mono, Instrument Serif, Fraunces, Switzer, General Sans) are NOT repeated.
//
// Fonts are loaded ON DEMAND: extraFontLinks(css) returns <link> tags only for the families a build's CSS
// actually names, so builds without a direction pay nothing and cannot regress.

export const DIRECTION_FONT_WEIGHTS: Record<string, number[]> = {
  'Newsreader': [300, 400, 500, 600, 700],
  'Hanken Grotesk': [300, 400, 500, 600, 700],
  'Inter Tight': [300, 400, 500, 600, 700],
  'DM Mono': [400, 500],
  'Geist': [300, 400, 500, 600],
  'Geist Mono': [400, 500],
  'IBM Plex Mono': [400, 500],
  'Space Mono': [400, 700],
  'Archivo Black': [400],
  'Anton': [400],
  'Unbounded': [400, 600, 800],
  'Rubik': [400, 500, 700],
  'Cormorant Garamond': [300, 400, 500, 600],
  'Work Sans': [300, 400, 500, 600],
  'DM Serif Display': [400],
  'Gloock': [400],
  'Figtree': [400, 500, 600, 700],
  'Fredoka': [400, 500, 600],
  'Baloo 2': [500, 700],
  'Nunito': [400, 600, 700],
  'Space Grotesk': [400, 500, 700],
  'Young Serif': [400],
  'Barlow Condensed': [400, 500, 600, 700],
  'Archivo': [400, 500, 700],
  'Caveat': [500, 700],
  'Instrument Sans': [400, 500, 600],
}

export const DIRECTION_FONT_FAMILIES = Object.keys(DIRECTION_FONT_WEIGHTS)

/** One Google css2 URL for the given directions-fonts families (unknown names are ignored). Null if none. */
export function directionFontsUrl(families: string[]): string | null {
  const parts = [...new Set(families)]
    .filter(f => DIRECTION_FONT_WEIGHTS[f])
    .map(f => `family=${f.replace(/ /g, '+')}:wght@${DIRECTION_FONT_WEIGHTS[f].join(';')}`)
  return parts.length ? `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap` : null
}

/** Families from the direction set that a piece of CSS/JS/HTML text actually names. */
export function detectDirectionFonts(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  return DIRECTION_FONT_FAMILIES.filter(f => lower.includes(f.toLowerCase()))
}

/** <link> tag(s) loading only the direction fonts named in `css`; '' when none (the common case). */
export function extraFontLinks(css: string): string {
  const url = directionFontsUrl(detectDirectionFonts(css))
  return url ? `<link href="${url}" rel="stylesheet">` : ''
}

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

// Fontshare (Indian Type Foundry) families: free for personal and commercial use, served from api.fontshare.com, which every build already
// preconnects to (General Sans and Switzer load from it for all builds). Weights below were each tested to return ONLY that family from the
// CDN on 23 Nov 2026: asking for a weight a family does not have makes the API pad the response with other families, so do not hand-edit.
export const FONTSHARE_FONTS: Record<string, { slug: string; weights: number[] }> = {
  'Erode': { slug: 'erode', weights: [400, 500, 600] },
  'Gambetta': { slug: 'gambetta', weights: [500, 600] },
  'Boska': { slug: 'boska', weights: [400] },
  'Clash Display': { slug: 'clash-display', weights: [400, 500, 600, 700] },
  'Clash Grotesk': { slug: 'clash-grotesk', weights: [400, 500, 600] },
  'Satoshi': { slug: 'satoshi', weights: [400, 500, 700] },
  'Supreme': { slug: 'supreme', weights: [400, 500, 700] },
  'Excon': { slug: 'excon', weights: [400, 500, 700] },
  'Chillax': { slug: 'chillax', weights: [400, 500, 600] },
}

/** Every family a direction may name, Google or Fontshare, with its real weights. */
export const ANY_DIRECTION_FONT_WEIGHTS: Record<string, number[]> = {
  ...DIRECTION_FONT_WEIGHTS,
  ...Object.fromEntries(Object.entries(FONTSHARE_FONTS).map(([k, v]) => [k, v.weights])),
}

/**
 * One Fontshare css URL PER family (unknown names are ignored). Fontshare's API returns only the FIRST family of a multi-family request
 * (checked 23 Nov 2026: f[]=erode&f[]=satoshi returns Erode alone), so a site that names two families needs two links.
 */
export function fontshareUrls(families: string[]): string[] {
  return [...new Set(families)].filter(f => FONTSHARE_FONTS[f]).map(f => 'https://api.fontshare.com/v2/css?f[]=' + FONTSHARE_FONTS[f].slug + '@' + FONTSHARE_FONTS[f].weights.join(',') + '&display=swap')
}

/** Fontshare families a piece of CSS/JS/HTML text actually names. */
export function detectFontshareFonts(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  return Object.keys(FONTSHARE_FONTS).filter(f => lower.includes(f.toLowerCase()))
}

/** <link> tag(s) loading only the direction fonts named in `css` (Google and Fontshare); '' when none (the common case). */
export function extraFontLinks(css: string): string {
  const g = directionFontsUrl(detectDirectionFonts(css))
  const f = fontshareUrls(detectFontshareFonts(css))
  return [g ? `<link href="${g}" rel="stylesheet">` : '', ...f.map(u => `<link href="${u}" rel="stylesheet">`)].filter(Boolean).join('\n  ')
}

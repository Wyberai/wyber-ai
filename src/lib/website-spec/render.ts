import { getDirectionById } from '../design-directions'
import { directionFontsUrl } from '../direction-fonts'
import { llmsTxt, renderIndexHtml, robotsTxt, sitemapXml } from './seo'
import { renderApp, navLabels, type Translations } from './render-app'
import type { BuildSpec, LangId, SiteCopy } from './types'

export { directiveRatio, IMAGE_HYGIENE, imageDirective } from './render-images'
export { renderApp, navLabels, type Translations } from './render-app'

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
  'destructive-foreground', 'border', 'input', 'ring',
]
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const SCRIPT_FONTS: Partial<Record<LangId, { css: string; family: string }>> = {
  hi: { css: "'Noto Sans Devanagari'", family: "Noto+Sans+Devanagari:wght@400;500;600" },
  gu: { css: "'Noto Sans Gujarati'", family: "Noto+Sans+Gujarati:wght@400;500;600" },
}

export function renderIndexCss(spec: BuildSpec, langs: LangId[] = ["en"]): string {
  const d = getDirectionById(spec.direction.id)
  if (!d) throw new Error('unknown direction ' + spec.direction.id)
  const scriptFallback = langs.map(l => SCRIPT_FONTS[l]?.css).filter(Boolean).map(x => x + ', ').join('')
  const vars = TOKEN_ORDER.filter(k => d.palette.tokens[k]).map(k => `  --${k}: ${d.palette.tokens[k]};`).join('\n')
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
section[id] { scroll-margin-top: 5rem; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
`
}

export function fontsHref(spec: BuildSpec, langs: LangId[] = ["en"]): string {
  const d = getDirectionById(spec.direction.id)!
  const base = directionFontsUrl([d.fonts.display, d.fonts.body, d.fonts.mono]) ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  const extra = langs.map(l => SCRIPT_FONTS[l]?.family).filter(Boolean).map(f => "&family=" + f).join("")
  return extra ? base.replace("&display=swap", extra + "&display=swap") : base
}

export function renderOwnerDetails(spec: BuildSpec): string {
  const f = spec.brief.facts
  const v = (s?: string) => JSON.stringify(s ?? '')
  return `// All business facts live here. The owner can edit these values later.
// Leave a value as an empty string when unknown; the site hides anything without a fact.
export const OWNER = {
  name: ${v(f.name)},
  city: ${v(f.city)},
  address: ${v(f.address)},
  phone: ${v(f.phone)},
  whatsapp: ${v(f.whatsapp)},
  email: ${v(f.email)},
  hours: ${v(f.hours)},
}
`
}

export interface RenderedSite { files: Record<string, string> }

export function renderWebsite(spec: BuildSpec, copy: SiteCopy, translations: Translations = {}): RenderedSite {
  const langs: LangId[] = ["en", ...(spec.languages ?? []).filter((l): l is LangId => l !== "en" && Boolean(translations[l]))]
  return {
    files: {
      'src/App.tsx': renderApp(spec, copy, translations),
      'src/index.css': renderIndexCss(spec, langs),
      'src/owner-details.ts': renderOwnerDetails(spec),
      'index.html': renderIndexHtml(spec, copy, fontsHref(spec, langs)),
      'public/robots.txt': robotsTxt(spec),
      'public/sitemap.xml': sitemapXml(spec),
      'public/llms.txt': llmsTxt(spec, copy),
      'src/build-spec.json': JSON.stringify(spec, null, 2),
    },
  }
}

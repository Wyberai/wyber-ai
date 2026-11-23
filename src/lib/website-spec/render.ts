import { fontsHrefFor, renderTokensCss } from '../build-spec/tokens'
import { llmsTxt, renderIndexHtml, robotsTxt, sitemapXml } from './seo'
import { renderApp, navLabels, type Translations } from './render-app'
import { WYBER_SECTIONS_PATH, WYBER_SECTIONS_SOURCE } from '../wyber-sections'
import type { BuildSpec, LangId, SiteCopy } from './types'

export { directiveRatio, IMAGE_HYGIENE, imageDirective } from './render-images'
export { renderApp, navLabels, type Translations } from './render-app'

export function renderIndexCss(spec: BuildSpec, langs: LangId[] = ['en']): string {
  return renderTokensCss(spec.direction.id, langs, 'section[id] { scroll-margin-top: 5rem; }\n', spec.look)
}

export function fontsHref(spec: BuildSpec, langs: LangId[] = ['en']): string {
  return fontsHrefFor(spec.direction.id, langs, spec.look)
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
      // The sections are platform-owned, like the UI kit, but a site that uses them keeps its own copy so it renders the same later.
      ...(spec.layout?.sx ? { [WYBER_SECTIONS_PATH]: WYBER_SECTIONS_SOURCE } : {}),
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

// Per-app PWA manifest builder — shared by the two serving paths for a
// published app: the main-domain shell (/app/[slug]/manifest.webmanifest) and
// the raw subdomain/custom-domain path (serve-custom-domain). Each published
// app is its own installable PWA; `id`/`start_url`/`scope` differ per path so
// Chrome treats every app on wyberai.com/app/* as a distinct install.

export const PWA_ICON_SIZES = [192, 512] as const
export const BRAND_THEME_COLOR = '#0EA5E9'
export const PWA_BACKGROUND_COLOR = '#09090b'

export interface ManifestProject {
  name: string | null
}

export function buildAppManifest(
  project: ManifestProject,
  opts: { startUrl: string; id: string; scope: string; iconBase: string; themeColor?: string },
) {
  const name = (project.name || 'My App').slice(0, 45)
  return {
    name,
    short_name: name.length > 12 ? name.slice(0, 12).trimEnd() : name,
    id: opts.id,
    start_url: opts.startUrl,
    scope: opts.scope,
    display: 'standalone',
    theme_color: opts.themeColor || BRAND_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: [
      { src: `${opts.iconBase}pwa-icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${opts.iconBase}pwa-icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${opts.iconBase}pwa-icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

// Pull the app's own theme-color out of its built HTML so the installed PWA's
// title bar matches the app, not the platform brand.
export function extractThemeColor(html: string): string | undefined {
  const m =
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i)
  return m?.[1]
}

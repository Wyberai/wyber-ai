import { MetadataRoute } from 'next'
import { DOC_NAV } from '@/app/docs/_nav'
import { BUILD_PAGES } from './build/data'
import { LIBRARY_TOOLS } from '@/lib/byos/slug'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wyberai.com'
  // Real dates, not "now". A sitemap that says every page changed this second teaches Google to ignore lastmod altogether.
  // Update these when the content of the group really changes: UPDATED for the main site pages, PSEO_UPDATED for the
  // generated /build and /byos pages.
  const UPDATED = new Date('2026-11-09')
  const PSEO_UPDATED = new Date('2026-11-08')

  // /build programmatic pages — derived from data so new batches are never
  // forgotten here. Keep priority below the curated /use-cases pillars.
  const buildRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/build`, lastModified: PSEO_UPDATED, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...BUILD_PAGES.map(p => ({
      url: `${base}/build/${p.slug}`,
      lastModified: PSEO_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  // /byos "replace {tool}" pages — one per pre-analyzed library tool.
  const byosRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/byos`, lastModified: PSEO_UPDATED, changeFrequency: 'weekly' as const, priority: 0.85 },
    ...LIBRARY_TOOLS.map(t => ({
      url: `${base}/byos/${t.slug}`,
      lastModified: PSEO_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  // /gallery is noindex, and /premier-league and /employees canonicalise to the homepage. Listing a page the page itself says
  // not to index is what Search Console reports as "pages in a sitemap can't be indexed", so they are NOT listed here.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: UPDATED, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/websites`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/create`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/solve`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/agencies`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/marketplace`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/mcp`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ecommerce`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/learn`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/connectors`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/founders`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/designers`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/marketers`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/complexity-guide`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/setup-call`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/vs/lovable`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/bolt`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/v0`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/replit`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/cursor`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/softr`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/lovable-alternatives`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/vs`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/use-cases`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/build-mobile-app-with-ai`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/ai-agent-builder-no-code`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/build-saas-without-code`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/secure-ai-app-builder`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/ai-workflow-automation`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/no-code-web-app-builder`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/ai-app-builder`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.85 },
    // NOTE: gated app pages (/gtm/*, /dashboard, /project) and thin auth pages
    // (/login, /signup) are intentionally excluded — they redirect crawlers to
    // login and get marked "not indexed", which drags down sitemap quality.
    { url: `${base}/blog`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog/build-saas-mvp-with-ai-2026`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/build-saas-without-code`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/nextjs-app-in-one-hour`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/ai-app-builder-for-startups`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/no-code-vs-ai-code-generation`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/how-to-deploy-ai-generated-app`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/build-internal-tools-with-ai`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/docs`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.7 },
    ...DOC_NAV.flatMap(section => section.links).map(link => ({ url: `${base}${link.href}`, lastModified: UPDATED, changeFrequency: 'monthly' as const, priority: 0.6 })),
    { url: `${base}/privacy`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/about`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // NOTE: /templates/[id] pages are intentionally excluded — they are
  // client-side redirect stubs (spinner → build project → /project or /login)
  // with no indexable content, which mass-triggered "not indexed" and tanked
  // sitemap quality. The public content page is /gallery (kept above).
  return [...staticRoutes, ...buildRoutes, ...byosRoutes]
}

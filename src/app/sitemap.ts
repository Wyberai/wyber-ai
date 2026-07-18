import { MetadataRoute } from 'next'
import { BUILD_PAGES } from './build/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wyberai.com'
  const now = new Date()

  // /build programmatic pages — derived from data so new batches are never
  // forgotten here. Keep priority below the curated /use-cases pillars.
  const buildRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/build`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...BUILD_PAGES.map(p => ({
      url: `${base}/build/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/vs/lovable`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/bolt`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/v0`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/replit`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/cursor`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/softr`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/lovable-alternatives`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/vs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/use-cases`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/build-mobile-app-with-ai`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/ai-agent-builder-no-code`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/build-saas-without-code`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/secure-ai-app-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/ai-workflow-automation`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/use-cases/no-code-web-app-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/use-cases/ai-app-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/employees`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    // NOTE: gated app pages (/gtm/*, /dashboard, /project) and thin auth pages
    // (/login, /signup) are intentionally excluded — they redirect crawlers to
    // login and get marked "not indexed", which drags down sitemap quality.
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog/what-are-ai-agents-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/ai-workflow-automation-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/build-saas-mvp-with-ai-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/build-saas-without-code`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/nextjs-app-in-one-hour`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/why-we-charge-less-than-lovable`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/wyber-vs-lovable`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/ai-app-builder-for-startups`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/no-code-vs-ai-code-generation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/how-to-deploy-ai-generated-app`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/build-internal-tools-with-ai`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // NOTE: /templates/[id] pages are intentionally excluded — they are
  // client-side redirect stubs (spinner → build project → /project or /login)
  // with no indexable content, which mass-triggered "not indexed" and tanked
  // sitemap quality. The public content page is /gallery (kept above).
  return [...staticRoutes, ...buildRoutes]
}

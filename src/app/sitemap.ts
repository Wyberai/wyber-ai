import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://wyberai.com'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/community`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/vs/lovable`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/bolt`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/v0`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/replit`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/vs/cursor`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
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
    { url: `${base}/gtm`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/gtm/campaigns`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/gtm/sequences`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/gtm/leads`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
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
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]

  try {
    const admin = await createAdminClient()
    const { data: apps } = await admin.from('prebuilt_apps').select('id, name, category').limit(100)
    const templateRoutes: MetadataRoute.Sitemap = (apps || []).map(app => ({
      url: `${base}/templates/${app.id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
    return [...staticRoutes, ...templateRoutes]
  } catch {
    return staticRoutes
  }
}

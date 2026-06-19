// Google Cloud Storage template cache
// Serves pre-built app templates from GCS CDN instead of Supabase for instant loads
// Setup: create a GCS bucket, set it public, enable CDN via Cloud CDN or just use the public URL

const GCS_BUCKET = process.env.GCS_TEMPLATE_BUCKET || ''
const GCS_BASE_URL = GCS_BUCKET
  ? `https://storage.googleapis.com/${GCS_BUCKET}`
  : ''

export interface CachedTemplate {
  id: string
  name: string
  category: string
  description: string
  keywords: string[]
  preview_color: string
  files: Record<string, string>
}

export function isGcsConfigured(): boolean {
  return !!GCS_BUCKET
}

export function getTemplateUrl(templateId: string): string {
  return `${GCS_BASE_URL}/templates/${templateId}.json`
}

export function getIndexUrl(type: 'web' | 'mobile' | 'workflow'): string {
  return `${GCS_BASE_URL}/index/${type}.json`
}

export async function fetchTemplateFromGcs(templateId: string): Promise<CachedTemplate | null> {
  if (!GCS_BASE_URL) return null
  try {
    const res = await fetch(getTemplateUrl(templateId), {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return await res.json() as CachedTemplate
  } catch {
    return null
  }
}

export async function fetchTemplateIndex(type: 'web' | 'mobile' | 'workflow'): Promise<Array<{ id: string; name: string; category: string; description: string; preview_color: string }>> {
  if (!GCS_BASE_URL) return []
  try {
    const res = await fetch(getIndexUrl(type), {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

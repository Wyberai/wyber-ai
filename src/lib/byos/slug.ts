import index from './library-index.json'

export interface LibraryTool { domain: string; product: string; category: string; slug: string }

/** "pipedrive.com" -> "pipedrive", "linear.app" -> "linear", "monday.com" -> "monday". */
export function slugForDomain(domain: string): string {
  return domain.replace(/^www\./, '').split('.').slice(0, -1).join('-').replace(/[^a-z0-9-]/g, '') || domain
}

export const LIBRARY_TOOLS: LibraryTool[] = (index as { domain: string; product: string; category: string }[])
  .map(t => ({ ...t, slug: slugForDomain(t.domain) }))

export function toolBySlug(slug: string): LibraryTool | undefined {
  return LIBRARY_TOOLS.find(t => t.slug === slug)
}

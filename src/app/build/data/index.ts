import type { BuildPage, BuildCategory } from './types'
import { PRODUCTIVITY_PAGES } from './productivity'
import { BUSINESS_PAGES } from './business'
import { HEALTH_PAGES } from './health'
import { FINANCE_PAGES } from './finance'
import { EVENTS_PAGES } from './events'
import { EDUCATION_PAGES } from './education'

export type { BuildPage, BuildCategory } from './types'
export { CATEGORY_LABELS } from './types'

// Add new batches as new files (or append to a category) — build-pages.test.ts
// enforces slug uniqueness, related-link integrity, and minimum content depth,
// so a bad batch fails CI instead of shipping thin pages.
export const BUILD_PAGES: BuildPage[] = [
  ...PRODUCTIVITY_PAGES,
  ...BUSINESS_PAGES,
  ...HEALTH_PAGES,
  ...FINANCE_PAGES,
  ...EVENTS_PAGES,
  ...EDUCATION_PAGES,
]

export function getBuildPage(slug: string): BuildPage | undefined {
  return BUILD_PAGES.find(p => p.slug === slug)
}

export function pagesByCategory(): [BuildCategory, BuildPage[]][] {
  const order: BuildCategory[] = ['productivity', 'business', 'health', 'finance', 'events', 'education']
  return order
    .map(c => [c, BUILD_PAGES.filter(p => p.category === c)] as [BuildCategory, BuildPage[]])
    .filter(([, pages]) => pages.length > 0)
}

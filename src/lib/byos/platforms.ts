import { cacheKey } from './domain'
import platforms from './platforms.json'

/**
 * Platforms and suites we won't pretend to replace one-to-one. Curated by hand on purpose: asking the
 * model to decide this flagged 28 of 44 library tools (including Pipedrive and Calendly) as platforms.
 * A visitor-typed tool that isn't listed simply gets the normal feature-by-feature verdict.
 */
const PLATFORM_DOMAINS = (platforms as string[]).map(cacheKey)

export function isPlatformDomain(domain: string): boolean {
  const d = cacheKey(domain.toLowerCase())
  return PLATFORM_DOMAINS.some(p => d === p || d.endsWith(`.${p}`))
}

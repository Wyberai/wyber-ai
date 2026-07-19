// The /build/[slug] programmatic-SEO layer: long-tail "build a ___ app" pages.
// Volume lives HERE; /use-cases stays the small curated pillar set.
//
// Ground rules for every entry (enforced by build-pages.test.ts):
//  - Copy must be UNIQUE per page — no template-swapped sentences. Google's
//    helpful-content system buries doorway farms; the moat is that each page
//    reads like it was written for that app type, because it was.
//  - promptExample is the page's real utility: a starter prompt engineered for
//    the WyberAi builder. The CTA stashes it via the same localStorage contract
//    as the homepage hero (wyber-pending-prompt), so a visitor lands in signup
//    with their app already queued.
//  - Ship in curated batches (~20-50/wk), never a mass dump — thin/unindexed
//    pages drag sitemap quality (see the hard-won notes in app/sitemap.ts).
export type BuildCategory =
  | 'productivity'
  | 'business'
  | 'health'
  | 'finance'
  | 'events'
  | 'education'

export const CATEGORY_LABELS: Record<BuildCategory, string> = {
  productivity: 'Productivity',
  business: 'Business & Local',
  health: 'Health & Fitness',
  finance: 'Finance',
  events: 'Events & Community',
  education: 'Education',
}

export interface BuildPage {
  slug: string
  /** the thing being built, lowercase — e.g. "habit tracker" */
  noun: string
  h1: string
  metaTitle: string
  metaDesc: string
  target: 'web' | 'mobile'
  category: BuildCategory
  tagline: string
  /** 2+ paragraphs, unique to this niche */
  body: string[]
  /** "what your X needs" — niche-specific, not generic platform features */
  features: { title: string; desc: string }[]
  /** ready-to-paste starter prompt, engineered for the builder */
  promptExample: string
  faqs: { q: string; a: string }[]
  /** slugs of related build pages for interlinking (must exist) */
  related: string[]
}

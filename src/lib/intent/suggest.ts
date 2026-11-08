import type { BuildPage } from '@/app/build/data/types'
import type { Door, Intent } from './types'

// "Guides for your kind of work": after we have understood a visitor, point at the /build pages that
// match what they wrote. Pure scoring over the page list, so it is testable and never invents a page.
// Server side only: the page list is large and the browser should not download it.

export interface SuggestedPage { slug: string; title: string }

const STOP = new Set(('a an and are as at be but by for from has have i in is it its me my of on or our so that the their them they this to us was we what when which who will with you your ' +
  'want need build make tool app apps software website using use get can how our does do not no all any one new').split(' '))

const tokens = (s: string): string[] => (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter(w => !STOP.has(w)).map(w => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w))

/** Fall back to these when nothing matches, by door. Each must exist (a test checks). */
export const DEFAULT_SLUGS: Record<Door, string[]> = {
  business: ['whatsapp-order-tracker-app', 'proof-of-delivery-tracker-app', 'inventory-management-app'],
  software: ['multi-vendor-marketplace-app', 'subscription-box-app', 'online-course-platform'],
  student: ['habit-tracker-app', 'flashcard-app', 'reading-list-app'],
}

export function suggestPages(pages: BuildPage[], door: Door, intent: Pick<Intent, 'industry' | 'pain'> | null, text: string, limit = 3): SuggestedPage[] {
  const q = new Set(tokens(`${intent?.industry ?? ''} ${intent?.pain ?? ''} ${text}`))
  const scored = pages.map(p => {
    const nounTokens = new Set(tokens(`${p.noun} ${p.h1} ${p.slug.replace(/-/g, ' ')}`))
    const bodyTokens = new Set(tokens(`${p.tagline} ${p.features.map(f => f.title).join(' ')}`))
    let score = 0
    for (const w of q) { if (nounTokens.has(w)) score += 3; else if (bodyTokens.has(w)) score += 1 }
    return { p, score }
  }).filter(x => x.score >= 2).sort((a, b) => b.score - a.score || a.p.slug.localeCompare(b.p.slug))

  const out: SuggestedPage[] = scored.slice(0, limit).map(x => ({ slug: x.p.slug, title: x.p.h1 }))
  for (const slug of DEFAULT_SLUGS[door]) {
    if (out.length >= limit) break
    const p = pages.find(x => x.slug === slug)
    if (p && !out.some(o => o.slug === slug)) out.push({ slug, title: p.h1 })
  }
  return out
}

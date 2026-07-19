import { describe, it, expect } from 'vitest'
import { BUILD_PAGES, getBuildPage } from './data'

// Quality gate for the /build programmatic-SEO layer. Every future batch must
// pass this — it's what stops the page set from degrading into a doorway farm
// (thin copy, duplicate text, broken interlinks) as it scales.
describe('build pages data integrity', () => {
  it('has unique slugs', () => {
    const slugs = BUILD_PAGES.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  // The prior "no duplicated copy" gate below only checked body/tagline/prompt/
  // FAQ text — it never caught two pages shipping the same (or near-identical)
  // <title>/H1, which is exactly what a fast weekly batch is most likely to
  // template-swap by accident, and it's the single most SEO-visible field
  // (search results show the title, not the body).
  it('has unique H1s and meta titles (search-result-visible, most doorway-prone field)', () => {
    const h1s = new Map<string, string>()
    const titles = new Map<string, string>()
    for (const p of BUILD_PAGES) {
      const h1Key = p.h1.trim().toLowerCase()
      expect(h1s.has(h1Key), `H1 "${p.h1}" duplicated between ${h1s.get(h1Key)} and ${p.slug}`).toBe(false)
      h1s.set(h1Key, p.slug)

      const titleKey = p.metaTitle.trim().toLowerCase()
      expect(titles.has(titleKey), `metaTitle "${p.metaTitle}" duplicated between ${titles.get(titleKey)} and ${p.slug}`).toBe(false)
      titles.set(titleKey, p.slug)
    }
  })

  it('uses url-safe kebab-case slugs', () => {
    for (const p of BUILD_PAGES) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('every related link points at an existing page and not itself', () => {
    for (const p of BUILD_PAGES) {
      expect(p.related.length).toBeGreaterThanOrEqual(2)
      for (const r of p.related) {
        expect(getBuildPage(r), `${p.slug} → related "${r}" does not exist`).toBeDefined()
        expect(r).not.toBe(p.slug)
      }
    }
  })

  it('meets minimum content depth (anti-thin-page gate)', () => {
    for (const p of BUILD_PAGES) {
      expect(p.body.length, `${p.slug} body paragraphs`).toBeGreaterThanOrEqual(2)
      expect(p.body.join(' ').length, `${p.slug} body length`).toBeGreaterThan(500)
      expect(p.features.length, `${p.slug} features`).toBeGreaterThanOrEqual(4)
      expect(p.faqs.length, `${p.slug} faqs`).toBeGreaterThanOrEqual(4)
      expect(p.promptExample.length, `${p.slug} prompt`).toBeGreaterThan(150)
    }
  })

  it('meta fields fit search-result limits', () => {
    for (const p of BUILD_PAGES) {
      expect(p.metaTitle.length, `${p.slug} metaTitle`).toBeLessThanOrEqual(75)
      expect(p.metaDesc.length, `${p.slug} metaDesc`).toBeGreaterThan(70)
      expect(p.metaDesc.length, `${p.slug} metaDesc`).toBeLessThanOrEqual(165)
    }
  })

  it('has no duplicated copy across pages (anti-doorway gate)', () => {
    // No two pages may share a body paragraph, tagline, prompt, or FAQ answer.
    const seen = new Map<string, string>()
    for (const p of BUILD_PAGES) {
      const texts = [p.tagline, p.promptExample, ...p.body, ...p.faqs.map(f => f.a)]
      for (const t of texts) {
        const key = t.trim().toLowerCase()
        expect(seen.has(key), `"${t.slice(0, 60)}…" appears in both ${seen.get(key)} and ${p.slug}`).toBe(false)
        seen.set(key, p.slug)
      }
    }
  })

  it('starter prompts describe concrete screens/pages, not vague ideas', () => {
    for (const p of BUILD_PAGES) {
      expect(
        /page|screen/i.test(p.promptExample),
        `${p.slug} prompt should name concrete pages or screens`,
      ).toBe(true)
    }
  })
})

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import BuildPage, { generateMetadata } from './[slug]/page'
import { BUILD_PAGES } from './data'

// React's static-markup renderer HTML-escapes text content (', ", &, <, >),
// so raw copy containing an apostrophe never literally appears in the output
// — escape the expected string the same way before checking for it.
function escapeForTextNode(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}
function expectRendered(html: string, text: string, label: string) {
  expect(html, label).toContain(escapeForTextNode(text))
}

// The data-shape gate in build-pages.test.ts checks BUILD_PAGES entries, never
// the page THEY render into — so a template regression (a broken related-link
// render, a JSON-LD field that stopped matching the page data, generateMetadata
// silently dropping a field) could ship even with every data test green. This
// actually renders every page and checks the real output.
describe('build page render integrity', () => {
  for (const p of BUILD_PAGES) {
    it(`${p.slug}: renders real content, valid JSON-LD, and correct metadata`, async () => {
      const el = await BuildPage({ params: Promise.resolve({ slug: p.slug }) })
      const html = renderToStaticMarkup(createElement(el.type, el.props))

      // The content that matters for SEO/UX must actually be in the DOM, not
      // just present in the data file.
      expectRendered(html, p.h1, `${p.slug}: h1 missing from rendered output`)
      expectRendered(html, p.tagline, `${p.slug}: tagline missing from rendered output`)
      for (const faq of p.faqs) expectRendered(html, faq.q, `${p.slug}: FAQ question "${faq.q}" missing`)
      for (const r of p.related) expect(html, `${p.slug}: related link to ${r} missing`).toContain(`/build/${r}`)

      // JSON-LD must parse and stay in sync with the page data — a template
      // edit that renames/reorders a field without updating jsonLd wouldn't
      // fail any data-shape test, only this one.
      const ldMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)
      expect(ldMatch, `${p.slug}: no JSON-LD script found in rendered output`).toBeTruthy()
      const jsonLd = JSON.parse(ldMatch![1])
      const howTo = jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'HowTo')
      const faqPage = jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage')
      expect(howTo?.name).toBe(p.h1)
      expect(faqPage?.mainEntity.length).toBe(p.faqs.length)

      const meta = await generateMetadata({ params: Promise.resolve({ slug: p.slug }) })
      expect(meta.title).toBe(p.metaTitle)
      expect(meta.description).toBe(p.metaDesc)
      expect((meta.alternates as { canonical?: string })?.canonical).toBe(`https://wyberai.com/build/${p.slug}`)
    })
  }

  it('returns 404 metadata/notFound for an unknown slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'this-slug-does-not-exist' }) })
    expect(meta).toEqual({})
    await expect(BuildPage({ params: Promise.resolve({ slug: 'this-slug-does-not-exist' }) })).rejects.toBeTruthy()
  })
})

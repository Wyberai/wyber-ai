import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import LocalizedBuildPage, { generateMetadata } from './page'
import { BUILD_PAGES } from '@/app/build/data'
import { NON_ENGLISH_LOCALES } from '@/lib/i18n/locales'
import { getTranslatedBuildPage } from '@/lib/i18n/dict/build-content'

// Mirrors src/app/build/build-pages-render.test.ts but for the locale-prefixed
// route: renders every /[locale]/build/[slug] combination and checks the
// TRANSLATED content actually lands in the DOM, not just the English fallback.
function escapeForTextNode(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}
function expectRendered(html: string, text: string, label: string) {
  expect(html, label).toContain(escapeForTextNode(text))
}

describe('locale build page render integrity', () => {
  for (const locale of NON_ENGLISH_LOCALES) {
    for (const p of BUILD_PAGES) {
      it(`${locale}/${p.slug}: renders translated content, valid JSON-LD, and correct metadata`, async () => {
        const content = getTranslatedBuildPage(p.slug, locale)!
        const el = await LocalizedBuildPage({ params: Promise.resolve({ locale, slug: p.slug }) })
        const html = renderToStaticMarkup(createElement(el.type, el.props))

        expectRendered(html, content.h1, `${locale}/${p.slug}: translated h1 missing from rendered output`)
        expectRendered(html, content.tagline, `${locale}/${p.slug}: translated tagline missing from rendered output`)
        for (const faq of content.faqs) expectRendered(html, faq.q, `${locale}/${p.slug}: FAQ question "${faq.q}" missing`)
        expect(html, `${locale}/${p.slug}: lang attribute not set`).toContain(`lang="${locale}"`)
        for (const r of p.related) expect(html, `${locale}/${p.slug}: related link to ${r} missing`).toContain(`/${locale}/build/${r}`)

        const ldMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)
        expect(ldMatch, `${locale}/${p.slug}: no JSON-LD script found`).toBeTruthy()
        const jsonLd = JSON.parse(ldMatch![1])
        const howTo = jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'HowTo')
        const faqPage = jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage')
        expect(howTo?.name).toBe(content.h1)
        expect(faqPage?.mainEntity.length).toBe(content.faqs.length)

        const meta = await generateMetadata({ params: Promise.resolve({ locale, slug: p.slug }) })
        expect(meta.title).toBe(content.metaTitle)
        expect(meta.description).toBe(content.metaDesc)
        expect((meta.alternates as { canonical?: string })?.canonical).toBe(`https://wyberai.com/${locale}/build/${p.slug}`)
      })
    }
  }

  it('404s (empty metadata + notFound) for locale=en', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'en', slug: BUILD_PAGES[0].slug }) })
    expect(meta).toEqual({})
    await expect(LocalizedBuildPage({ params: Promise.resolve({ locale: 'en', slug: BUILD_PAGES[0].slug }) })).rejects.toBeTruthy()
  })

  it('404s for an unknown slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'hi', slug: 'this-slug-does-not-exist' }) })
    expect(meta).toEqual({})
    await expect(LocalizedBuildPage({ params: Promise.resolve({ locale: 'hi', slug: 'this-slug-does-not-exist' }) })).rejects.toBeTruthy()
  })
})

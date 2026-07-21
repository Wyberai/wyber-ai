import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import LocalizedUseCasePage, { generateMetadata } from './page'
import { USE_CASES } from '@/app/use-cases/[slug]/data'
import { NON_ENGLISH_LOCALES } from '@/lib/i18n/locales'
import { USE_CASES_CONTENT } from '@/lib/i18n/dict/use-cases-content'

function escapeForTextNode(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}
function expectRendered(html: string, text: string, label: string) {
  expect(html, label).toContain(escapeForTextNode(text))
}

describe('locale use-case page render integrity', () => {
  for (const locale of NON_ENGLISH_LOCALES) {
    for (const uc of USE_CASES) {
      it(`${locale}/${uc.slug}: renders translated content, valid JSON-LD, and correct metadata`, async () => {
        const content = USE_CASES_CONTENT[locale][uc.slug]
        const el = await LocalizedUseCasePage({ params: Promise.resolve({ locale, slug: uc.slug }) })
        const html = renderToStaticMarkup(createElement(el.type, el.props))

        expectRendered(html, content.h1, `${locale}/${uc.slug}: translated h1 missing from rendered output`)
        expectRendered(html, content.tagline, `${locale}/${uc.slug}: translated tagline missing from rendered output`)
        for (const faq of content.faqs) expectRendered(html, faq.q, `${locale}/${uc.slug}: FAQ question "${faq.q}" missing`)
        expect(html, `${locale}/${uc.slug}: lang attribute not set`).toContain(`lang="${locale}"`)

        const ldMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)
        expect(ldMatch, `${locale}/${uc.slug}: no JSON-LD script found`).toBeTruthy()
        const jsonLd = JSON.parse(ldMatch![1])
        const faqPage = jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage')
        expect(faqPage?.mainEntity.length).toBe(content.faqs.length)

        const meta = await generateMetadata({ params: Promise.resolve({ locale, slug: uc.slug }) })
        expect(meta.title).toBe(content.metaTitle)
        expect(meta.description).toBe(content.metaDesc)
        expect((meta.alternates as { canonical?: string })?.canonical).toBe(`https://wyberai.com/${locale}/use-cases/${uc.slug}`)
      })
    }
  }

  it('404s (empty metadata + notFound) for locale=en', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'en', slug: USE_CASES[0].slug }) })
    expect(meta).toEqual({})
    await expect(LocalizedUseCasePage({ params: Promise.resolve({ locale: 'en', slug: USE_CASES[0].slug }) })).rejects.toBeTruthy()
  })

  it('404s for an unknown slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: 'hi', slug: 'this-slug-does-not-exist' }) })
    expect(meta).toEqual({})
    await expect(LocalizedUseCasePage({ params: Promise.resolve({ locale: 'hi', slug: 'this-slug-does-not-exist' }) })).rejects.toBeTruthy()
  })
})

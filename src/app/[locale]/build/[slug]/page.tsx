import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { BUILD_PAGES, CATEGORY_LABELS, getBuildPage, type BuildCategory } from '@/app/build/data'
import { StartBuildButton } from '@/app/build/StartBuildButton'
import { NON_ENGLISH_LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { localeAlternates, localePath } from '@/lib/i18n/hreflang'
import { getT } from '@/lib/i18n/getT'
import { BUILD_TEMPLATE_STRINGS } from '@/lib/i18n/dict/build-template'
import { getTranslatedBuildPage } from '@/lib/i18n/dict/build-content'

// Locale-prefixed sibling of app/build/[slug]/page.tsx — see that file's
// English version for the canonical (unprefixed) route. Only 'hi'|'kn'|'te'|'ta'
// generate here; 'en' 404s (English stays at the existing /build/[slug] URL).
// Structural fields (slug/target/category/related/noun) come from the English
// BuildPage record via getBuildPage(); translated copy (h1/tagline/body/
// features/promptExample/faqs) comes from dict/build-content via
// getTranslatedBuildPage(); template chrome (nav/section headings/CTAs) comes
// from dict/build-template via BUILD_TEMPLATE_STRINGS.

export function generateStaticParams() {
  return NON_ENGLISH_LOCALES.flatMap(locale => BUILD_PAGES.map(p => ({ locale, slug: p.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || locale === 'en') return {}
  const page = getBuildPage(slug)
  const content = getTranslatedBuildPage(slug, locale)
  if (!page || !content) return {}
  return {
    title: content.metaTitle,
    description: content.metaDesc,
    alternates: {
      canonical: `https://wyberai.com/${locale}/build/${slug}`,
      languages: localeAlternates(`/build/${slug}`),
    },
    openGraph: { title: content.metaTitle, description: content.metaDesc, url: `https://wyberai.com/${locale}/build/${slug}` },
  }
}

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: '#0EA5E9' }

const TARGET_COLORS = { web: '#0EA5E9', mobile: '#a855f7' } as const

const CATEGORY_KEY: Record<BuildCategory, string> = {
  productivity: 'categoryProductivity', business: 'categoryBusiness', health: 'categoryHealth',
  finance: 'categoryFinance', events: 'categoryEvents', education: 'categoryEducation',
}

export default async function LocalizedBuildPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale) || locale === 'en') notFound()
  const page = getBuildPage(slug)
  const content = getTranslatedBuildPage(slug, locale)
  if (!page || !content) notFound()

  const t = getT(BUILD_TEMPLATE_STRINGS, locale)
  const lp = (path: string) => localePath(path, locale)
  const withNoun = (template: string) => template.replace('{noun}', page.noun)

  const color = TARGET_COLORS[page.target]
  const related = page.related.map(getBuildPage).filter((p): p is NonNullable<typeof p> => !!p)

  const howItWorks = [
    { step: '01', title: t('step1Title'), desc: t('step1Desc') },
    { step: '02', title: t('step2Title'), desc: t('step2Desc') },
    { step: '03', title: t('step3Title'), desc: t('step3Desc') },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: content.h1,
        description: content.metaDesc,
        step: howItWorks.map((h, i) => ({ '@type': 'HowToStep', position: i + 1, name: h.title, text: h.desc })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div lang={locale} style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href={lp('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={lp('/build')} style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>{t('navWhatToBuild')}</Link>
          <Link href={lp('/pricing')} style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>{t('navPricing')}</Link>
          <Link href={lp('/signup')} style={{ padding: '7px 16px', borderRadius: 8, background: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{t('tryFree')}</Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px clamp(16px,4vw,48px) 0', display: 'flex', gap: 6, fontSize: 12, color: s.dim, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={lp('/')} style={{ color: s.dim, textDecoration: 'none' }}>{t('home')}</Link>
        <span>›</span>
        <Link href={lp('/build')} style={{ color: s.dim, textDecoration: 'none' }}>{t('build')}</Link>
        <span>›</span>
        <span style={{ color: s.muted }}>{page.noun}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <header style={{ marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {t(CATEGORY_KEY[page.category])} · {page.target === 'mobile' ? t('mobileApp') : t('webApp')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 18px', lineHeight: 1.12 }}>
            {content.h1}
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            {content.tagline}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <StartBuildButton prompt={content.promptExample} target={page.target} slug={page.slug} label={withNoun(t('buildMyNounFree'))} color={color} />
            <Link href={lp('/pricing')} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              {t('seePricing')}
            </Link>
          </div>
        </header>

        {/* Body */}
        <div style={{ marginBottom: 56 }}>
          {content.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: s.muted, lineHeight: 1.75, margin: '0 0 18px', maxWidth: 720 }}>{para}</p>
          ))}
        </div>

        {/* What your app needs */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            {withNoun(t('whatYourAppNeeds'))}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {content.features.map((f, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 14 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            {t('threeStepsHeading')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {howItWorks.map(h => (
              <div key={h.step} style={{ border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--brand-mono, monospace)' }}>{h.step}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{h.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.65 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Starter prompt */}
        <section style={{ marginBottom: 64, background: s.card, borderRadius: 14, padding: 'clamp(20px,3vw,32px)', border: `1px solid ${color}25` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{t('starterPromptEyebrow')}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>{withNoun(t('starterPromptHeading'))}</h2>
          <div style={{ background: '#0d0d10', borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontFamily: 'monospace', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {content.promptExample}
          </div>
          <StartBuildButton prompt={content.promptExample} target={page.target} slug={page.slug} label={t('useThisPromptFree')} color={color} variant="compact" />
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            {withNoun(t('faqHeading'))}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {content.faqs.map((faq, i) => (
              <details key={i} style={{ borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
                <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: s.text, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, userSelect: 'none' }}>
                  {faq.q}
                  <span style={{ color: s.dim, fontSize: 18, flexShrink: 0 }}>+</span>
                </summary>
                <div style={{ padding: '0 20px 18px', fontSize: 14, color: s.muted, lineHeight: 1.7, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA footer */}
        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{t('ctaFooterHeading')}</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>{withNoun(t('ctaFooterBody'))}</p>
          <StartBuildButton prompt={content.promptExample} target={page.target} slug={page.slug} label={withNoun(t('buildMyNoun'))} color={color} variant="compact" />
        </div>

        {/* Related builds + pillar links */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${s.border}` }}>
          {related.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>{t('peopleAlsoBuild')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {related.map(r => (
                  <Link key={r.slug} href={lp(`/build/${r.slug}`)} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
                    {r.noun}
                  </Link>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>{t('learnMore')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={lp(page.target === 'mobile' ? '/use-cases/build-mobile-app-with-ai' : '/use-cases/no-code-web-app-builder')} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              {page.target === 'mobile' ? t('buildMobileAppLink') : t('noCodeWebBuilderLink')}
            </Link>
            <Link href={lp('/use-cases/secure-ai-app-builder')} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              {t('securityFirstLink')}
            </Link>
            <Link href={lp('/vs/lovable')} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              {t('vsLovableLink')}
            </Link>
          </div>
        </div>
      </div>
      <style>{` details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}

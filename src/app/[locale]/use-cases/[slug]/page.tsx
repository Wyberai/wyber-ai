import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { USE_CASES } from '@/app/use-cases/[slug]/data'
import { NON_ENGLISH_LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { localeAlternates, localePath } from '@/lib/i18n/hreflang'
import { getT } from '@/lib/i18n/getT'
import { BUILD_TEMPLATE_STRINGS } from '@/lib/i18n/dict/build-template'
import { USE_CASES_TEMPLATE_STRINGS } from '@/lib/i18n/dict/use-cases-template'
import { USE_CASES_CONTENT, type TranslatedUseCase } from '@/lib/i18n/dict/use-cases-content'

// Locale-prefixed sibling of app/use-cases/[slug]/page.tsx — see that file's
// English version for the canonical (unprefixed) route. Only 'hi'|'kn'|'te'|'ta'
// generate here; 'en' 404s. Structural fields (slug/pillar/pillarColor/ctaHref)
// come from the English UseCase record in data.ts; translated copy comes from
// dict/use-cases-content.ts; shared nav chrome is reused from
// dict/build-template.ts (BUILD_TEMPLATE_STRINGS), page-specific chrome from
// dict/use-cases-template.ts (USE_CASES_TEMPLATE_STRINGS).

function getTranslatedUseCase(slug: string, locale: Locale): TranslatedUseCase | undefined {
  return USE_CASES_CONTENT[locale]?.[slug] ?? USE_CASES_CONTENT.en[slug]
}

export function generateStaticParams() {
  return NON_ENGLISH_LOCALES.flatMap(locale => USE_CASES.map(uc => ({ locale, slug: uc.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || locale === 'en') return {}
  const uc = USE_CASES.find(u => u.slug === slug)
  const content = getTranslatedUseCase(slug, locale)
  if (!uc || !content) return {}
  return {
    title: content.metaTitle,
    description: content.metaDesc,
    alternates: {
      canonical: `https://wyberai.com/${locale}/use-cases/${slug}`,
      languages: localeAlternates(`/use-cases/${slug}`),
    },
    openGraph: { title: content.metaTitle, description: content.metaDesc, url: `https://wyberai.com/${locale}/use-cases/${slug}` },
  }
}

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: '#0EA5E9', green: '#10b981', amber: '#f59e0b' }

const PILLAR_COLORS: Record<string, string> = { web: s.sky, mobile: '#F97316', agents: s.green, workflows: s.amber }

export default async function LocalizedUseCasePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale) || locale === 'en') notFound()
  const uc = USE_CASES.find(u => u.slug === slug)
  const content = getTranslatedUseCase(slug, locale)
  if (!uc || !content) notFound()

  const t = getT(BUILD_TEMPLATE_STRINGS, locale)
  const tu = getT(USE_CASES_TEMPLATE_STRINGS, locale)
  const lp = (path: string) => localePath(path, locale)

  const color = PILLAR_COLORS[uc.pillar] ?? s.sky

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: content.metaTitle,
        description: content.metaDesc,
        url: `https://wyberai.com/${locale}/use-cases/${slug}`,
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
          <Link href={lp('/use-cases')} style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>{t('navUseCases')}</Link>
          <Link href={lp('/pricing')} style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>{t('navPricing')}</Link>
          <Link href={lp('/signup')} style={{ padding: '7px 16px', borderRadius: 8, background: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{t('tryFree')}</Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px clamp(16px,4vw,48px) 0', display: 'flex', gap: 6, fontSize: 12, color: s.dim, alignItems: 'center' }}>
        <Link href={lp('/')} style={{ color: s.dim, textDecoration: 'none' }}>{t('home')}</Link>
        <span>›</span>
        <Link href={lp('/use-cases')} style={{ color: s.dim, textDecoration: 'none' }}>{tu('breadcrumbUseCases')}</Link>
        <span>›</span>
        <span style={{ color: s.muted }}>{content.h1}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <header style={{ marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {content.pillarLabel}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 18px', lineHeight: 1.12 }}>
            {content.h1}
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            {content.tagline}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={lp(uc.ctaHref)} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: color, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              {content.ctaLabel}
            </Link>
            <Link href={lp('/pricing')} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              {t('seePricing')}
            </Link>
          </div>
        </header>

        {/* Body paragraphs */}
        <div style={{ marginBottom: 56 }}>
          {content.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: s.muted, lineHeight: 1.75, margin: '0 0 18px', maxWidth: 720 }}>{para}</p>
          ))}
        </div>

        {/* Features grid */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            {tu('everythingYouNeed')}
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

        {/* Starter prompt */}
        <section style={{ marginBottom: 64, background: s.card, borderRadius: 14, padding: 'clamp(20px,3vw,32px)', border: `1px solid ${color}25` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{tu('starterPromptEyebrow')}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>{tu('starterPromptHeading')}</h2>
          <div style={{ background: '#0d0d10', borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontFamily: 'monospace', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {content.promptExample}
          </div>
          <Link href={lp(uc.ctaHref)} style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 9, background: color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            {tu('tryThisPromptFree')}
          </Link>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            {tu('faqHeading')}
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{tu('ctaFooterHeading')}</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>{tu('ctaFooterBody')}</p>
          <Link href={lp(uc.ctaHref)} style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            {content.ctaLabel}
          </Link>
        </div>

        {/* See also */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>{tu('compareWyberAi')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['lovable', 'bolt', 'v0', 'replit', 'cursor'].map(cslug => (
              <Link key={cslug} href={lp(`/vs/${cslug}`)} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
                {tu('vsPrefix')} {cslug.charAt(0).toUpperCase() + cslug.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{` details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { NON_ENGLISH_LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { localeAlternates, localePath } from '@/lib/i18n/hreflang'
import { VS_INDEX_CONTENT } from '@/lib/i18n/dict/vs-index'

// Locale-prefixed sibling of app/vs/page.tsx — see that file's English
// version for the canonical (unprefixed) route. Only 'hi'|'kn'|'te'|'ta'
// generate; 'en' 404s. slug/url/tag stay identical across locales (proper
// nouns / URLs) — only summary/wyberWins per competitor are translated,
// pulled from dict/vs-index.ts.
const COMPARISONS = [
  { slug: 'lovable', name: 'Lovable', url: 'lovable.dev', tag: 'AI web app builder' },
  { slug: 'bolt', name: 'Bolt.new', url: 'bolt.new', tag: 'AI web app builder' },
  { slug: 'v0', name: 'v0 by Vercel', url: 'v0.dev', tag: 'UI component generator' },
  { slug: 'replit', name: 'Replit', url: 'replit.com', tag: 'Cloud IDE' },
  { slug: 'cursor', name: 'Cursor', url: 'cursor.com', tag: 'AI code editor' },
  { slug: 'softr', name: 'Softr', url: 'softr.io', tag: 'No-code platform' },
] as const

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: 'var(--brand-accent)' }

export function generateStaticParams() {
  return NON_ENGLISH_LOCALES.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale) || locale === 'en') return {}
  const c = VS_INDEX_CONTENT[locale]
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: `https://wyberai.com/${locale}/vs`,
      languages: localeAlternates('/vs'),
    },
  }
}

export default async function LocalizedVsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale) || locale === 'en') notFound()
  const c = VS_INDEX_CONTENT[locale as Exclude<Locale, 'en'>]
  const lp = (path: string) => localePath(path, locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: c.heroTitle,
    description: c.metaDescription,
    url: `https://wyberai.com/${locale}/vs`,
  }

  return (
    <div lang={locale} style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href={lp('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href={lp('/signup')} style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{c.ctaButton}</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <header style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="mk-eyebrow" style={{ marginBottom: 12 }}>{c.eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
            {c.heroTitle}
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            {c.heroBody}
          </p>
        </header>

        {/* Six products banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 56 }}>
          {[['🖥', c.productLabels[0]], ['📱', c.productLabels[1]], ['🔗', c.productLabels[2]], ['🚀', c.productLabels[3]], ['📦', c.productLabels[4]], ['🏆', c.productLabels[5]]].map(([icon, p], i) => {
            const prod = p as { label: string; sub: string }
            return (
              <div key={i} style={{ background: s.card, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon as string}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.sky, marginBottom: 2 }}>{prod.label}</div>
                <div style={{ fontSize: 11, color: s.muted }}>{prod.sub}</div>
              </div>
            )
          })}
        </div>

        {/* Comparison cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {COMPARISONS.map(comp => {
            const content = c.comparisons[comp.slug]
            return (
              <Link key={comp.slug} href={lp(`/vs/${comp.slug}`)} style={{ display: 'block', background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 'clamp(18px,3vw,28px)', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: s.text }}>
                        WyberAi vs {comp.name}
                      </h2>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: s.muted, border: `1px solid ${s.border}` }}>
                        {comp.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.6, margin: '0 0 12px' }}>{content.summary}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {content.wyberWins.map(w => (
                        <span key={w} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.08)', color: s.sky, border: '1px solid rgba(14,165,233,0.2)', fontWeight: 500 }}>
                          ✓ {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: `1px solid rgba(14,165,233,0.2)`, fontSize: 13, fontWeight: 700, color: s.sky, whiteSpace: 'nowrap' }}>
                    {c.seeComparison}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{c.ctaHeading}</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>{c.ctaBody}</p>
          <Link href={lp('/signup')} style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            {c.ctaButton}
          </Link>
        </div>
      </div>

    </div>
  )
}

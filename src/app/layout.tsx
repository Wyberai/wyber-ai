import type { Metadata } from "next";
import "./globals.css";
import "@/styles/brand.css";
import "@/styles/editor.css";
import { ThemeProvider } from '@/lib/theme';
import { PlatformChrome } from '@/components/shared/PlatformChrome';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PostHogProvider } from '@/components/shared/PostHogProvider';
import { Suspense } from 'react'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WyberAi',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'WyberAi — Build web and mobile apps with AI', template: '%s | WyberAi' },
  description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
  keywords: ['AI app builder', 'no-code AI', 'build web app with AI', 'mobile app builder', 'React app generator', 'AI code generator', 'build app without coding', 'WyberAi'],
  authors: [{ name: 'WyberAi', url: 'https://wyberai.com' }],
  creator: 'SignalPulse Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'WyberAi',
    title: 'WyberAi — Build web and mobile apps with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
    images: [{ url: '/api/og?title=Build%20web%20and%20mobile%20apps&sub=Web%20Apps%20%C2%B7%20Mobile%20Apps%20%C2%B7%20AI-powered%20%C2%B7%20No%20code', width: 1200, height: 630, alt: 'WyberAi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WyberAi — Build web and mobile apps with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
    images: ['/api/og?title=Build%20web%20and%20mobile%20apps&sub=Web%20Apps%20%C2%B7%20Mobile%20Apps%20%C2%B7%20AI-powered%20%C2%B7%20No%20code'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://wyberai.com' },
}

export const viewport = { themeColor: '#0EA5E9' };

// Entity schema — tells search/answer engines exactly who makes WyberAi
// (SignalPulse Technologies) and what it is, overriding stale Knowledge Graph data.
const SITE = 'https://wyberai.com'
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'SignalPulse Technologies',
      legalName: 'SignalPulse Technologies LLC',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/icon.svg` },
      description: 'SignalPulse Technologies builds WyberAi — an AI platform that turns plain-English prompts into production-ready web and mobile apps.',
      // HQ matches the Wyoming SoS registration exactly (Filing ID 2026-001962094)
      // so D&B / Crunchbase / Wikidata all cross-reference cleanly.
      foundingDate: '2026-04-27',
      founder: { '@id': `${SITE}/#founder` },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '30 N Gould St, Ste R',
        addressLocality: 'Sheridan',
        addressRegion: 'WY',
        postalCode: '82801',
        addressCountry: 'US',
      },
      sameAs: [
        'https://www.linkedin.com/company/signalpulse-technologies',
        'https://signalpulsehq.com',
      ],
    },
    {
      '@type': 'Person',
      '@id': `${SITE}/#founder`,
      name: 'Sumeet Sutar',
      jobTitle: 'Founder & CEO',
      worksFor: { '@id': `${SITE}/#organization` },
      sameAs: [
        'https://www.linkedin.com/in/sumeetsutar',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'WyberAi',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: 'WyberAi',
      // Spelling variants so answer engines match every form and stop confusing
      // WyberAi with phonetic neighbours (Vybers.ai, Viber, Wyber messaging).
      alternateName: ['Wyber AI', 'WyberAI', 'Wyber Ai', 'Wyber'],
      disambiguatingDescription:
        'WyberAi (also written Wyber AI or WyberAI) is an AI app builder by SignalPulse Technologies LLC. It is not affiliated with Vybers.ai, Rakuten Viber, or any messaging app.',
      url: SITE,
      image: `${SITE}/api/og?title=Build%20web%20and%20mobile%20apps&sub=Web%20Apps%20%C2%B7%20Mobile%20Apps%20%C2%B7%20AI-powered%20%C2%B7%20No%20code`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      brand: { '@type': 'Brand', name: 'WyberAi' },
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
      sameAs: [
        'https://www.linkedin.com/company/wyber-ai',
        'https://x.com/WyberAi',
        'https://www.producthunt.com/products/wyberai',
      ],
      description: 'Describe your web or mobile app in plain English. WyberAi generates fresh, production-ready React code, provisions a database, and deploys to a live URL in minutes — no engineers needed.',
      featureList: [
        'AI generates production-ready React + Tailwind code',
        'Build web apps and mobile apps from a prompt',
        'Automatic error detection and resolution during builds',
        'One-click deploy to a live URL on Vercel',
        'Supabase database + auth, GitHub push, custom domains',
        '27 integrations — Supabase, Stripe, OpenAI and more',
      ],
      // AggregateOffer (not a single $29 Offer) so engines report the real
      // range — free to start, paid plans up to $199 — instead of "$29 only".
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '199',
        priceCurrency: 'USD',
        offerCount: 5,
        availability: 'https://schema.org/InStock',
        url: `${SITE}/pricing`,
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = typeof localStorage !== 'undefined' ? localStorage.getItem('wyber-theme') : null;
                  var p = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', t || p);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <PostHogProvider>
          <ThemeProvider>
            <ErrorBoundary fallbackMessage="WyberAI hit an unexpected error">
              <Suspense>
                {children}
              </Suspense>
            </ErrorBoundary>
          </ThemeProvider>
          {/* All platform-only chrome (cookie banner, palette, chat widgets,
              analytics pixels, SW registration) lives in PlatformChrome, which
              renders NOTHING on white-label routes (/app/[slug]) so published
              user apps stay 100% unbranded and untracked. */}
          <Suspense fallback={null}><PlatformChrome /></Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}

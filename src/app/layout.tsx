import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { WyberChatbot } from '@/components/shared/WyberChatbot';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PostHogProvider } from '@/components/shared/PostHogProvider';
import Script from 'next/script'
import { Suspense } from 'react'

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'WyberAi — Build apps and automate your business with AI', template: '%s | WyberAi' },
  description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
  keywords: ['AI app builder', 'no-code AI', 'build web app with AI', 'mobile app builder', 'React app generator', 'AI code generator', 'build app without coding', 'WyberAi'],
  authors: [{ name: 'WyberAi', url: 'https://wyberai.com' }],
  creator: 'SignalPulse Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'WyberAi',
    title: 'WyberAi — Build apps and automate your business with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
    images: [{ url: '/api/og?title=Build%20apps%20and%20automate%20your%20business&sub=Web%20Apps%20%C2%B7%20Mobile%20Apps%20%C2%B7%20AI-powered%20%C2%B7%20No%20code', width: 1200, height: 630, alt: 'WyberAi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WyberAi — Build apps and automate your business with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps and mobile apps with AI — production-ready code, live preview, one-click deploy. No engineers needed.',
    images: ['/api/og?title=Build%20apps%20and%20automate%20your%20business&sub=Web%20Apps%20%C2%B7%20Mobile%20Apps%20%C2%B7%20AI-powered%20%C2%B7%20No%20code'],
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
      legalName: 'SignalPulse Technologies',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/icon.svg` },
      description: 'SignalPulse Technologies builds WyberAi — an AI platform that turns plain-English prompts into production-ready web and mobile apps.',
      sameAs: [
        'https://www.linkedin.com/company/signalpulse-technologies',
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
      url: SITE,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      brand: { '@type': 'Brand', name: 'WyberAi' },
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
      sameAs: [
        'https://www.linkedin.com/company/wyber-ai',
        'https://x.com/WyberAi',
        'https://theresanaiforthat.com/ai/wyberai/',
      ],
      description: 'Describe your web or mobile app in plain English. WyberAi generates fresh, production-ready React code, provisions a database, and deploys to a live URL in minutes — no engineers needed.',
      featureList: [
        'AI generates production-ready React + Tailwind code',
        'Build web apps and mobile apps from a prompt',
        'Self-healing builds that fix their own errors',
        'One-click deploy to a live URL on Vercel',
        'Supabase database + auth, GitHub push, custom domains',
        '48 integrations — Supabase, Stripe, OpenAI and more',
      ],
      offers: {
        '@type': 'Offer',
        price: '29.00',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
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
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-YJTD8LYK6V" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YJTD8LYK6V');`}
      </Script>
      <body>
        <PostHogProvider>
          <ThemeProvider>
            <ErrorBoundary fallbackMessage="WyberAI hit an unexpected error">
              <Suspense>
                {children}
              </Suspense>
            </ErrorBoundary>
          </ThemeProvider>
          <CookieBanner />
          <CommandPalette />
          <Suspense fallback={null}><WyberChatbot /></Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}

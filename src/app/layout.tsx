import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { WyberChatbot } from '@/components/shared/WyberChatbot';
import { SupportChat } from '@/components/shared/SupportChat';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PostHogProvider } from '@/components/shared/PostHogProvider';
import Script from 'next/script'
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
      '@type': ['SoftwareApplication', 'Product'],
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
      offers: {
        '@type': 'Offer',
        price: '29.00',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
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
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-YJTD8LYK6V" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YJTD8LYK6V');`}
      </Script>
      <Script id="reddit-pixel" strategy="afterInteractive">
        {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id=a2_j60r5xh8qvd4";t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_j60r5xh8qvd4');rdt('track','PageVisit');`}
      </Script>
      {/* Meta (Facebook/Instagram) Pixel — base + PageView for audiences and
          retargeting. Conversions (CompleteRegistration, Purchase) are sent
          server-side via the Conversions API (lib/meta-capi.ts) so iOS/ad
          blockers can't drop them. Env-gated: renders only when the pixel id
          is set, so nothing loads until Meta is actually configured. */}
      {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
      <Script id="sw-register" strategy="afterInteractive">
        {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
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
          {/* Logged-in surfaces (dashboard etc.) — AI support + human escalation to Slack */}
          <Suspense fallback={null}><SupportChat /></Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}

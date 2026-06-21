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
  description: 'Describe what you want in plain English. WyberAi builds web apps, mobile apps, deploys AI agents, runs workflows, hires AI employees, and fills your pipeline — all from one platform.',
  keywords: ['AI app builder', 'no-code AI', 'build web app with AI', 'mobile app builder', 'AI agents', 'workflow automation', 'AI employees', 'GTM engine', 'lead generation AI', 'WyberAi'],
  authors: [{ name: 'WyberAi', url: 'https://wyberai.com' }],
  creator: 'SignalPulse Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'WyberAi',
    title: 'WyberAi — Build apps and automate your business with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps, mobile apps, deploys AI agents, runs workflows, hires AI employees, and fills your pipeline — all from one platform.',
    images: [{ url: '/api/og?title=Build%20apps%20and%20automate%20your%20business&sub=Web%20Apps%20%C2%B7%20Mobile%20%C2%B7%20AI%20Agents%20%C2%B7%20Workflows%20%C2%B7%20AI%20Employees%20%C2%B7%20GTM', width: 1200, height: 630, alt: 'WyberAi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WyberAi — Build apps and automate your business with AI',
    description: 'Describe what you want in plain English. WyberAi builds web apps, mobile apps, deploys AI agents, runs workflows, hires AI employees, and fills your pipeline — all from one platform.',
    images: ['/api/og?title=Build%20apps%20and%20automate%20your%20business&sub=Web%20Apps%20%C2%B7%20Mobile%20%C2%B7%20AI%20Agents%20%C2%B7%20Workflows%20%C2%B7%20AI%20Employees%20%C2%B7%20GTM'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://wyberai.com' },
}

export const viewport = { themeColor: '#0EA5E9' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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

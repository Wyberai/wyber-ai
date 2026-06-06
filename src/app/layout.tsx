import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { WyberChatbot } from '@/components/shared/WyberChatbot';
import { PostHogProvider } from '@/components/shared/PostHogProvider';
import Script from 'next/script'
import { Suspense } from 'react'

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'Wyber AI — Build Apps with AI in 30 Seconds', template: '%s | Wyber AI' },
  description: 'Turn any idea into a live app in under a minute. 50% more credits than Lovable at 75% of the price. GitHub sync, Vercel deploy, Supabase database. Start free.',
  keywords: ['AI app builder', 'Lovable alternative', 'build app with AI', 'vibe coding', 'no-code AI', 'AI coding tool', 'Wyber AI'],
  authors: [{ name: 'Wyber AI', url: 'https://wyberai.com' }],
  creator: 'SignalPulse Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'Wyber AI',
    title: 'Wyber AI — Build Apps with AI in 30 Seconds',
    description: 'Turn any idea into a live app in under a minute.',
    images: [{ url: '/api/og?title=Build%20Apps%20with%20AI&sub=No%20coding%20required', width: 1200, height: 630, alt: 'Wyber AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wyber AI — Build Apps with AI in 30 Seconds',
    description: '50% more credits than Lovable at 75% of the price. Start free.',
    images: ['/api/og?title=Build%20Apps%20with%20AI&sub=No%20coding%20required'],
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
            <Suspense>
              {children}
            </Suspense>
          </ThemeProvider>
          <CookieBanner />
          <WyberChatbot />
        </PostHogProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';
import { SupportChat } from '@/components/shared/SupportChat'
import { CookieBanner } from '@/components/shared/CookieBanner';

export const metadata: Metadata = {
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
    description: 'Turn any idea into a live app in under a minute. 50% more credits than Lovable at 75% of the price.',
    images: [{ url: '/api/og?title=Describe%20your%20app.%20We%20build%20it.&sub=AI%20app%20builder%20with%2050%25%20more%20credits%20than%20Lovable', width: 1200, height: 630, alt: 'Wyber AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wyber AI — Build Apps with AI in 30 Seconds',
    description: '50% more credits than Lovable at 75% of the price. Start free.',
    images: ['/api/og?title=Describe%20your%20app.%20We%20build%20it.&sub=AI%20app%20builder%20with%2050%25%20more%20credits%20than%20Lovable'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://wyberai.com' },
}

export const viewport = { themeColor: '#0EA5E9' };

import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var t = localStorage.getItem('wyber-theme');
                var p = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', t || p);
              })();
            `,
          }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YJTD8LYK6V"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YJTD8LYK6V');
        `}
      </Script>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <CookieBanner />
        <SupportChat />
</body>
    </html>
  );
}

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
  title: { default: 'WyberAi — Build web apps, mobile apps, AI agents, workflows & AI employees', template: '%s | WyberAi' },
  description: 'From idea to running product. One platform, one prompt, no code — for web, mobile, agents, workflows, and AI employees.',
  keywords: ['AI app builder', 'no-code AI', 'build web app with AI', 'mobile app builder', 'AI agents', 'workflow automation', 'AI employees', 'WyberAi'],
  authors: [{ name: 'WyberAi', url: 'https://wyberai.com' }],
  creator: 'SignalPulse Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'WyberAi',
    title: 'WyberAi — Build web apps, mobile apps, AI agents, workflows & AI employees',
    description: 'From idea to running product. One platform, one prompt, no code — for web, mobile, agents, workflows, and AI employees.',
    images: [{ url: '/api/og?title=Web%2C%20Mobile%2C%20Agents%2C%20Workflows%2C%20AI%20Employees&sub=From%20idea%20to%20running%20product%2C%20in%20plain%20English', width: 1200, height: 630, alt: 'WyberAi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WyberAi — Build web apps, mobile apps, AI agents, workflows & AI employees',
    description: 'From idea to running product. One platform, one prompt, no code — for web, mobile, agents, workflows, and AI employees.',
    images: ['/api/og?title=Web%2C%20Mobile%2C%20Agents%2C%20Workflows%2C%20AI%20Employees&sub=From%20idea%20to%20running%20product%2C%20in%20plain%20English'],
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
          <Suspense fallback={null}><WyberChatbot /></Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}

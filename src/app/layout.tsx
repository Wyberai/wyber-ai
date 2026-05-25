import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';
import { CookieBanner } from '@/components/shared/CookieBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'Wyber AI — Build Apps from a Prompt', template: '%s | Wyber AI' },
  description: 'Turn your idea into a live app before lunch. Wyber AI generates production-ready full-stack code with live preview, GitHub sync, and one-click deploy. No coding experience required.',
  keywords: ['AI app builder', 'vibe coding', 'no code app builder', 'React generator', 'full-stack AI', 'wyber ai', 'build apps with AI'],
  authors: [{ name: 'SignalPulse Technologies', url: 'https://signalpulsehq.com' }],
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://wyberai.com', siteName: 'Wyber AI',
    title: 'Wyber AI — Turn your idea into a live app before lunch',
    description: 'Generate production-ready full-stack apps from a single prompt. Live preview, GitHub sync, one-click deploy.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Wyber AI' }],
  },
  twitter: {
    card: 'summary_large_image', site: '@wyberai', creator: '@wyberai',
    title: 'Wyber AI — Turn your idea into a live app before lunch',
    description: 'Generate production-ready full-stack apps from a single prompt.',
    images: ['/og.svg'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg', apple: '/icon.svg',
  },
  manifest: '/site.webmanifest',
};

export const viewport = { themeColor: '#0EA5E9' };

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
      <body>
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/6a1357c68673aa1c3e767404/1jpdoto52';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
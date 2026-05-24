import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'Wyber AI — Build Apps from a Prompt', template: '%s | Wyber AI' },
  description: 'Turn your idea into a live app before lunch. Wyber AI generates production-ready full-stack code with live preview, GitHub sync, and one-click deploy. No coding experience required.',
  keywords: ['AI app builder', 'vibe coding', 'no code app builder', 'React generator', 'full-stack AI', 'wyber ai', 'build apps with AI', 'AI web development'],
  authors: [{ name: 'SignalPulse Technologies', url: 'https://signalpulsehq.com' }],
  creator: 'Wyber AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'Wyber AI',
    title: 'Wyber AI — Turn your idea into a live app before lunch',
    description: 'Generate production-ready full-stack apps from a single prompt. Live preview, GitHub sync, one-click deploy. No coding experience required.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Wyber AI — Build Apps from a Prompt' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wyberai',
    creator: '@wyberai',
    title: 'Wyber AI — Turn your idea into a live app before lunch',
    description: 'Generate production-ready full-stack apps from a single prompt. No coding experience required.',
    images: ['/og.svg'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#0EA5E9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

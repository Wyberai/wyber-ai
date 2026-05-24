import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://wyberai.com'),
  title: { default: 'Wyber AI — Build Apps from a Prompt', template: '%s | Wyber AI' },
  description: 'Build production-ready full-stack apps from a single prompt. React, Vue, Vanilla, Next.js. Live preview, GitHub sync, one-click deploy. More credits, less money than Lovable.',
  keywords: ['AI app builder', 'Lovable alternative', 'vibe coding', 'React generator', 'full-stack AI', 'wyber ai'],
  authors: [{ name: 'Wyber AI', url: 'https://wyberai.com' }],
  creator: 'Wyber AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wyberai.com',
    siteName: 'Wyber AI',
    title: 'Wyber AI — Build Apps from a Prompt',
    description: 'Build production-ready full-stack apps from a single prompt. More credits, less money than Lovable.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Wyber AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wyberai',
    creator: '@wyberai',
    title: 'Wyber AI — Build Apps from a Prompt',
    description: 'More credits. Less money. Multi-framework. Better than Lovable.',
    images: ['/og.svg'],
  },
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#7c3aed',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

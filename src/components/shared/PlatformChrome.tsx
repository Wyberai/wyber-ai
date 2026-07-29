'use client'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { WyberChatbot } from '@/components/shared/WyberChatbot'
import { SupportChat } from '@/components/shared/SupportChat'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { InstallPrompt } from '@/components/shared/InstallPrompt'

// Routes that serve END-USER apps (published user content). These must stay
// 100% white-label: no WyberAi cookie banner, command palette, chat widgets,
// analytics pixels, or service-worker registration. A visitor to a customer's
// published app is the CUSTOMER's visitor, not ours — tracking them with our
// GA/Reddit/Meta pixels is a privacy problem, not just a branding one.
// (/p/[id] is intentionally NOT here — it's our branded share/growth page.)
const WHITE_LABEL_ROUTES = ['/app/']

export function PlatformChrome() {
  const pathname = usePathname()
  if (pathname && WHITE_LABEL_ROUTES.some(r => pathname.startsWith(r))) return null

  return (
    <>
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
      {/* Production only: in dev, Turbopack's /_next/static chunk names are
          path-stable (not content-hashed), so the SW's cache-first strategy
          serves stale CSS/JS forever after any edit. */}
      {process.env.NODE_ENV === 'production' && (
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
        </Script>
      )}
      <CookieBanner />
      <CommandPalette />
      <InstallPrompt />
      <Suspense fallback={null}><WyberChatbot /></Suspense>
      {/* Logged-in surfaces (dashboard etc.) — AI support + human escalation to Slack */}
      <Suspense fallback={null}><SupportChat /></Suspense>
    </>
  )
}

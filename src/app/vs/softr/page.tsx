import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'
import { getScanStats } from '@/lib/security-stats'

export const metadata: Metadata = {
  title: 'WyberAi vs Softr (2026) — Real Code vs No-Code Platform',
  description: 'WyberAi vs Softr: real React code you own vs a hosted no-code platform. Web + mobile apps, live database security scans, from $29/mo vs $269/mo. Verified July 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/softr' },
  openGraph: { title: 'WyberAi vs Softr (2026)', description: 'Real code you own vs a hosted no-code platform. Verified July 2026.', url: 'https://wyberai.com/vs/softr' },
}

const ROWS = [
  { feature: 'Entry price',                 wyber: '$29/mo (Starter)',            other: '$49/mo (Basic), $269/mo Business', winner: 'wyber' as const },
  { feature: 'What you get',                wyber: 'Real React + Supabase code',  other: 'Hosted app on Softr platform',     winner: 'wyber' as const },
  { feature: 'Code export / GitHub',        wyber: '✓ Full ownership',            other: '✗ Stays on platform',              winner: 'wyber' as const },
  { feature: 'Native mobile apps',          wyber: '✓ React Native + Expo',       other: '✗ (PWA wrapper only)',             winner: 'wyber' as const },
  { feature: 'Live database security scan', wyber: '✓ Probes RLS with anon key',  other: '✗ (platform-managed)',             winner: 'wyber' as const },
  { feature: 'Leave anytime with your app', wyber: '✓ Standard React + Vite',     other: '✗ Rebuild from scratch',           winner: 'wyber' as const },
  { feature: 'Workflow automations',        wyber: 'Roadmap',                     other: '✓ Built-in, mature',               winner: 'other' as const },
  { feature: 'Granular user permissions',   wyber: 'Via Supabase RLS',            other: '✓ Visual permission builder',      winner: 'other' as const },
  { feature: 'Team seats & collaboration',  wyber: 'Roadmap',                     other: '✓ Multi-seat plans',               winner: 'other' as const },
  { feature: 'Template ecosystem',          wyber: 'Growing',                     other: '✓ Large, 6 years of templates',    winner: 'other' as const },
  { feature: 'Airtable / Sheets frontends', wyber: '✗',                           other: '✓ Original core strength',         winner: 'other' as const },
  { feature: 'Custom domain',               wyber: '✓',                           other: '✓ (paid plans)',                   winner: 'tie'   as const },
  { feature: 'AI generation credits',       wyber: 'All plans, top-ups never expire', other: '100 AI credits on $269 plan', winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'What is the main difference between WyberAi and Softr?',
    a: 'Softr generates a hosted app that lives on Softr\'s platform — you configure it, they run it, and if you leave you rebuild from scratch. WyberAi generates real React + Supabase code that you own: export it to GitHub, deploy it anywhere, hire a developer to extend it. One is renting; the other is owning.',
  },
  {
    q: 'When is Softr the better choice?',
    a: 'Honestly: if you need an internal tool or client portal on top of Airtable or Google Sheets, with visual permission rules and workflow automations, and you don\'t care about owning code — Softr is mature at exactly that. WyberAi is built for founders shipping a real product to real users, on web and mobile, with code they own.',
  },
  {
    q: 'How do the prices compare?',
    a: 'WyberAi starts at $29/month (India: ₹499/month with UPI). Softr\'s Basic plan is $49/month, and the Business plan most teams need is $269/month with 100 AI credits. For a solo founder, WyberAi is roughly a tenth of the cost of running Softr at the tier where its AI features live.',
  },
  {
    q: 'Can Softr build mobile apps?',
    a: 'Softr offers a PWA wrapper (your web app installed to a home screen), not native mobile apps. WyberAi generates real React Native + Expo apps from the same prompt as your web app — previewable on your phone and submittable to the App Store and Google Play.',
  },
  {
    q: 'Who checks the security of what I ship?',
    a: 'On Softr, the platform manages security — you trust their infrastructure and their permission system. On WyberAi, your app has its own database, and WyberAi runs a live RLS trust scan against it using the public anon key — the same view an attacker gets — and blocks publishing if it finds critical data leaks. In 2026, with researchers finding thousands of AI-built apps leaking data, "we actually probe your live database" is not a checkbox feature.',
  },
  {
    q: 'Can I migrate from Softr to WyberAi?',
    a: 'There\'s no code to export from Softr, so migration means describing your app to WyberAi and rebuilding — most apps generate in minutes, and your data can move via CSV export from Airtable/Sheets into Supabase. The upside: after migrating, you own the result.',
  },
]

export default async function VsSoftr() {
  const securityStats = await getScanStats()
  return (
    <VsPageTemplate
      slug="softr"
      competitorName="Softr"
      competitorUrl="https://softr.io"
      tagline="Softr is a mature no-code platform for internal tools and client portals. WyberAi generates real React code you own — web + mobile from one prompt — with a live security scan on every publish."
      blurb="Honest comparison of WyberAi vs Softr: ownership, pricing, mobile output, security model, and when each is the right choice. Verified July 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Softr apps live on Softr's platform — there is no code to export."
      competitorKey="softr"
      securityStats={securityStats}
    />
  )
}

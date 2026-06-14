import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'

export const metadata: Metadata = {
  title: 'Wyber AI vs v0 by Vercel (2026) — Full-App Builder vs UI Generator',
  description: 'v0 generates UI components. Wyber AI generates full-stack apps — plus mobile apps, AI agents, and workflows. Honest comparison verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/v0' },
  openGraph: { title: 'Wyber AI vs v0 by Vercel (2026)', description: 'Full-stack app builder vs UI component generator. Verified June 2026.', url: 'https://wyberai.com/vs/v0' },
}

const ROWS = [
  { feature: 'Primary output',           wyber: 'Full-stack web app',     other: 'UI components / pages', winner: 'wyber' as const },
  { feature: 'Base Pro price',           wyber: '$18.99/mo',              other: '$20/mo',                winner: 'wyber' as const },
  { feature: 'Complete app in one gen',  wyber: '✓',                      other: '✗ Requires assembly',   winner: 'wyber' as const },
  { feature: 'Database provisioning',    wyber: '✓ Auto (Supabase)',       other: '✗',                     winner: 'wyber' as const },
  { feature: 'Authentication',           wyber: '✓ Built-in',             other: '✗ Manual integration',  winner: 'wyber' as const },
  { feature: 'Mobile app builder',       wyber: '✓ React Native',         other: '✗',                     winner: 'wyber' as const },
  { feature: 'AI agent builder',         wyber: '✓ Built-in',             other: '✗',                     winner: 'wyber' as const },
  { feature: 'Workflow automation',      wyber: '✓ Built-in',             other: '✗',                     winner: 'wyber' as const },
  { feature: 'One-click deploy',         wyber: '✓ Vercel',               other: '✓ Vercel',              winner: 'tie'   as const },
  { feature: 'GitHub sync',             wyber: '✓',                       other: '✓',                     winner: 'tie'   as const },
  { feature: 'Design system quality',    wyber: 'Good',                   other: '✓ Excellent',           winner: 'other' as const },
  { feature: 'Figma import',             wyber: 'Coming soon',            other: '✓',                     winner: 'other' as const },
  { feature: 'Prebuilt app library',     wyber: '118 at 0 cost',         other: 'Component library',     winner: 'wyber' as const },
  { feature: 'Non-technical users',      wyber: '✓ Guided',               other: 'Developer-focused',     winner: 'wyber' as const },
  { feature: 'Free tier',                wyber: '50 credits/month',       other: 'Limited free',          winner: 'tie'   as const },
  { feature: 'India/APAC pricing',       wyber: '✓ INR soon',             other: 'USD only',              winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'What is the main difference between Wyber AI and v0?',
    a: 'v0 by Vercel is a UI component and page generator — it produces frontend code you integrate into an existing project. Wyber AI generates a complete, runnable full-stack application including routing, state, data, and deployment, all in one generation.',
  },
  {
    q: 'Does v0 build mobile apps?',
    a: 'No. v0 generates web UI components using Next.js and Tailwind. Wyber AI also builds full React Native + Expo mobile apps that run on iOS and Android.',
  },
  {
    q: 'Which is better for shipping fast without coding?',
    a: 'Wyber AI. v0 is designed for developers who know how to stitch components into a project. Wyber AI outputs a working app with no assembly required — ideal for non-technical founders.',
  },
  {
    q: 'Can Wyber AI match v0\'s design quality?',
    a: 'v0\'s design output is excellent, particularly for Shadcn/Tailwind components. Wyber AI uses a custom dark-mode design system optimized for dashboards and SaaS UIs. For pixel-perfect component libraries, v0 still has an edge.',
  },
  {
    q: 'Does Wyber AI have AI agents? v0 doesn\'t.',
    a: 'Yes. Wyber AI includes a built-in AI agent builder and workflow automation canvas. v0 does not offer agents or automation.',
  },
]

export default function VsV0() {
  return (
    <VsPageTemplate
      slug="v0"
      competitorName="v0 by Vercel"
      competitorUrl="https://v0.dev"
      tagline="v0 by Vercel generates polished UI components. Wyber AI generates complete full-stack applications — and adds mobile, agents, and workflows v0 doesn't cover."
      blurb="Honest comparison of Wyber AI vs v0 by Vercel: full-stack app builder vs UI generator. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="v0 generates frontend UI components only — no backend, no mobile, no agents."
      competitorKey="v0"
    />
  )
}

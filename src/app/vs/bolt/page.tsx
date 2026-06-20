import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'

export const metadata: Metadata = {
  title: 'WyberAi vs Bolt.new (2026) — Honest Comparison',
  description: 'WyberAi vs Bolt.new: fixed-credit pricing vs Bolt\'s token model, plus mobile apps, AI agents, and workflows Bolt doesn\'t offer. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/bolt' },
  openGraph: { title: 'WyberAi vs Bolt.new (2026)', description: 'Fixed credits, six products. Verified June 2026.', url: 'https://wyberai.com/vs/bolt' },
}

const ROWS = [
  { feature: 'Starter price',           wyber: '$99/mo (Builder)',            other: '$25/mo',            winner: 'other' as const },
  { feature: 'Starter credits/mo',      wyber: '300',               other: '~250 tokens equiv', winner: 'wyber' as const },
  { feature: 'Free tier',               wyber: '50 credits/month',  other: '1M tokens/mo',      winner: 'tie'   as const },
  { feature: 'Usage model',             wyber: 'Fixed credits',     other: 'Tokens (per char)', winner: 'wyber' as const },
  { feature: 'Unused credits rollover', wyber: '✓ Always',          other: '✓ Up to 2 months',  winner: 'wyber' as const },
  { feature: 'Daily bonus',             wyber: '8 credits/day',     other: 'None',              winner: 'wyber' as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native',    other: '✗ Web only',        winner: 'wyber' as const },
  { feature: 'AI agent builder',        wyber: '✓ Built-in',        other: '✗',                 winner: 'wyber' as const },
  { feature: 'Workflow automation',     wyber: '✓ Built-in',        other: '✗',                 winner: 'wyber' as const },
  { feature: 'Prebuilt app library',    wyber: '500+ at 0 cost',    other: 'None',              winner: 'wyber' as const },
  { feature: 'Credit estimate upfront', wyber: '✓',                 other: '✗',                 winner: 'wyber' as const },
  { feature: 'Visual click-to-edit',    wyber: '✓',                 other: 'Limited',           winner: 'wyber' as const },
  { feature: 'Supabase integration',    wyber: '✓ Auto',            other: '✓ Manual config',   winner: 'tie'   as const },
  { feature: 'GitHub sync',             wyber: '✓',                 other: '✓',                 winner: 'tie'   as const },
  { feature: 'Vercel deployment',       wyber: '✓',                 other: '✓',                 winner: 'tie'   as const },
  { feature: 'Non-technical users',     wyber: '✓ Guided',          other: 'Developer-focused', winner: 'wyber' as const },
  { feature: 'Team collaboration',      wyber: '✓ Built-in',       other: '✓ Teams plan',      winner: 'other' as const },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',        other: 'USD only',          winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'How does WyberAi pricing compare to Bolt.new?',
    a: 'WyberAi Builder is $99/month for 300 fixed credits — you always know the cost before generating. Bolt uses a token-based model ($25/month) where cost depends on prompt length, making it harder to predict spend. Wyber also covers 6 products vs Bolt\'s web-only focus.',
  },
  {
    q: 'Does Bolt.new have a mobile app builder?',
    a: 'No. Bolt.new generates React web apps only. WyberAi also generates full React Native + Expo mobile apps that run on iOS and Android — all from the same account.',
  },
  {
    q: 'Can WyberAi build AI agents? Bolt can\'t.',
    a: 'WyberAi includes a dedicated AI agent builder with 250+ tool integrations (Gmail, Slack, HubSpot, GitHub, and more), cron schedules, and visual canvas editing. Bolt does not offer an agent builder.',
  },
  {
    q: 'Is Bolt.new better for developers?',
    a: 'Bolt.new is more developer-oriented — it has a full in-browser IDE. If you\'re a developer comfortable with code, Bolt\'s flexibility may appeal. WyberAi is optimized for non-technical builders who want to describe and ship, not debug.',
  },
  {
    q: 'Can I import my Bolt project into WyberAi?',
    a: 'Yes. Bolt exports standard React + Vite code. You can paste or upload those files into a Wyber project and continue iterating from there.',
  },
]

export default function VsBolt() {
  return (
    <VsPageTemplate
      slug="bolt"
      competitorName="Bolt.new"
      competitorUrl="https://bolt.new"
      tagline="Bolt.new is a powerful web app builder for developers. WyberAi offers predictable fixed-credit pricing, a friendlier interface — and mobile apps, agents, and workflows Bolt doesn't cover."
      blurb="Honest comparison of WyberAi vs Bolt.new: pricing model, credits, features, and the six-product difference. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Bolt.new builds web apps only."
      competitorKey="bolt"
    />
  )
}

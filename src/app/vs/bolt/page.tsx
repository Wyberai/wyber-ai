import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'
import { localeAlternates } from '@/lib/i18n/hreflang'

export const metadata: Metadata = {
  title: 'WyberAi vs Bolt.new (2026) — Honest Comparison',
  description: 'WyberAi vs Bolt.new: fixed-credit pricing vs Bolt\'s token model, plus mobile apps, self-healing builds, and 27 integrations. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/bolt', languages: localeAlternates('/vs/bolt') },
  openGraph: { title: 'WyberAi vs Bolt.new (2026)', description: 'Fixed credits, web + mobile, self-healing builds. Verified June 2026.', url: 'https://wyberai.com/vs/bolt' },
}

const ROWS = [
  { feature: 'Starter price',           wyber: '$29/mo (Starter)',            other: '$25/mo',            winner: 'tie'   as const },
  { feature: 'Starter credits/mo',      wyber: '150',               other: '~250 tokens equiv', winner: 'other' as const },
  { feature: 'Free tier',               wyber: '50 credits/month',  other: '1M tokens/mo',      winner: 'tie'   as const },
  { feature: 'Usage model',             wyber: 'Fixed credits',     other: 'Tokens (per char)', winner: 'wyber' as const },
  { feature: 'Unused credits rollover', wyber: '✓ Always',          other: '✓ Up to 2 months',  winner: 'wyber' as const },
  { feature: 'Daily bonus',             wyber: '8 credits/day',     other: 'None',              winner: 'wyber' as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native',    other: '✗ Web only',        winner: 'wyber' as const },
  { feature: 'Self-healing builds',      wyber: '✓ Auto-fixes errors', other: '✗',               winner: 'wyber' as const },
  { feature: '27 integrations',         wyber: '✓ Built-in',        other: 'Limited',           winner: 'wyber' as const },
  { feature: 'Code generation',    wyber: 'Always fresh AI code',    other: 'None',              winner: 'wyber' as const },
  { feature: 'Credit estimate upfront', wyber: '✓',                 other: '✗',                 winner: 'wyber' as const },
  { feature: 'Visual click-to-edit',    wyber: '✓',                 other: 'Limited',           winner: 'wyber' as const },
  { feature: 'Supabase integration',    wyber: '✓ Auto',            other: '✓ Manual config',   winner: 'tie'   as const },
  { feature: 'GitHub sync',             wyber: '✓',                 other: '✓',                 winner: 'tie'   as const },
  { feature: 'Vercel deployment',       wyber: '✓',                 other: '✓',                 winner: 'tie'   as const },
  { feature: 'Non-technical users',     wyber: '✓ Guided',          other: 'Developer-focused', winner: 'wyber' as const },
  { feature: 'Team collaboration',      wyber: '✓ Built-in',       other: '✓ Teams plan',      winner: 'other' as const },
  { feature: 'Live database security scan', wyber: '✓ Probes RLS with anon key', other: '✗', winner: 'wyber' as const },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',        other: 'USD only',          winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'How does WyberAi pricing compare to Bolt.new?',
    a: 'WyberAi Starter is $29/month for 150 fixed credits — you always know the cost before generating. Bolt uses a token-based model ($25/month) where cost depends on prompt length, making it harder to predict spend. Wyber also builds mobile apps and includes self-healing builds.',
  },
  {
    q: 'Does Bolt.new have a mobile app builder?',
    a: 'No. Bolt.new generates React web apps only. WyberAi also generates full React Native + Expo mobile apps that run on iOS and Android — all from the same account.',
  },
  {
    q: 'Does WyberAi have self-healing builds?',
    a: 'Yes. When a build hits an error, WyberAi automatically detects and fixes it — no manual debugging. Bolt does not auto-fix build errors.',
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
      tagline="Bolt.new is a powerful web app builder for developers. WyberAi offers predictable fixed-credit pricing, a friendlier interface, mobile apps, self-healing builds, and 27 integrations Bolt doesn't have."
      blurb="Honest comparison of WyberAi vs Bolt.new: pricing model, credits, and features. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Bolt.new builds web apps only."
      competitorKey="bolt"
    />
  )
}

import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'

export const metadata: Metadata = {
  title: 'WyberAi vs Lovable (2026) — Honest Comparison',
  description: 'WyberAi vs Lovable: more credits, lower price, and four product pillars (web apps, mobile apps, AI agents, workflows) vs Lovable\'s web-only builder. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/lovable' },
  openGraph: { title: 'WyberAi vs Lovable (2026)', description: 'More credits, lower price, four pillars vs one. Verified June 2026.', url: 'https://wyberai.com/vs/lovable' },
}

const ROWS = [
  { feature: 'Base Builder price',       wyber: '$18.99/mo',      other: '$25/mo',          winner: 'wyber' as const },
  { feature: 'Annual price',            wyber: '$15.99/mo',      other: '~$21/mo',         winner: 'wyber' as const },
  { feature: 'Monthly credits (base)',  wyber: '250',            other: '100',             winner: 'wyber' as const },
  { feature: 'Daily bonus credits',     wyber: '10/day',         other: '5/day',           winner: 'wyber' as const },
  { feature: 'Est. total credits/mo',   wyber: '~400',           other: '~250',            winner: 'wyber' as const },
  { feature: 'Credit rollovers',        wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Top-up credits',          wyber: 'All plans',      other: 'Pro+ only',       winner: 'wyber' as const },
  { feature: 'Top-up expiry',           wyber: 'Never',          other: '12 months',       winner: 'wyber' as const },
  { feature: 'Credit estimate upfront', wyber: '✓',              other: '✗',               winner: 'wyber' as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native', other: '✗ Web only',      winner: 'wyber' as const },
  { feature: 'AI agent builder',        wyber: '✓ Built-in',     other: '✗',               winner: 'wyber' as const },
  { feature: 'Workflow automation',     wyber: '✓ Built-in',     other: '✗',               winner: 'wyber' as const },
  { feature: 'Prebuilt app library',    wyber: '118 at 0 cost', other: 'Templates',       winner: 'wyber' as const },
  { feature: 'Visual click-to-edit',    wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'GitHub sync',             wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Supabase integration',    wyber: '✓ Auto',         other: '✓ Auto',          winner: 'tie'   as const },
  { feature: 'Vercel deployment',       wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Custom subdomain',        wyber: '✓',              other: 'Pro+',            winner: 'wyber' as const },
  { feature: 'Real-time collaboration', wyber: 'Coming soon',    other: '✓',               winner: 'other' as const },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',     other: 'USD only',        winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'Is WyberAi cheaper than Lovable?',
    a: 'Yes. WyberAi Builder is $18.99/month vs Lovable\'s $25/month, and you get approximately 400 usable credits per month (250 base + 10 daily) vs Lovable\'s ~250. Top-ups on Wyber never expire; Lovable top-ups expire in 12 months.',
  },
  {
    q: 'Can WyberAi build mobile apps? Lovable can\'t.',
    a: 'Correct. Lovable generates React web apps only. WyberAi also generates full React Native + Expo mobile apps that run on iOS and Android. You can scan a QR code to preview on your phone instantly.',
  },
  {
    q: 'Does WyberAi have AI agents like Lovable?',
    a: 'WyberAi has a dedicated AI agent builder with 250+ integrations (Gmail, Slack, HubSpot, Airtable, and more), schedules, and conditional logic. Lovable does not offer an agent builder.',
  },
  {
    q: 'Which is better for non-technical founders?',
    a: 'Both tools are designed for non-technical users. WyberAi adds upfront credit estimates so you always know the cost before generating, and guided prompts help you describe what you want.',
  },
  {
    q: 'Can I switch from Lovable to WyberAi?',
    a: 'Yes. Export your code from Lovable (it\'s standard React + Vite), paste the files into a Wyber project, and continue iterating. Or start a new project — most apps generate in under 60 seconds.',
  },
]

export default function VsLovable() {
  return (
    <VsPageTemplate
      slug="lovable"
      competitorName="Lovable"
      competitorUrl="https://lovable.dev"
      tagline="Lovable is the leading AI web app builder. Wyber offers more credits at a lower price — plus mobile apps, AI agents, and workflows that Lovable doesn't have."
      blurb="Honest comparison of WyberAi vs Lovable: pricing, credits, features, and the four-pillar difference. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Lovable builds web apps only."
      competitorKey="lovable"
    />
  )
}

import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'

export const metadata: Metadata = {
  title: 'WyberAi vs Replit (2026) — AI App Builder vs Cloud IDE',
  description: 'WyberAi vs Replit: predictable credit pricing vs usage-based billing, non-technical vs developer focus, and six products Replit doesn\'t have. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/replit' },
  openGraph: { title: 'WyberAi vs Replit (2026)', description: 'AI app builder vs cloud IDE. Verified June 2026.', url: 'https://wyberai.com/vs/replit' },
}

const ROWS = [
  { feature: 'Primary use case',        wyber: 'AI app builder',           other: 'Cloud IDE + AI agent',    winner: 'tie'   as const },
  { feature: 'Starter price',           wyber: '$29/mo (Starter)',                   other: '$20/mo (Core)',           winner: 'tie'   as const },
  { feature: 'Cost predictability',     wyber: 'Fixed credits',            other: 'Usage-based overages',    winner: 'wyber' as const },
  { feature: 'Free tier',               wyber: '50 credits/month',         other: 'Free (limited)',          winner: 'tie'   as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native',           other: '✗',                       winner: 'wyber' as const },
  { feature: 'AI agent builder',        wyber: '✓ Built-in',               other: 'Replit Agent (IDE-based)',winner: 'wyber' as const },
  { feature: 'Workflow automation',     wyber: '✓ Built-in',               other: '✗',                       winner: 'wyber' as const },
  { feature: 'Code generation',    wyber: 'Always fresh AI code',           other: 'None',                    winner: 'wyber' as const },
  { feature: 'Credit estimate upfront', wyber: '✓',                        other: '✗ Effort-based billing',  winner: 'wyber' as const },
  { feature: 'Non-technical friendly',  wyber: '✓ Guided',                 other: 'Developer-focused',       winner: 'wyber' as const },
  { feature: 'Full cloud IDE',          wyber: '✗',                        other: '✓',                       winner: 'other' as const },
  { feature: 'Real-time collaboration', wyber: 'Coming soon',              other: '✓',                       winner: 'other' as const },
  { feature: 'GitHub sync',             wyber: '✓',                        other: '✓',                       winner: 'tie'   as const },
  { feature: 'Persistent backend',      wyber: 'Via Supabase',             other: '✓ Native',                winner: 'other' as const },
  { feature: '50+ language support',    wyber: 'Web/mobile apps (JS)',     other: '✓',                       winner: 'other' as const },
  { feature: 'Custom subdomain',        wyber: '✓',                        other: 'Core+',                   winner: 'wyber' as const },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',               other: 'USD only',                winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'What is the main difference between WyberAi and Replit?',
    a: 'Replit is a cloud IDE with AI assistance — great for developers who want to write and run code in any language. WyberAi is a no-code app builder that generates complete apps from plain English, optimized for non-technical founders who want to ship fast without coding.',
  },
  {
    q: 'Is WyberAi cheaper than Replit?',
    a: 'WyberAi Starter is $29/month for 150 credits vs Replit Core at $20/month. WyberAi includes mobile apps, 27 integrations, and fresh code generation that Replit doesn\'t offer. Top-ups never expire.',
  },
  {
    q: 'Does Replit have a mobile app builder?',
    a: 'No. Replit supports many programming languages but does not have a dedicated mobile app builder. WyberAi generates complete React Native + Expo apps that run on iOS and Android.',
  },
  {
    q: 'Which should a non-technical founder use?',
    a: 'WyberAi. Replit is powerful but assumes programming knowledge. WyberAi is designed for people who have never written code — you describe the app in plain English and it\'s built for you.',
  },
  {
    q: 'Can I use WyberAi if I also code?',
    a: 'Yes. WyberAi exports clean React code you can take anywhere — to GitHub, Vercel, or your own IDE. Many users prototype in Wyber and then refine the exported code themselves.',
  },
]

export default function VsReplit() {
  return (
    <VsPageTemplate
      slug="replit"
      competitorName="Replit"
      competitorUrl="https://replit.com"
      tagline="Replit is a powerful cloud IDE for developers. WyberAi is a no-code app builder for founders — with predictable pricing and six products Replit doesn't cover."
      blurb="Honest comparison of WyberAi vs Replit: AI app builder vs cloud IDE, pricing, and the six-product difference. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Replit is an IDE — it doesn't have dedicated mobile, agent, or workflow builders."
      competitorKey="replit"
    />
  )
}

import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'
import { getScanStats } from '@/lib/security-stats'
import { localeAlternates } from '@/lib/i18n/hreflang'

export const metadata: Metadata = {
  title: 'WyberAi vs Lovable (2026) — Honest Comparison',
  description: 'WyberAi vs Lovable: fresh code every build, web + mobile apps, self-healing builds, 27 integrations, and GitHub ownership. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/lovable', languages: localeAlternates('/vs/lovable') },
  openGraph: { title: 'WyberAi vs Lovable (2026)', description: 'Fresh code, web + mobile, self-healing builds. Verified June 2026.', url: 'https://wyberai.com/vs/lovable' },
}

const ROWS = [
  { feature: 'Starter price',           wyber: '$29/mo (Starter)',         other: '$25/mo',          winner: 'tie'   as const },
  { feature: 'Starter credits/mo',      wyber: '150',            other: '~250',            winner: 'other' as const },
  { feature: 'Credit rollovers',        wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Top-up credits',          wyber: 'All plans',      other: 'Pro+ only',       winner: 'wyber' as const },
  { feature: 'Top-up expiry',           wyber: 'Never',          other: '12 months',       winner: 'wyber' as const },
  { feature: 'Credit estimate upfront', wyber: '✓',              other: '✗',               winner: 'wyber' as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native', other: '✗ Web only',      winner: 'wyber' as const },
  { feature: '27 integrations',          wyber: '✓ Built-in',     other: 'Limited',         winner: 'wyber' as const },
  { feature: 'Code generation',    wyber: 'Always fresh AI code', other: 'Templates',       winner: 'wyber' as const },
  { feature: 'Visual click-to-edit',    wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'GitHub sync',             wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Supabase integration',    wyber: '✓ Auto',         other: '✓ Auto',          winner: 'tie'   as const },
  { feature: 'Vercel deployment',       wyber: '✓',              other: '✓',               winner: 'tie'   as const },
  { feature: 'Custom subdomain',        wyber: '✓',              other: 'Pro+',            winner: 'wyber' as const },
  { feature: 'Real-time collaboration', wyber: 'Roadmap',        other: '✓',               winner: 'other' as const },
  { feature: 'Live database security scan', wyber: '✓ Probes RLS with anon key', other: '✗', winner: 'wyber' as const },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',     other: 'USD only',        winner: 'wyber' as const },
]

const FAQS = [
  {
    q: 'How does WyberAi pricing compare to Lovable?',
    a: 'WyberAi Starter is $29/month for 150 credits vs Lovable\'s $25/month for ~250 credits. WyberAi includes mobile apps, 27 integrations, and fresh code generation that Lovable doesn\'t offer. Top-ups on Wyber never expire.',
  },
  {
    q: 'Can WyberAi build mobile apps? Lovable can\'t.',
    a: 'Correct. Lovable generates React web apps only. WyberAi also generates full React Native + Expo mobile apps that run on iOS and Android. You can scan a QR code to preview on your phone instantly.',
  },
  {
    q: 'Does WyberAi build mobile apps? Lovable doesn\'t.',
    a: 'WyberAi builds both web and mobile apps (React Native + Expo) from the same workspace. Lovable only builds web apps. WyberAi also includes self-healing builds that auto-fix errors, so your app ships clean every time.',
  },
  {
    q: 'Which is better for non-technical founders?',
    a: 'Both tools are designed for non-technical users. WyberAi adds upfront credit estimates so you always know the cost before generating, and guided prompts help you describe what you want.',
  },
  {
    q: 'Can I switch from Lovable to WyberAi?',
    a: 'Yes. Export your code from Lovable (it\'s standard React + Vite), paste the files into a Wyber project, and continue iterating. Or start a new project — most apps generate in minutes.',
  },
  {
    q: 'Does WyberAi check my database for security holes?',
    a: 'Yes. WyberAi runs a live RLS (Row Level Security) trust scan on every published app — it probes your actual Supabase database using the public anon key, the same way an attacker would, to confirm other users\' data is actually locked down. This catches misconfigured RLS policies before they ship, not after a breach. It\'s not a static linter; it\'s a real query against your live database.',
  },
]

export default async function VsLovable() {
  const securityStats = await getScanStats()
  return (
    <VsPageTemplate
      slug="lovable"
      competitorName="Lovable"
      competitorUrl="https://lovable.dev"
      tagline="Lovable is the leading AI web app builder. WyberAi generates fresh code (no templates), builds mobile apps, and includes 27 integrations that Lovable doesn't have."
      blurb="Honest comparison of WyberAi vs Lovable: pricing, credits, features, and what each builder can actually ship. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Lovable builds web apps only."
      competitorKey="lovable"
      securityStats={securityStats}
    />
  )
}

import type { Metadata } from 'next'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'

export const metadata: Metadata = {
  title: 'WyberAi vs Cursor (2026) — No-Code Builder vs AI Code Editor',
  description: 'WyberAi vs Cursor: no-code app generation vs AI-assisted coding. Wyber builds complete apps from plain English; Cursor makes writing code faster for developers. Verified June 2026.',
  alternates: { canonical: 'https://wyberai.com/vs/cursor' },
  openGraph: { title: 'WyberAi vs Cursor (2026)', description: 'No-code app builder vs AI code editor. Verified June 2026.', url: 'https://wyberai.com/vs/cursor' },
}

const ROWS = [
  { feature: 'Primary use case',        wyber: 'No-code app builder',      other: 'AI-assisted code editor', winner: 'tie'   as const },
  { feature: 'Target user',             wyber: 'Non-technical founders',   other: 'Software developers',     winner: 'tie'   as const },
  { feature: 'Base price',              wyber: '$29/mo (Starter)',          other: '$20/mo (Pro)',             winner: 'tie'   as const },
  { feature: 'Coding required',         wyber: 'None',                     other: '✓ Full IDE',               winner: 'wyber' as const },
  { feature: 'App generation speed',    wyber: '< 60 seconds',            other: 'Hours (code-assisted)',    winner: 'wyber' as const },
  { feature: 'Mobile app builder',      wyber: '✓ React Native',           other: '✗ (editor only)',          winner: 'wyber' as const },
  { feature: 'AI agent builder',        wyber: '✓ Built-in',               other: '✗',                        winner: 'wyber' as const },
  { feature: 'Workflow automation',     wyber: '✓ Built-in',               other: '✗',                        winner: 'wyber' as const },
  { feature: 'Prebuilt app library',    wyber: '500+ at 0 cost',           other: 'None',                     winner: 'wyber' as const },
  { feature: 'Live preview',            wyber: '✓ Real-time',              other: 'Run locally',              winner: 'wyber' as const },
  { feature: 'One-click deploy',        wyber: '✓ Vercel',                 other: '✗ Manual deploy',          winner: 'wyber' as const },
  { feature: 'Any language/framework',  wyber: 'React/React Native',      other: '✓ All languages',          winner: 'other' as const },
  { feature: 'Codebase refactoring',    wyber: 'Limited',                  other: '✓ Excellent',              winner: 'other' as const },
  { feature: 'Multi-file edits',        wyber: 'AI-managed',               other: '✓ Composer agent',         winner: 'other' as const },
  { feature: 'Free tier',               wyber: '50 credits/month',         other: '2-week trial',             winner: 'wyber' as const },
  { feature: 'Supabase integration',    wyber: '✓ Auto',                   other: 'Manual setup',             winner: 'wyber' as const },
  { feature: 'GitHub sync',             wyber: '✓',                        other: '✓',                        winner: 'tie'   as const },
]

const FAQS = [
  {
    q: 'What is the main difference between WyberAi and Cursor?',
    a: 'They solve different problems. Cursor is an AI-powered code editor — it makes experienced developers write code faster. WyberAi is a no-code app builder — it generates complete applications from plain English, no coding experience needed.',
  },
  {
    q: 'Can a non-technical person use Cursor?',
    a: 'Cursor assumes you understand code — it autocompletes, suggests, and refactors, but you need to know what you\'re asking for. WyberAi requires no coding knowledge: describe your app and it\'s built for you.',
  },
  {
    q: 'Which is faster for building an MVP?',
    a: 'WyberAi. A complete app generates in under 60 seconds. With Cursor, even with AI assistance, building a full-stack app takes hours and requires development knowledge to stitch everything together.',
  },
  {
    q: 'Does Cursor build mobile apps?',
    a: 'No. Cursor is an editor — it helps you write code in any language but doesn\'t generate or deploy apps on its own. WyberAi generates full React Native + Expo mobile apps with live device preview.',
  },
  {
    q: 'Can developers use both WyberAi and Cursor?',
    a: 'Yes — many do. Use WyberAi to generate the initial app fast, export the source code, then open it in Cursor for deeper customization. You get the speed of Wyber with the control of a full IDE.',
  },
  {
    q: 'Does WyberAi have AI agents? Cursor doesn\'t.',
    a: 'WyberAi includes a dedicated agent builder with 250+ integrations and workflow automation. Cursor is an editor only — it doesn\'t run autonomous agents or automations.',
  },
]

export default function VsCursor() {
  return (
    <VsPageTemplate
      slug="cursor"
      competitorName="Cursor"
      competitorUrl="https://cursor.com"
      tagline="Cursor is the AI code editor developers love. WyberAi is the no-code app builder non-technical founders need — complete apps in seconds, plus mobile, agents, and workflows."
      blurb="Honest comparison of WyberAi vs Cursor: no-code app generation vs AI-assisted coding. Who each tool is built for. Verified June 2026."
      rows={ROWS}
      faqs={FAQS}
      pillarNote="Cursor is a code editor — it has no app generation, mobile builder, agent builder, or workflow automation."
      competitorKey="cursor"
    />
  )
}

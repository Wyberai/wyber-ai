import { DocsPage, DocSection, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'AI Models — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="AI models"
      intro="Wyber uses Claude by Anthropic to power code generation, agent planning, and workflow logic. Higher-tier plans unlock access to more powerful model versions."
    >
      <DocSection title="Available models">
        <TodoBlock note="List which Claude model(s) are available on each plan tier. E.g. Free = Claude Haiku, Pro = Claude Sonnet, BYOK = any model including Opus 4.8. Fill in after confirming plan structure." />
      </DocSection>

      <DocSection title="How model choice affects output">
        <TodoBlock note="Explain the trade-off: faster/cheaper models for iteration, smarter models for complex generation. One paragraph." />
      </DocSection>

      <DocSection title="Using your own Anthropic key (BYOK)">
        <TodoBlock note="Brief summary — link to /docs/ai-agents/bring-your-own-keys for the full setup steps." />
      </DocSection>

      <Note>Model availability may change as Anthropic releases new versions. We update the available options automatically — you'll always have access to at least the model your plan specifies.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/account-billing/credits" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Credits explained</Link>
        <Link href="/docs" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>↑ Back to docs home</Link>
      </div>
    </DocsPage>
  )
}

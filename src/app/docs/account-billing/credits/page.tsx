import { DocsPage, DocSection, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Credits Explained — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="Credits explained"
      intro="Credits are the unit of usage in Wyber AI. Here's a detailed breakdown of what costs credits, how your balance works, and how to get more."
    >
      <DocSection title="Credit costs by action">
        <TodoBlock note="Table: Action → Credits consumed. Rows: Web app generation, Mobile app generation, Agent canvas generation, Agent run, Workflow run, Re-generation / iteration. Fill in exact costs after testing." />
      </DocSection>

      <DocSection title="Monthly credit allowance">
        <TodoBlock note="Describe how credits reset on each billing period, whether unused credits roll over, and the starting free credit amount." />
      </DocSection>

      <DocSection title="Buying additional credits">
        <TodoBlock note="Describe the top-up flow — is there a credit purchase UI separate from plan upgrades?" />
      </DocSection>

      <DocSection title="Checking your balance">
        <TodoBlock note="Describe where to see the current balance in the dashboard (top bar? settings page?) and whether there's a usage breakdown." />
      </DocSection>

      <Note>Credits are never deducted for failed builds. If generation errors, your credits are returned automatically.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/account-billing/plans" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Plans & pricing</Link>
        <Link href="/docs/account-billing/models" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: AI models →</Link>
      </div>
    </DocsPage>
  )
}

import { DocsPage, DocSection, TodoBlock } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Workflow Templates — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Workflows"
      title="Workflow templates"
      intro="Start faster with a pre-built workflow template. Templates cover common automation patterns — you clone one, connect your accounts, and it's ready to run."
    >
      <DocSection title="Available templates">
        <TodoBlock note="List the actual workflow templates available once the templates library is built. Include name, description, and what tools are required for each." />
      </DocSection>

      <DocSection title="Using a template">
        <TodoBlock note="Describe how to browse and clone a template — is there a template gallery? Does cloning auto-add nodes to a new canvas?" />
      </DocSection>

      <DocSection title="Customising a template">
        <TodoBlock note="Describe how to edit a cloned template — same canvas editor as building from scratch." />
      </DocSection>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/workflows/running" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Running & monitoring</Link>
        <Link href="/docs/account-billing/plans" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Plans & pricing →</Link>
      </div>
    </DocsPage>
  )
}

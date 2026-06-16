import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
          Templates are organized by use case. Common examples include:
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
          <li><strong>Daily email digest</strong> — summarizes inbox highlights with Claude every morning</li>
          <li><strong>Support ticket triage</strong> — classifies incoming support emails and routes urgent ones to Slack</li>
          <li><strong>Social media scheduler</strong> — generates and posts content to multiple channels on a schedule</li>
          <li><strong>CRM enrichment</strong> — enriches new leads with company data and notes in HubSpot</li>
          <li><strong>Weekly report</strong> — pulls data from Airtable and emails a formatted summary</li>
        </ul>
        <Note>The template library grows over time. Check the Workflows section in the dashboard for the latest list.</Note>
      </DocSection>

      <DocSection title="Using a template">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          In the Workflows section, click <strong>Templates</strong>. Browse the gallery and click <strong>Use this template</strong> on any card. Wyber clones the template into your account as a new workflow, pre-configured with the node structure. You just need to connect your tools and enable it.
        </p>
      </DocSection>

      <DocSection title="Customising a template">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          After cloning, a template is a fully editable workflow canvas. Change node prompts, add or remove nodes, swap the trigger type, or adjust the schedule — all the same as building from scratch.
        </p>
      </DocSection>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/workflows/running" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Running & monitoring</Link>
        <Link href="/docs/account-billing/plans" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Plans & pricing →</Link>
      </div>
    </DocsPage>
  )
}

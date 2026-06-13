import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Building a Workflow — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Workflows"
      title="Building a workflow"
      intro="Workflows are visual automations — a sequence of triggers, AI steps, and actions that run on a schedule or in response to an event."
      requirements={[
        { label: 'A Wyber AI account' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the workflow builder end-to-end." />
        <Steps>
          <Step n={1} title="Open the Workflow builder">
            <TodoBlock note="Describe navigation to the workflow builder from the dashboard." />
            <ScreenshotPlaceholder label="Workflow builder entry point" />
          </Step>
          <Step n={2} title="Add a trigger">
            <TodoBlock note="Describe available trigger types — schedule (cron), webhook, manual. How to configure each." />
            <ScreenshotPlaceholder label="Trigger node options" />
          </Step>
          <Step n={3} title="Add steps">
            <TodoBlock note="Describe adding AI step nodes (prompt → Claude) and action nodes (send email, post to Slack, etc.). Node library panel." />
            <ScreenshotPlaceholder label="Adding step nodes" />
          </Step>
          <Step n={4} title="Connect the nodes">
            <TodoBlock note="Describe drawing edges between nodes to define execution order. Any conditional branching?" />
            <ScreenshotPlaceholder label="Connecting nodes" />
          </Step>
          <Step n={5} title="Save the workflow">
            <TodoBlock note="Describe the Save button and whether the workflow is immediately active or needs to be enabled." />
          </Step>
        </Steps>
      </DocSection>

      <Note>Workflows are distinct from AI Agents: agents run interactively toward a goal, workflows execute a fixed sequence automatically.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/ai-agents/bring-your-own-keys" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Bring your own keys</Link>
        <Link href="/docs/workflows/running" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Running & monitoring →</Link>
      </div>
    </DocsPage>
  )
}

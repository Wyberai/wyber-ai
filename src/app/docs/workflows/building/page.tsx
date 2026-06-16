import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <Steps>
          <Step n={1} title="Open the Workflow builder">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard sidebar, click <strong>Workflows</strong>, then <strong>New workflow</strong>. You'll land on a blank canvas.
            </p>
            <ScreenshotPlaceholder label="Workflow builder entry point" />
          </Step>
          <Step n={2} title="Add a trigger">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Every workflow starts with a trigger node. Available trigger types:
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
              <li><strong>Schedule</strong> — runs on a cron schedule (e.g. every day at 9 am)</li>
              <li><strong>Webhook</strong> — runs when an HTTP POST arrives at a generated URL</li>
              <li><strong>Manual</strong> — runs only when you click Run</li>
            </ul>
            <ScreenshotPlaceholder label="Trigger node options" />
          </Step>
          <Step n={3} title="Add steps">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click <strong>+</strong> on the canvas or drag from the left node palette to add steps. Step types include AI steps (prompt → Claude reasoning), data transforms, and action nodes (send email, post to Slack, create a record, call a webhook).
            </p>
            <ScreenshotPlaceholder label="Adding step nodes" />
          </Step>
          <Step n={4} title="Connect the nodes">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Drag from the output handle of one node to the input handle of the next to define execution order. Nodes execute left-to-right, top-to-bottom.
            </p>
            <ScreenshotPlaceholder label="Connecting nodes" />
          </Step>
          <Step n={5} title="Save the workflow">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click <strong>Save</strong> in the top bar. The workflow is saved in draft state — it won't run automatically until you enable it.
            </p>
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

import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Running an Agent — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Running an agent"
      intro="Once your canvas is built and tools are connected, you can run the agent with a single click and watch it execute each step in real time."
      requirements={[
        { label: 'A built agent canvas' },
        { label: 'All required tools connected via OAuth' },
      ]}
    >
      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Open your agent canvas">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard sidebar, click <strong>Agents</strong> and select the agent you want to run. The canvas opens.
            </p>
          </Step>
          <Step n={2} title="Click Run">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click the <strong>Run</strong> button in the top bar of the canvas. If your agent has an input node (e.g. a start prompt), you'll be asked to fill it in before execution begins.
            </p>
            <ScreenshotPlaceholder label="Run button on canvas" />
          </Step>
          <Step n={3} title="Watch the execution">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Each node lights up as it executes. An execution log streams in the bottom panel, showing each step's inputs and outputs in real time. The overall progress bar at the top shows how many steps have completed.
            </p>
            <ScreenshotPlaceholder label="Agent executing — nodes active" />
          </Step>
          <Step n={4} title="Review the output">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              When the agent finishes, the final output is shown in the result panel on the right. If an action node sent data to an external service (created a GitHub issue, sent a Slack message), you'll see a confirmation link there.
            </p>
            <ScreenshotPlaceholder label="Agent output / result" />
          </Step>
        </Steps>
      </DocSection>

      <Note>If a node fails, execution stops at that step and the error is shown on the node. Fix the issue (re-connect the tool, adjust the prompt) and re-run.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/ai-agents/connecting-tools" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Connecting tools</Link>
        <Link href="/docs/ai-agents/bring-your-own-keys" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Bring your own keys →</Link>
      </div>
    </DocsPage>
  )
}

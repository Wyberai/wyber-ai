import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
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
        <TodoBlock note="Fill in the exact steps after testing the agent run flow end-to-end (POST /api/canvas/run)." />
        <Steps>
          <Step n={1} title="Open your agent canvas">
            <TodoBlock note="Describe how to navigate to an existing canvas from the dashboard." />
          </Step>
          <Step n={2} title="Click Run">
            <TodoBlock note="Describe the Run button — where it is, whether it shows a confirmation, what input (if any) is required." />
            <ScreenshotPlaceholder label="Run button on canvas" />
          </Step>
          <Step n={3} title="Watch the execution">
            <TodoBlock note="Describe how the canvas visualises execution — nodes lighting up, progress indicator, log stream." />
            <ScreenshotPlaceholder label="Agent executing — nodes active" />
          </Step>
          <Step n={4} title="Review the output">
            <TodoBlock note="Describe where the final output appears — result panel, log, or external service (e.g. a GitHub issue was created)." />
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

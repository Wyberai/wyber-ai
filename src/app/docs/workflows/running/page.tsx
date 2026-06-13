import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Running & Monitoring — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Workflows"
      title="Running & monitoring"
      intro="Enable your workflow to let it run automatically, or trigger a manual test run at any time. The run log shows every execution with inputs, outputs, and errors."
    >
      <DocSection title="Enabling a workflow">
        <TodoBlock note="Describe the enable/disable toggle — where it is, what 'enabled' means (active on schedule/trigger)." />
        <ScreenshotPlaceholder label="Workflow enable toggle" />
      </DocSection>

      <DocSection title="Manual test run">
        <Steps>
          <Step n={1} title="Click Run now">
            <TodoBlock note="Describe the 'Run now' / 'Test' button location and any input it requires." />
            <ScreenshotPlaceholder label="Run now button" />
          </Step>
          <Step n={2} title="Watch the execution">
            <TodoBlock note="Describe the live execution view — nodes lighting up, step logs, duration." />
            <ScreenshotPlaceholder label="Workflow executing" />
          </Step>
          <Step n={3} title="Review the result">
            <TodoBlock note="Describe the output panel and where to see the full run log." />
            <ScreenshotPlaceholder label="Run result / log" />
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Reading run history">
        <TodoBlock note="Describe the run history table — columns (time, status, duration), how to click into a specific run, how to see step-level logs." />
        <ScreenshotPlaceholder label="Run history table" />
      </DocSection>

      <Note>Failed runs are highlighted in red. Click into a failed run to see which step errored and why.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/workflows/building" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Building a workflow</Link>
        <Link href="/docs/workflows/templates" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Workflow templates →</Link>
      </div>
    </DocsPage>
  )
}

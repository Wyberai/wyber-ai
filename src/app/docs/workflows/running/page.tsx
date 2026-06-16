import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          In the workflow editor top bar, toggle the <strong>Enable</strong> switch. When enabled, the workflow runs on its configured trigger — on schedule, on webhook, or manually. Toggle it off to pause without deleting.
        </p>
        <ScreenshotPlaceholder label="Workflow enable toggle" />
      </DocSection>

      <DocSection title="Manual test run">
        <Steps>
          <Step n={1} title="Click Run now">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click <strong>Run now</strong> in the top bar to trigger an immediate test run regardless of the schedule.
            </p>
            <ScreenshotPlaceholder label="Run now button" />
          </Step>
          <Step n={2} title="Watch the execution">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Each node lights up as it executes. The bottom log panel streams step-level output — inputs, outputs, and duration for each node.
            </p>
            <ScreenshotPlaceholder label="Workflow executing" />
          </Step>
          <Step n={3} title="Review the result">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The final output is shown in the result panel on the right. The run is also saved to the run history so you can come back to it later.
            </p>
            <ScreenshotPlaceholder label="Run result / log" />
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Reading run history">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Click the <strong>History</strong> tab to see all past runs. Each row shows the start time, status (Success / Failed), and duration. Click any row to see the full step-level log for that run.
        </p>
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

import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Building AI Agents — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Building in plain English"
      intro="Describe what you want your agent to do and Wyber builds a visual canvas of nodes and edges — no code, no prompt engineering, just a description of the goal."
      requirements={[
        { label: 'A Wyber AI account' },
        { label: '1 credit', note: 'per canvas generation' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the agent canvas generation flow end-to-end." />
        <Steps>
          <Step n={1} title="Open the Agent builder">
            <TodoBlock note="Describe how to get to the agent canvas from the dashboard — which button, which nav item." />
            <ScreenshotPlaceholder label="Agent builder entry point" />
          </Step>
          <Step n={2} title="Describe your agent">
            <TodoBlock note="Explain the plain-English prompt input for canvas generation. What context helps? Any examples?" />
            <ScreenshotPlaceholder label="Agent description input" />
          </Step>
          <Step n={3} title="Review the generated canvas">
            <TodoBlock note="Describe what the generated canvas looks like — nodes types visible, edges, default zoom (now set to 75%)." />
            <ScreenshotPlaceholder label="Generated agent canvas" />
          </Step>
          <Step n={4} title="Adjust nodes manually">
            <TodoBlock note="Describe how to click a node to edit it, add new nodes from the left palette, delete nodes." />
            <ScreenshotPlaceholder label="Node edit panel" />
          </Step>
          <Step n={5} title="Connect tools via OAuth">
            <TodoBlock note="Brief mention — link to the connecting-tools page for the full OAuth flow." />
          </Step>
        </Steps>
      </DocSection>

      <Note>The canvas uses ReactFlow under the hood. You can pan and zoom freely — use Ctrl+scroll or trackpad pinch to zoom.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/mobile-apps/exporting-to-expo" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Exporting to Expo</Link>
        <Link href="/docs/ai-agents/connecting-tools" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Connecting tools →</Link>
      </div>
    </DocsPage>
  )
}

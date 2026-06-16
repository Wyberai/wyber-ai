import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Connecting Tools (OAuth) — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Connecting tools (OAuth)"
      intro="Wyber uses Composio to connect your agent to 250+ external services — GitHub, Gmail, Slack, Notion, and more — via a standard OAuth flow. You authorize once, and the agent can act on your behalf."
      requirements={[
        { label: 'A WyberAi account' },
        { label: 'An account with the service you want to connect', note: 'e.g. GitHub, Google, Slack' },
      ]}
    >
      <DocSection title="Browsing available tools">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          In the agent canvas, the left panel shows a <strong>Browse Tools</strong> catalogue. Search by name or scroll by category. Click any toolkit to add it as a node on your canvas.
        </p>
        <ScreenshotPlaceholder label="Browse Tools catalogue" />
      </DocSection>

      <DocSection title="The OAuth connect flow">
        <Steps>
          <Step n={1} title="Add a tool node to your canvas">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click a toolkit in the Browse Tools panel to drop it onto the canvas as a node.
            </p>
            <ScreenshotPlaceholder label="Tool node on canvas" />
          </Step>
          <Step n={2} title="Click Connect">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The tool node shows a <strong>Connect</strong> button in its header. Click it to start the OAuth flow.
            </p>
            <ScreenshotPlaceholder label="Connect button on tool node" />
          </Step>
          <Step n={3} title="Authorize in the popup">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              A Composio-hosted OAuth popup opens. Sign in with the service account and grant the permissions shown. This is a standard OAuth screen — Wyber never sees your credentials.
            </p>
            <ScreenshotPlaceholder label="OAuth authorization popup" />
          </Step>
          <Step n={4} title="Connection confirmed">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The node turns green and shows "Connected". The tool is now available to all agents in your account — you only need to authorize once per service.
            </p>
            <ScreenshotPlaceholder label="Tool node — connected state" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Wyber never stores your third-party credentials. Tokens are managed by Composio and scoped to the actions your agent needs.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/ai-agents/building-in-plain-english" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Building in plain English</Link>
        <Link href="/docs/ai-agents/running-an-agent" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Running an agent →</Link>
      </div>
    </DocsPage>
  )
}

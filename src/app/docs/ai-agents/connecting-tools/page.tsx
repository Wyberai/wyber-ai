import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Connecting Tools (OAuth) — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Connecting tools (OAuth)"
      intro="Wyber uses Composio to connect your agent to 250+ external services — GitHub, Gmail, Slack, Notion, and more — via a standard OAuth flow. You authorize once, and the agent can act on your behalf."
      requirements={[
        { label: 'A Wyber AI account' },
        { label: 'An account with the service you want to connect', note: 'e.g. GitHub, Google, Slack' },
      ]}
    >
      <DocSection title="Browsing available tools">
        <TodoBlock note="Describe the Browse Tools panel in the agent canvas left palette — search, toolkit grid, how to add a tool node." />
        <ScreenshotPlaceholder label="Browse Tools catalogue" />
      </DocSection>

      <DocSection title="The OAuth connect flow">
        <Steps>
          <Step n={1} title="Add a tool node to your canvas">
            <TodoBlock note="Describe clicking a toolkit from the Browse Tools panel to add it as a node." />
            <ScreenshotPlaceholder label="Tool node on canvas" />
          </Step>
          <Step n={2} title="Click Connect">
            <TodoBlock note="Describe the Connect button on the tool node or in the node edit panel." />
            <ScreenshotPlaceholder label="Connect button on tool node" />
          </Step>
          <Step n={3} title="Authorize in the popup">
            <TodoBlock note="Describe the OAuth popup — Composio-hosted, standard permissions screen, what to click." />
            <ScreenshotPlaceholder label="OAuth authorization popup" />
          </Step>
          <Step n={4} title="Connection confirmed">
            <TodoBlock note="Describe the success state — node turns green, connection listed under /api/composio/connections." />
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

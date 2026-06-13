import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Bring Your Own Keys — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Bring your own keys"
      intro="By default Wyber uses its own API keys for Claude and Composio. Power users can provide their own keys to use higher rate limits, specific model versions, or their own Composio account."
    >
      <DocSection title="Supported keys">
        <TodoBlock note="List which keys can be brought in: Anthropic API key (for Claude model selection), Composio API key (for your own connected accounts). Any others?" />
      </DocSection>

      <DocSection title="Adding your Anthropic key">
        <Steps>
          <Step n={1} title="Get your Anthropic API key">
            <TodoBlock note="Point to console.anthropic.com. One sentence." />
          </Step>
          <Step n={2} title="Add it in Wyber settings">
            <TodoBlock note="Describe where in the Wyber UI to enter the key — Settings → AI Models? Agent settings panel?" />
            <ScreenshotPlaceholder label="API key settings" />
          </Step>
          <Step n={3} title="Select your model">
            <TodoBlock note="Describe the model selector — which Claude versions are available when using BYOK." />
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Adding your Composio key">
        <Steps>
          <Step n={1} title="Get your Composio API key">
            <TodoBlock note="Point to app.composio.dev. One sentence." />
          </Step>
          <Step n={2} title="Add it in Wyber settings">
            <TodoBlock note="Describe the input field location." />
            <ScreenshotPlaceholder label="Composio key input" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Your keys are stored encrypted and are never exposed in generated code or shared with other users.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/ai-agents/running-an-agent" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Running an agent</Link>
        <Link href="/docs/workflows/building" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Building a workflow →</Link>
      </div>
    </DocsPage>
  )
}

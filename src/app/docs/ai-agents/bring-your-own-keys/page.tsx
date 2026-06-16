import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
          <li><strong>Anthropic API key</strong> — use any Claude model (including Fable) at your own rate limits</li>
          <li><strong>Composio API key</strong> — use your own Composio account for tool connections</li>
        </ul>
      </DocSection>

      <DocSection title="Adding your Anthropic key">
        <Steps>
          <Step n={1} title="Get your Anthropic API key">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Go to <strong>console.anthropic.com</strong>, sign in, and create an API key under API Keys.
            </p>
          </Step>
          <Step n={2} title="Add it in Wyber settings">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In Wyber, go to <strong>Settings → AI Models</strong>. Paste your Anthropic API key into the input field and click Save. Your key is encrypted with AES-256-GCM before storage.
            </p>
            <ScreenshotPlaceholder label="API key settings" />
          </Step>
          <Step n={3} title="Select your model">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Once your key is saved, the model selector unlocks all Claude tiers — including Premium (Opus) and Fable. Select the model you want to use for new generations.
            </p>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Adding your Composio key">
        <Steps>
          <Step n={1} title="Get your Composio API key">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Go to <strong>app.composio.dev</strong>, sign in, and copy your API key from Settings.
            </p>
          </Step>
          <Step n={2} title="Add it in Wyber settings">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Go to <strong>Settings → Integrations</strong> and paste your Composio API key. Wyber will use your Composio account for all OAuth tool connections going forward.
            </p>
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

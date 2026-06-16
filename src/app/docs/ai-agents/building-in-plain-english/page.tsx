import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Building AI Agents — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="AI Agents"
      title="Building in plain English"
      intro="Describe what you want your agent to do and Wyber builds a visual canvas of nodes and edges — no code, no prompt engineering, just a description of the goal."
      requirements={[
        { label: 'A WyberAi account' },
        { label: '1 credit', note: 'per canvas generation' },
      ]}
    >
      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Open the Agent builder">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard sidebar, click <strong>Agents</strong>. Then click <strong>New agent</strong>. You'll be taken to the agent canvas editor.
            </p>
            <ScreenshotPlaceholder label="Agent builder entry point" />
          </Step>
          <Step n={2} title="Describe your agent">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Type a plain-English description of what the agent should do. Include the tools it needs and the goal. Example:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, margin: '8px 0' }}>
              Monitor my Gmail for support emails, classify them by urgency using Claude, and create a Linear ticket for urgent ones with a summary.
            </div>
            <ScreenshotPlaceholder label="Agent description input" />
          </Step>
          <Step n={3} title="Review the generated canvas">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Wyber generates a visual canvas with nodes (trigger, AI step, tool actions) connected by edges. The canvas opens at 75% zoom so you can see the full flow. Each node is labelled with its role.
            </p>
            <ScreenshotPlaceholder label="Generated agent canvas" />
          </Step>
          <Step n={4} title="Adjust nodes manually">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click any node to open its edit panel on the right — you can change the prompt, rename the node, or adjust settings. Add new nodes from the left palette. Delete a node by selecting it and pressing Backspace.
            </p>
            <ScreenshotPlaceholder label="Node edit panel" />
          </Step>
          <Step n={5} title="Connect tools via OAuth">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Tool nodes show a <strong>Connect</strong> button until you authorise the service. See <Link href="/docs/ai-agents/connecting-tools" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Connecting tools</Link> for the full OAuth flow.
            </p>
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

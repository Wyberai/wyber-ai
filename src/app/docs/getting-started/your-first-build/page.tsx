import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Your First Build — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Getting Started"
      title="Your first build"
      intro="From sign-up to a live, shareable web app — this walkthrough covers the exact steps."
      requirements={[
        { label: 'A WyberAi account', note: 'free, sign up at wyberai.com/signup' },
        { label: '30 credits', note: 'new accounts start with 50 credits (plus 3 daily)' },
      ]}
    >
      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Sign up or sign in">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Go to <strong>wyberai.com/signup</strong>. Sign up with Google or email — no credit card required. After signing in you'll land on the onboarding screen where you can tell us what you're building.
            </p>
            <ScreenshotPlaceholder label="Sign-in screen" />
          </Step>
          <Step n={2} title="Create a new project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard, click <strong>New project</strong>. Choose <strong>Web App</strong> as the project type. You'll be taken to the editor with an empty prompt input.
            </p>
            <ScreenshotPlaceholder label="New project chooser" />
          </Step>
          <Step n={3} title="Describe your app">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Type a plain-English description of what you want to build. Be specific about screens, data, and interactions. Example:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, margin: '8px 0' }}>
              Build a CRM dashboard with a contacts table, a deal pipeline board with drag-and-drop stages, and a sidebar nav. Use a dark theme with blue accents.
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              A credit estimate is shown before you generate — 30 credits for a standard web app build. Click <strong>Generate</strong> when you're ready.
            </p>
            <ScreenshotPlaceholder label="Prompt input + credit estimate" />
          </Step>
          <Step n={4} title="Watch it build">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Generation takes 15–60 seconds. You'll see the file tree fill in on the left and code stream on the right. The preview pane on the right shows a live render that updates as files are written.
            </p>
            <ScreenshotPlaceholder label="Generation in progress" />
          </Step>
          <Step n={5} title="Preview and iterate">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Once generation is complete, click any element in the preview to select it and describe a change — this uses <strong>click-to-edit</strong> mode. Or type a follow-up prompt in the chat panel to change a whole section. Each edit costs 2 credits and is non-destructive — you can always go back to the previous version.
            </p>
            <ScreenshotPlaceholder label="Preview pane + chat panel" />
          </Step>
          <Step n={6} title="Publish">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Click <strong>Publish</strong> in the top bar. Wyber deploys your app to Vercel and gives you a public URL (e.g. <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>yourapp.wyberai.app</code>). Publishing is free. The URL updates instantly every time you re-publish after iterating.
            </p>
            <ScreenshotPlaceholder label="Publish button + live URL" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Credits are only deducted on a successful generation. If the build errors, you are not charged.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/getting-started/what-is-wyber" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← What is WyberAi?</Link>
        <Link href="/docs/getting-started/how-credits-work" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: How credits work →</Link>
      </div>
    </DocsPage>
  )
}

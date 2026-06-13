import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Your First Build — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Getting Started"
      title="Your first build"
      intro="From sign-up to a live, shareable web app — this walkthrough covers the exact steps."
      requirements={[
        { label: 'A Wyber AI account', note: 'free, sign up at wyberai.com/signup' },
        { label: '1 credit', note: 'new accounts start with 50 free credits' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact UI flow after testing. Steps below are structural placeholders." />
        <Steps>
          <Step n={1} title="Sign up or sign in">
            <TodoBlock note="Describe the sign-up flow: Google OAuth only on production. What the user sees immediately after." />
            <ScreenshotPlaceholder label="Sign-in screen" />
          </Step>
          <Step n={2} title="Create a new project">
            <TodoBlock note="Describe how to start a new project from the dashboard. What prompt box looks like, what types are available." />
            <ScreenshotPlaceholder label="New project chooser" />
          </Step>
          <Step n={3} title="Describe your app">
            <TodoBlock note="Explain what makes a good prompt. Show the credit estimate bar if visible. Explain what happens when you hit Generate." />
            <ScreenshotPlaceholder label="Prompt input + credit estimate" />
          </Step>
          <Step n={4} title="Watch it build">
            <TodoBlock note="Describe the live streaming build — what the user sees during generation (file list, streaming code, preview loading)." />
            <ScreenshotPlaceholder label="Generation in progress" />
          </Step>
          <Step n={5} title="Preview and iterate">
            <TodoBlock note="Describe the preview panel, how to click-to-edit, how to send follow-up prompts." />
            <ScreenshotPlaceholder label="Preview pane + chat panel" />
          </Step>
          <Step n={6} title="Publish">
            <TodoBlock note="Describe the one-click Vercel deploy. Where the public URL appears." />
            <ScreenshotPlaceholder label="Publish button + live URL" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Credits are only deducted on a successful generation. If the build errors, you are not charged.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/getting-started/what-is-wyber" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← What is Wyber AI?</Link>
        <Link href="/docs/getting-started/how-credits-work" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: How credits work →</Link>
      </div>
    </DocsPage>
  )
}

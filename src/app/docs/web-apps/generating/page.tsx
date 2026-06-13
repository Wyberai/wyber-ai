import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Generating a Web App — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Web Apps"
      title="Generating a web app"
      intro="Describe the app you want in plain English and Wyber generates a full-stack React app — complete with UI, logic, and an optional Supabase backend."
      requirements={[
        { label: 'A Wyber AI account' },
        { label: '1 credit', note: 'per generation' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the web app generation flow end-to-end." />
        <Steps>
          <Step n={1} title="Open the dashboard and start a new project">
            <TodoBlock note="Describe where the 'New project' button is and how to select Web App as the type." />
            <ScreenshotPlaceholder label="New project — Web App selected" />
          </Step>
          <Step n={2} title="Write your prompt">
            <TodoBlock note="Explain what makes a good web app prompt. Any character limit? Does the UI show a credit estimate?" />
            <ScreenshotPlaceholder label="Prompt input" />
          </Step>
          <Step n={3} title="Generation runs">
            <TodoBlock note="Describe the live streaming view — file tree, streaming code, preview loading state." />
            <ScreenshotPlaceholder label="Generation in progress" />
          </Step>
          <Step n={4} title="Preview your app">
            <TodoBlock note="Describe the preview iframe, hot-reload, and how to interact with the live preview." />
            <ScreenshotPlaceholder label="Live preview pane" />
          </Step>
          <Step n={5} title="Iterate with follow-up prompts">
            <TodoBlock note="Explain how to send follow-up prompts to change specific parts of the app." />
            <ScreenshotPlaceholder label="Chat panel with follow-up prompt" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Every generation creates a snapshot you can return to. You won't lose your previous version when you iterate.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/getting-started/how-credits-work" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← How credits work</Link>
        <Link href="/docs/web-apps/supabase-backend" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Connecting Supabase →</Link>
      </div>
    </DocsPage>
  )
}

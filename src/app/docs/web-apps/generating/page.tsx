import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <Steps>
          <Step n={1} title="Open the dashboard and start a new project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard, click <strong>New project</strong> and select <strong>Web App</strong>. You'll land in the editor with an empty prompt input.
            </p>
            <ScreenshotPlaceholder label="New project — Web App selected" />
          </Step>
          <Step n={2} title="Write your prompt">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Describe the app in plain English. Include the screens, data fields, and style you want. A credit estimate of 1 credit is shown before you generate. Click <strong>Generate</strong> to start.
            </p>
            <ScreenshotPlaceholder label="Prompt input" />
          </Step>
          <Step n={3} title="Generation runs">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Generation takes 15–60 seconds. The file tree fills in on the left and code streams on the right. The preview pane updates live as each file is written.
            </p>
            <ScreenshotPlaceholder label="Generation in progress" />
          </Step>
          <Step n={4} title="Preview your app">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The right panel shows a live iframe preview of your app. Click elements directly to select them (click-to-edit mode), or use the chat panel to describe larger changes.
            </p>
            <ScreenshotPlaceholder label="Live preview pane" />
          </Step>
          <Step n={5} title="Iterate with follow-up prompts">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Type follow-up prompts in the chat panel to change specific parts of the app. Each iteration costs 1 credit and creates a new snapshot — you can always go back to any previous version.
            </p>
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

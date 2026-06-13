import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Publishing — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Web Apps"
      title="Publishing your web app"
      intro="One click publishes your app to a live public URL on Vercel. No deployment configuration required."
      requirements={[
        { label: 'A generated Wyber web app' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the one-click Vercel deploy flow." />
        <Steps>
          <Step n={1} title="Click Publish">
            <TodoBlock note="Describe where the Publish button is in the editor UI and what happens when clicked." />
            <ScreenshotPlaceholder label="Publish button location" />
          </Step>
          <Step n={2} title="Wait for deployment">
            <TodoBlock note="Describe the deployment progress UI — spinner, log output, estimated time." />
            <ScreenshotPlaceholder label="Deployment in progress" />
          </Step>
          <Step n={3} title="Your app is live">
            <TodoBlock note="Describe where the public URL appears, how to copy/share it, and what domain format it uses (e.g. wyberai.app/xyz)." />
            <ScreenshotPlaceholder label="Live URL confirmation" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Republishing after an iteration deploys the latest version instantly — same URL, no downtime.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/web-apps/supabase-backend" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Connecting Supabase</Link>
        <Link href="/docs/web-apps/custom-domains" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Custom domains →</Link>
      </div>
    </DocsPage>
  )
}

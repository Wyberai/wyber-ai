import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Connecting Supabase — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Web Apps"
      title="Connecting your Supabase backend"
      intro="Wyber-generated web apps can connect to a Supabase project for auth, a Postgres database, and file storage — without writing any backend code."
      requirements={[
        { label: 'A generated Wyber web app' },
        { label: 'A Supabase account', note: 'free tier is sufficient — supabase.com' },
        { label: 'Your Supabase project URL and anon key' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the Supabase connect flow end-to-end." />
        <Steps>
          <Step n={1} title="Create a Supabase project">
            <TodoBlock note="Describe minimal steps: go to supabase.com, create org, create project, wait for provisioning." />
            <ScreenshotPlaceholder label="Supabase new project screen" />
          </Step>
          <Step n={2} title="Copy your project credentials">
            <TodoBlock note="Describe where to find the Project URL and anon/public key in the Supabase dashboard (Settings → API)." />
            <ScreenshotPlaceholder label="Supabase API settings" />
          </Step>
          <Step n={3} title="Connect in Wyber">
            <TodoBlock note="Describe how to open the Supabase connect panel in the Wyber editor and paste credentials." />
            <ScreenshotPlaceholder label="Supabase connect panel in Wyber editor" />
          </Step>
          <Step n={4} title="Verify the connection">
            <TodoBlock note="Describe any confirmation UI — green status indicator, test query, or similar." />
            <ScreenshotPlaceholder label="Connected status" />
          </Step>
        </Steps>
      </DocSection>

      <Note>Supabase credentials are stored encrypted and are never included in generated code exports.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/web-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Generating a web app</Link>
        <Link href="/docs/web-apps/publishing" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Publishing →</Link>
      </div>
    </DocsPage>
  )
}

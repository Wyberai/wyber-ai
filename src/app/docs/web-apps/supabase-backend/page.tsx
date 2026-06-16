import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <Steps>
          <Step n={1} title="Create a Supabase project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Go to <strong>supabase.com</strong>, sign in, and create a new project. Choose a region close to your users and wait ~1 minute for provisioning.
            </p>
            <ScreenshotPlaceholder label="Supabase new project screen" />
          </Step>
          <Step n={2} title="Copy your project credentials">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the Supabase dashboard, go to <strong>Settings → API</strong>. Copy the <strong>Project URL</strong> and the <strong>anon/public key</strong>.
            </p>
            <ScreenshotPlaceholder label="Supabase API settings" />
          </Step>
          <Step n={3} title="Connect in Wyber">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the Wyber editor, click the <strong>Supabase</strong> button in the top bar (or Settings → Database). Paste your Project URL and anon key and click <strong>Connect</strong>.
            </p>
            <ScreenshotPlaceholder label="Supabase connect panel in Wyber editor" />
          </Step>
          <Step n={4} title="Verify the connection">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Wyber confirms the connection with a green status indicator. Your next generation will automatically use your Supabase project for database queries, auth, and storage.
            </p>
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

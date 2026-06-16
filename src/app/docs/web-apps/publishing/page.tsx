import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <Steps>
          <Step n={1} title="Click Publish">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the editor top bar, click the <strong>Publish</strong> button. Wyber sends the current version of your app to Vercel automatically.
            </p>
            <ScreenshotPlaceholder label="Publish button location" />
          </Step>
          <Step n={2} title="Wait for deployment">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Deployment typically takes 20–60 seconds. A spinner shows in the top bar. You can continue editing while it deploys.
            </p>
            <ScreenshotPlaceholder label="Deployment in progress" />
          </Step>
          <Step n={3} title="Your app is live">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Once deployed, a live URL appears in the top bar (e.g. <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>yourapp.wyberai.app</code>). Click to open it or copy it to share. Publishing is free — it doesn't cost credits.
            </p>
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

import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Custom Domains — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Web Apps"
      title="Custom domains"
      intro="Point your own domain at a published Wyber web app. You'll add a DNS record at your registrar and verify ownership in Wyber."
      requirements={[
        { label: 'A published Wyber web app' },
        { label: 'A domain you own', note: 'managed at any registrar (Namecheap, GoDaddy, Cloudflare, etc.)' },
        { label: 'Access to your DNS settings' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in exact steps after testing the custom domain flow end-to-end." />
        <Steps>
          <Step n={1} title="Open domain settings">
            <TodoBlock note="Describe where to find domain settings in the Wyber editor or project settings panel." />
            <ScreenshotPlaceholder label="Domain settings panel" />
          </Step>
          <Step n={2} title="Enter your domain">
            <TodoBlock note="Describe the input field and what format to enter (e.g. app.yourdomain.com vs yourdomain.com)." />
            <ScreenshotPlaceholder label="Enter domain name" />
          </Step>
          <Step n={3} title="Add the DNS record">
            <TodoBlock note="Describe the CNAME or A record values to add. Which registrar panels to walk through?" />
            <ScreenshotPlaceholder label="DNS record to add" />
          </Step>
          <Step n={4} title="Verify and activate">
            <TodoBlock note="Describe how long DNS propagation takes and how Wyber confirms the domain is live." />
            <ScreenshotPlaceholder label="Domain verified state" />
          </Step>
        </Steps>
      </DocSection>

      <Note>SSL is provisioned automatically once the domain is verified. No certificate management needed.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/web-apps/publishing" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Publishing</Link>
        <Link href="/docs/mobile-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Generating a mobile app →</Link>
      </div>
    </DocsPage>
  )
}

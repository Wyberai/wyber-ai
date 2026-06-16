import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        { label: 'Builder or Team plan', note: 'custom domains require a paid plan' },
        { label: 'A domain you own', note: 'managed at any registrar (Namecheap, GoDaddy, Cloudflare, etc.)' },
        { label: 'Access to your DNS settings' },
      ]}
    >
      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Open domain settings">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the editor, click the <strong>Settings</strong> tab (or go to <strong>Settings → Domains</strong>). Find the Custom Domain section.
            </p>
            <ScreenshotPlaceholder label="Domain settings panel" />
          </Step>
          <Step n={2} title="Enter your domain">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Type the domain or subdomain you want to use (e.g. <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>app.yourdomain.com</code>). Click <strong>Add domain</strong>.
            </p>
            <ScreenshotPlaceholder label="Enter domain name" />
          </Step>
          <Step n={3} title="Add the DNS record">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Wyber shows you a CNAME record to add at your registrar. Log into your domain registrar (Cloudflare, Namecheap, GoDaddy, etc.) and add the CNAME record exactly as shown.
            </p>
            <ScreenshotPlaceholder label="DNS record to add" />
          </Step>
          <Step n={4} title="Verify and activate">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              DNS propagation typically takes 1–10 minutes. Click <strong>Verify</strong> in Wyber. Once verified, your app is live at your custom domain with SSL provisioned automatically.
            </p>
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

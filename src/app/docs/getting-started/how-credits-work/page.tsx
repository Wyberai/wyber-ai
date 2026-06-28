import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'How Credits Work — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Getting Started"
      title="How credits work"
      intro="Credits are the unit of usage on WyberAi. Each generation spends credits; everything else — editing, previewing, navigating — is free."
    >
      <DocSection title="What costs credits">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credits</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Web/mobile app build', '10'],
              ['App edit', '3'],
              ['AI Agent run', '5'],
              ['AI Employee run', '5'],
              ['Workflow run', '2'],
              ['GTM campaign action', '3'],
              ['Lead enrichment', '1'],
              ['Image generation', '3'],
              ['Prebuilt gallery template', '0 — always free'],
              ['Preview, browse, navigate', '0 — always free'],
            ].map(([action, cost], i) => (
              <tr key={action} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.8)' }}>{action}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0EA5E9', fontWeight: 600 }}>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      <DocSection title="Free credits & plans">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Free accounts get <strong>50 credits on signup</strong>. No credit card required. Paid plans start at $29/month (Starter: 150 credits/month).
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
          Paid plans give you more monthly credits and a larger daily bonus. See the <Link href="/docs/account-billing/plans" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Plans & pricing</Link> page for a full comparison.
        </p>
      </DocSection>

      <DocSection title="When you are NOT charged">
        <Note>Credits are only deducted on a successful generation. If the build errors out, your credits are returned.</Note>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 12 }}>
          You are never charged for:
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
          <li>Browsing the dashboard or project list</li>
          <li>Opening the preview without generating</li>
          <li>Loading a prebuilt gallery template</li>
          <li>Failed or errored builds</li>
          <li>Cancelled generations (if cancelled before completion)</li>
        </ul>
      </DocSection>

      <DocSection title="Checking your balance">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Your credit balance is always visible in the dashboard sidebar. For a full breakdown of monthly credits, daily credits, and top-up credits, go to <strong>Settings → Billing</strong>. A credit estimate is shown in the generation UI before every build so you know exactly what you'll spend.
        </p>
      </DocSection>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/getting-started/your-first-build" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Your first build</Link>
        <Link href="/docs/web-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Generating a web app →</Link>
      </div>
    </DocsPage>
  )
}

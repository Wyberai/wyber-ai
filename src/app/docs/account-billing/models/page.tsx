import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'AI Models — Docs', description: "Wyber builds with WyberCode 1.0, our coding engine for app generation, agent planning and workflow logic. Higher-tier plans unlock the more powerful…" }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="AI models"
      intro="Wyber builds with WyberCode 1.0, our coding engine for app generation, agent planning and workflow logic. Higher-tier plans unlock the more powerful engine versions."
    >
      <DocSection title="Available models">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Model', 'Speed', 'Quality', 'Available on'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['WyberCode 1.0 Lite', 'Fastest', 'Good', 'All plans'],
              ['WyberCode 1.0', 'Fast', 'Great', 'All plans'],
              ['WyberCode 1.0 Max', 'Slower', 'Best', 'Starter and up'],
              ['WyberCode 1.0 Ultra', 'Slowest', 'Most powerful', 'Pro and up'],
            ].map(([model, speed, quality, plans], i) => (
              <tr key={model} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{model}</td>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)' }}>{speed}</td>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)' }}>{quality}</td>
                <td style={{ padding: '10px 12px', color: '#0EA5E9' }}>{plans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      <DocSection title="How model choice affects output">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          For most app builds, WyberCode 1.0 is the sweet spot: fast generation and excellent output quality. Use Lite for quick edits and small changes where speed matters more than detail. Max and Ultra are best for complex, multi-page apps.
        </p>
      </DocSection>

            <Note>WyberCode improves over time. We update the engine automatically, so you always have at least the version your plan specifies.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/account-billing/credits" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Credits explained</Link>
        <Link href="/docs" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>↑ Back to docs home</Link>
      </div>
    </DocsPage>
  )
}

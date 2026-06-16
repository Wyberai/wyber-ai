import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'AI Models — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="AI models"
      intro="Wyber uses Claude by Anthropic to power code generation, agent planning, and workflow logic. Higher-tier plans unlock access to more powerful model versions."
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
              ['Fast (Haiku)', 'Fastest', 'Good', 'All plans'],
              ['Standard (Sonnet)', 'Fast', 'Great', 'All plans'],
              ['Premium (Opus)', 'Slower', 'Best', 'Builder & Team'],
              ['Fable', 'Slowest', 'Most powerful', 'Team (BYOK)'],
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
          For most app builds, Standard (Sonnet) is the sweet spot — fast generation, excellent output quality, and 1 credit per message. Use Fast (Haiku) for quick edits and small changes where speed matters more than detail. Premium (Opus) is best for complex multi-screen apps with intricate logic, detailed UI, or large data models — it produces noticeably more complete output at the cost of longer generation time.
        </p>
      </DocSection>

      <DocSection title="Using your own Anthropic key (BYOK)">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          You can bring your own Anthropic API key to use any Claude model — including Fable — at your own rate limits. Your key is stored encrypted and never exposed in generated code. See <Link href="/docs/ai-agents/bring-your-own-keys" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Bring your own keys</Link> for setup steps.
        </p>
      </DocSection>

      <Note>Model availability may change as Anthropic releases new versions. We update the available options automatically — you'll always have access to at least the model your plan specifies.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/account-billing/credits" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Credits explained</Link>
        <Link href="/docs" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>↑ Back to docs home</Link>
      </div>
    </DocsPage>
  )
}

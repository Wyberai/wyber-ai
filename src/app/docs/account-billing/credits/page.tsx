import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Credits Explained — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="Credits explained"
      intro="Credits are the unit of usage in WyberAi. Here's a detailed breakdown of what costs credits, how your balance works, and how to get more."
    >
      <DocSection title="Credit costs by action">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credits</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Web app generation', '1'],
              ['Mobile app generation', '1'],
              ['Agent canvas generation', '1'],
              ['Agent run', '5'],
              ['Workflow / flow run', '3'],
              ['Prebuilt template (gallery)', '0 — always free'],
            ].map(([action, cost], i) => (
              <tr key={action} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.85)' }}>{action}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0EA5E9', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Editing, re-iterating on a generated app, and using the preview are all free. Credits are only consumed when you start a new generation or run an agent or workflow.
        </p>
      </DocSection>

      <DocSection title="Monthly credit allowance">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
          Each plan comes with a base monthly allowance that resets on your billing date, plus daily bonus credits that refill every 24 hours:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Plan', 'Monthly base', 'Daily bonus', 'Max per month'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Free', '15 on signup', '3/day', '~50'],
              ['Builder ($18.99/mo)', '250', '10/day', '~400'],
              ['Team ($37.99/mo)', '500', '20/day', '~800'],
            ].map(([plan, base, daily, max], i) => (
              <tr key={plan} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{plan}</td>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)' }}>{base}</td>
                <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)' }}>{daily}</td>
                <td style={{ padding: '10px 12px', color: '#0EA5E9', fontWeight: 600 }}>{max}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Unused credits roll over to the next month. Top-up credits never expire.
        </p>
      </DocSection>

      <DocSection title="Buying additional credits (top-ups)">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
          Top-up packs are available on all plans and never expire:
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { credits: '50 credits', price: '$9.99' },
            { credits: '150 credits', price: '$24.99' },
            { credits: '500 credits', price: '$69.99' },
          ].map(p => (
            <div key={p.credits} style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0EA5E9', marginBottom: 4 }}>{p.credits}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{p.price}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Purchase top-ups in Settings → Billing. They are added to your balance immediately and never expire.
        </p>
      </DocSection>

      <DocSection title="Checking your balance">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Your current credit balance is shown in the dashboard sidebar at all times. For a full breakdown — monthly credits, daily credits, and top-up credits — go to <strong>Settings → Billing</strong>. A credit estimate is also shown before every generation so there are never any surprises.
        </p>
      </DocSection>

      <Note>Credits are never deducted for failed builds. If generation errors, your credits are returned automatically.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/account-billing/plans" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Plans & pricing</Link>
        <Link href="/docs/account-billing/models" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: AI models →</Link>
      </div>
    </DocsPage>
  )
}

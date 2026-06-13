import { DocsPage, DocSection, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Plans & Pricing — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="Plans & pricing"
      intro="Wyber AI offers a free tier and paid plans. All plans give you access to all four product types — web apps, mobile apps, agents, and workflows."
    >
      <DocSection title="Plan comparison">
        <TodoBlock note="Insert a table or card grid comparing Free / Pro / (Team?) plans. Columns: price, credits/month, features unlocked, credit rollover policy. Fill in after pricing is confirmed." />
      </DocSection>

      <DocSection title="Upgrading your plan">
        <TodoBlock note="Describe the upgrade flow: Settings → Billing → Upgrade, Stripe checkout, confirmation email." />
      </DocSection>

      <DocSection title="Downgrading or cancelling">
        <TodoBlock note="Describe what happens to unused credits on downgrade, when the change takes effect, how to cancel." />
      </DocSection>

      <Note>You can always see your current plan and next renewal date in Settings → Billing.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/workflows/templates" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Workflow templates</Link>
        <Link href="/docs/account-billing/credits" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Credits explained →</Link>
      </div>
    </DocsPage>
  )
}

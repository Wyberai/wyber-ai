import { DocsPage, DocSection, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Plans & Pricing — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Account & Billing"
      title="Plans & pricing"
      intro="WyberAi offers a free tier and paid plans. All plans give you access to all five product types — web apps, mobile apps, agents, workflows, and AI employees."
    >
      <DocSection title="Plan comparison">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
          {[
            {
              name: 'Starter',
              price: '$49',
              sub: '/month',
              color: '#0EA5E9',
              credits: '500 credits/month',
              items: ['500 monthly credits', 'Up to 3 AI Employees', 'All 5 product types', 'Unlimited projects', 'Email support', 'Custom domains'],
            },
            {
              name: 'Growth',
              price: '$149',
              sub: '/month',
              color: '#8b5cf6',
              credits: '2,000 credits/month',
              items: ['2,000 monthly credits', 'Up to 10 AI Employees', 'Credit rollover', 'Everything in Starter', 'Priority support'],
            },
            {
              name: 'Scale',
              price: '$399',
              sub: '/month',
              color: '#10b981',
              credits: '6,000 credits/month',
              items: ['6,000 monthly credits', 'Unlimited AI Employees', 'Credit rollover', 'Everything in Growth', 'Dedicated support'],
            },
          ].map(plan => (
            <div key={plan.name} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${plan.color}40`, borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{plan.sub}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 12 }}>{plan.credits}</div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {plan.items.map(item => (
                  <li key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Top-up credits are available on all plans and never expire. Done-for-you builds: $99 consultation, $199 simple (24hrs), $399 medium (3 days), $799 complex (1 week).
        </p>
      </DocSection>

      <DocSection title="Upgrading your plan">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Go to <strong>Settings → Billing</strong> and click <strong>Upgrade</strong>. You'll be taken to the checkout page where you can choose monthly or annual billing. After payment, your new credits are available immediately. You'll receive a confirmation email with your receipt.
        </p>
      </DocSection>

      <DocSection title="Downgrading or cancelling">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          You can cancel or downgrade at any time in <strong>Settings → Billing</strong>. Your plan stays active until the end of the current billing period — you won't be charged again after that. Any unused monthly credits expire at period end; top-up credits never expire and remain in your balance.
        </p>
      </DocSection>

      <Note>You can always see your current plan and next renewal date in Settings → Billing.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/workflows/templates" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Workflow templates</Link>
        <Link href="/docs/account-billing/credits" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Credits explained →</Link>
      </div>
    </DocsPage>
  )
}

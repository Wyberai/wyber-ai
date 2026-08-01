import { useState } from 'react'
import { SectionHeading, PricingCard, Tabs, Reveal } from '../wyber-ui'

const PLANS = {
  monthly: [
    { name: 'Starter', price: '$0', description: 'For trying things out', features: ['1 project', 'Community support', 'Core features'] },
    { name: 'Pro', price: '$29', description: 'For growing teams', features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Team roles'], featured: true },
    { name: 'Enterprise', price: 'Custom', description: 'For large organizations', features: ['SSO & SAML', 'Dedicated support', 'Custom contracts', 'Uptime SLA'] },
  ],
  annual: [
    { name: 'Starter', price: '$0', description: 'For trying things out', features: ['1 project', 'Community support', 'Core features'] },
    { name: 'Pro', price: '$24', description: 'For growing teams, billed yearly', features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Team roles'], featured: true },
    { name: 'Enterprise', price: 'Custom', description: 'For large organizations', features: ['SSO & SAML', 'Dedicated support', 'Custom contracts', 'Uptime SLA'] },
  ],
}

export default function Pricing() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="min-h-screen bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing that scales with you"
          description="Start free. Upgrade when you need more — no surprises, cancel anytime."
        />

        <Reveal className="mb-10 flex justify-center">
          <Tabs
            tabs={[{ id: 'monthly', label: 'Monthly' }, { id: 'annual', label: 'Annual — save 20%' }]}
            active={period}
            onChange={id => setPeriod(id as 'monthly' | 'annual')}
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS[period].map(plan => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </div>
  )
}

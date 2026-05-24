'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever', highlight: false,
    credits: '50 credits/month',
    features: ['50 credits/month (Lovable: 30)', 'React, Vue, Vanilla, Next.js', 'Public projects only', 'GitHub sync', 'One-click deploy', 'Wyber badge on apps', 'Community support'],
    cta: 'Start free', href: '/signup', priceId: null,
  },
  {
    name: 'Pro', price: '$15', period: '/month', highlight: true,
    credits: '400 credits/month',
    features: ['400 credits/month (Lovable: 250 for $25)', 'Unused credits roll over', 'Private projects', 'Custom domain', 'Remove Wyber badge', 'Image → code (screenshot input)', 'Priority generation', 'Email support'],
    cta: 'Upgrade to Pro', href: null, priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE,
  },
  {
    name: 'Teams', price: '$25', period: '/month', highlight: false,
    credits: '1500 credits/month',
    features: ['1500 credits/month', 'Shared credit pool', 'Up to 20 collaborators', 'SSO login', 'AI training opt-out', 'Dedicated Slack support', 'Invoice billing'],
    cta: 'Upgrade to Teams', href: null, priceId: process.env.NEXT_PUBLIC_STRIPE_TEAMS_PRICE,
  },
];

const TOPUPS = [
  { credits: 100, price: '$4', priceId: 'price_topup_100' },
  { credits: 300, price: '$9', priceId: 'price_topup_300' },
  { credits: 1000, price: '$24', priceId: 'price_topup_1000' },
];

export default function PricingPage() {
  const router = useRouter();

  const handleUpgrade = async (priceId: string | null | undefined) => {
    if (!priceId) return;
    const res = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const { url, error } = await res.json();
    if (error === 'Unauthorized') { router.push('/login'); return; }
    if (url) window.location.href = url;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 48 }}>← Back</Link>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 14px' }}>Simple, honest pricing</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>
            More credits. Less money. No charge for AI mistakes.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 60 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '28px 24px', border: plan.highlight ? '2px solid var(--accent)' : '1px solid var(--border)', position: 'relative' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 14px', borderRadius: 10 }}>
                  Most popular
                </div>
              )}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 22 }}>{plan.credits}</p>

              {plan.href ? (
                <Link href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '10px 16px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
                  {plan.cta}
                </Link>
              ) : (
                <button onClick={() => handleUpgrade(plan.priceId)} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, background: plan.highlight ? 'var(--accent)' : 'var(--bg-elevated)', border: plan.highlight ? 'none' : '1px solid var(--border)', color: plan.highlight ? 'white' : 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24 }}>
                  {plan.cta}
                </button>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--green)', fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credit top-up packs */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 8 }}>Credit top-up packs</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
            One-time credit packs — no subscription needed. Credits never expire.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {TOPUPS.map(t => (
              <div key={t.credits} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 2 }}>{t.credits}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>credits</div>
                <button onClick={() => handleUpgrade(t.priceId)} style={{ width: '100%', padding: '9px 16px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {t.price}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 24 }}>FAQ</h2>
          {[
            ['Do unused credits roll over?', 'Yes — on paid plans, unused monthly credits roll over to the next billing cycle. Free plan credits reset monthly.'],
            ['Are there credits charged for errors?', 'No. If you use the "Fix Error" tab to repair an AI mistake, we don\'t deduct credits. Only successful new generations consume credits.'],
            ['Can I cancel anytime?', 'Yes. Cancel your subscription anytime — you keep your credits and projects until the end of the billing period.'],
            ['What frameworks are supported?', 'React + Vite, Vue 3, Vanilla JS/HTML/CSS, and Next.js. More coming soon.'],
            ['Can I export my code?', 'Always. Your code is yours. Export a ZIP or sync to GitHub at any time, even on the free plan.'],
          ].map(([q, a]) => (
            <div key={q} style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 40 }}>
          Cancel anytime. No lock-in. Your code, always.
        </p>
      </div>
    </div>
  );
}

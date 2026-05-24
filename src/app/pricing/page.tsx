'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

const PLANS = {
  monthly: [
    {
      id: 'free', tier: 'Free', price: '$0', per: 'forever',
      credits: '50 credits / month', note: '~50 full app generations',
      featured: false, cta: 'Start free →', href: '/signup',
      features: ['50 generations/month', 'Live preview on every build', 'GitHub sync', 'Export as ZIP anytime', 'Free AI error fixes', 'Public projects only'],
    },
    {
      id: 'starter', tier: 'Starter', price: '$15', per: 'per month',
      credits: '400 credits / month', note: 'Credits roll over monthly',
      featured: false, cta: 'Get Starter →', href: '/signup',
      features: ['Everything in Free', '400 generations/month', 'Private projects', 'Custom domain deploy', 'Remove Wyber branding', 'Priority generation speed'],
    },
    {
      id: 'pro', tier: 'Pro', price: '$39', per: 'per month',
      credits: '1,200 credits / month', note: '+5 bonus credits daily',
      featured: true, cta: 'Get Pro →', href: '/signup',
      features: ['Everything in Starter', '1,200 generations/month', 'Agent Mode included', 'Supabase auto-backend', 'Security scanner', 'Unlimited version history'],
    },
    {
      id: 'teams', tier: 'Teams', price: '$79', per: 'per seat / month',
      credits: '3,000 credits / seat', note: 'Shared credit pool',
      featured: false, cta: 'Get Teams →', href: '/signup',
      features: ['Everything in Pro', 'Shared team workspace', 'Multiplayer editing', 'SSO / SAML', 'Admin dashboard', 'Priority support'],
    },
  ],
  annual: [
    {
      id: 'free', tier: 'Free', price: '$0', per: 'forever',
      credits: '50 credits / month', note: '~50 full app generations',
      featured: false, cta: 'Start free →', href: '/signup',
      features: ['50 generations/month', 'Live preview on every build', 'GitHub sync', 'Export as ZIP anytime', 'Free AI error fixes', 'Public projects only'],
    },
    {
      id: 'starter', tier: 'Starter', price: '$11', per: 'per month, billed annually',
      credits: '400 credits / month', note: 'Credits roll over monthly',
      featured: false, cta: 'Get Starter →', href: '/signup',
      features: ['Everything in Free', '400 generations/month', 'Private projects', 'Custom domain deploy', 'Remove Wyber branding', 'Priority generation speed'],
    },
    {
      id: 'pro', tier: 'Pro', price: '$29', per: 'per month, billed annually',
      credits: '1,200 credits / month', note: '+5 bonus credits daily',
      featured: true, cta: 'Get Pro →', href: '/signup',
      features: ['Everything in Starter', '1,200 generations/month', 'Agent Mode included', 'Supabase auto-backend', 'Security scanner', 'Unlimited version history'],
    },
    {
      id: 'teams', tier: 'Teams', price: '$59', per: 'per seat / month, billed annually',
      credits: '3,000 credits / seat', note: 'Shared credit pool',
      featured: false, cta: 'Get Teams →', href: '/signup',
      features: ['Everything in Pro', 'Shared team workspace', 'Multiplayer editing', 'SSO / SAML', 'Admin dashboard', 'Priority support'],
    },
  ],
};

const FAQ = [
  { q: 'What is a credit?', a: 'One credit = one successful AI generation. If the AI makes a mistake and you ask it to fix it, that fix is always free. You only pay for generations that produce working code.' },
  { q: 'Do credits roll over?', a: 'Yes on Starter and above. Unused credits carry forward to the next month. Free plan credits reset monthly.' },
  { q: 'Can I change plans anytime?', a: 'Yes. Upgrade or downgrade at any time. Downgrades take effect at the next billing cycle.' },
  { q: 'Do I own the code?', a: 'Absolutely. Every file generated belongs to you from the first generation. Export as ZIP, push to GitHub, self-host, or sell. No lock-in, ever.' },
  { q: 'What frameworks are supported?', a: 'React + Vite, Next.js, Vue 3, and Vanilla JS. We generate complete working apps, not just UI shells — including database schema, auth, and API routes.' },
  { q: 'Is there an enterprise plan?', a: 'Yes. Email hello@wyberai.com for custom pricing, SSO, dedicated support, and volume credits.' },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { theme, toggle } = useTheme();
  const plans = PLANS[billing];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 clamp(16px,4vw,40px)', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo size={28} />
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.04em', color: 'var(--text)' }}>
            Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/login" className="wy-btn-ghost">Sign in</Link>
          <Link href="/signup" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, border: 'none', textDecoration: 'none', boxShadow: '0 2px 12px var(--sky-glow)' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) clamp(20px,4vw,40px) 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px,6vw,62px)', fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.05 }}>
          Honest pricing.<br /><em style={{ color: 'var(--sky)' }}>No gotchas.</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', marginBottom: 32 }}>
          Start free. Upgrade when you're ready. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, gap: 4, marginBottom: 'clamp(40px,6vw,64px)' }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              style={{ fontSize: 13, padding: '7px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: billing === b ? 'var(--card)' : 'transparent', color: billing === b ? 'var(--text)' : 'var(--text3)', boxShadow: billing === b ? 'var(--shadow)' : 'none', fontFamily: 'var(--font-sans)' }}>
              {b === 'monthly' ? 'Monthly' : <span>Annual <span style={{ color: 'var(--green)', fontSize: 11, marginLeft: 4, fontWeight: 700 }}>Save 25%</span></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,32px) clamp(48px,6vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background: plan.featured ? 'var(--navy)' : 'var(--card)', border: `1.5px solid ${plan.featured ? 'var(--sky)' : 'var(--border)'}`, borderRadius: 16, padding: '28px 22px', position: 'relative', boxShadow: plan.featured ? '0 8px 32px var(--sky-glow)' : 'var(--shadow)', display: 'flex', flexDirection: 'column', transition: 'all 0.22s' }}
              onMouseEnter={e => { if (!plan.featured) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(14,165,233,0.3)'; }}
              onMouseLeave={e => { if (!plan.featured) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}>

              {plan.featured && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'var(--sky)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: plan.featured ? 'rgba(255,255,255,0.5)' : 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>{plan.tier}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.04em', color: plan.featured ? '#fff' : 'var(--text)', lineHeight: 1, marginBottom: 3 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: plan.featured ? 'rgba(255,255,255,0.45)' : 'var(--text3)', marginBottom: 10 }}>{plan.per}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: plan.featured ? 'rgba(255,255,255,0.85)' : 'var(--sky)', marginBottom: 4 }}>{plan.credits}</div>
              <div style={{ fontSize: 11, color: plan.featured ? 'rgba(255,255,255,0.35)' : 'var(--text3)', marginBottom: 22 }}>{plan.note}</div>
              <div style={{ height: 1, background: plan.featured ? 'rgba(255,255,255,0.1)' : 'var(--border)', marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28, flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: plan.featured ? 'rgba(255,255,255,0.75)' : 'var(--text2)', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                    <span style={{ color: plan.featured ? '#4ade80' : 'var(--green)', fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 9, background: plan.featured ? '#fff' : 'var(--bg2)', color: plan.featured ? 'var(--navy)' : 'var(--text)', fontWeight: 700, fontSize: 14, border: `1px solid ${plan.featured ? 'transparent' : 'var(--border)'}`, textDecoration: 'none', transition: 'all 0.15s', letterSpacing: '-0.01em' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 24 }}>
          All plans: AI errors always free · No card for Free · Credits roll over · Cancel anytime · Enterprise?{' '}
          <a href="mailto:hello@wyberai.com" style={{ color: 'var(--sky)', fontWeight: 600 }}>hello@wyberai.com</a>
        </p>
      </div>

      {/* FAQ */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 40px', textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', textAlign: 'left', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{item.q}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 18, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 12 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'var(--bg)' }}>
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 6 }}>
            <WyberLogo size={22} />
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.04em', color: 'var(--text)' }}>Wyber<span style={{ color: 'var(--sky)' }}>AI</span></span>
          </Link>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            A product by <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sky)', fontWeight: 500 }}>SignalPulse Technologies</a> · Wyoming, USA · © 2026
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Status', '/status'], ['Dashboard', '/dashboard']].map(([l, h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', fontWeight: 500 }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

const PRODUCTS: Record<string, { emoji: string; color: string; tagline: string; launchDate: string; features: { title: string; desc: string }[] }> = {
  'AI Employees': {
    emoji: '🤖', color: '#a855f7',
    tagline: 'AI department heads that think, act, and learn like 10-year veterans. Not chatbots — real agentic employees.',
    launchDate: 'New employee released every Monday',
    features: [
      { title: 'Proactive, not reactive', desc: 'They don\'t wait for instructions. They monitor your email, CRM, and tools — then act on what they find. A Marketing Manager that spots a competitor launch and drafts your counter-messaging before you wake up.' },
      { title: '4-layer memory', desc: 'Short-term task state, semantic knowledge (your brand guidelines, ICP), episodic memory (past decisions and outcomes), and tool memory. They remember what worked and what didn\'t — like a real employee.' },
      { title: 'Human-in-the-loop', desc: 'Every outbound action goes through your approval. They draft, you approve. One bad email destroys a reputation — your AI employees know that.' },
      { title: 'Sense → Reason → Act', desc: 'They scan for signals (new hires, funding rounds, job posts), score them by revenue potential, then execute — draft emails, update CRM, alert your team. All autonomously.' },
      { title: 'Business-grade intelligence', desc: 'They understand MEDDPICC, multi-touch attribution, SaaS metrics, buying committees. Not just "summarize this email" — they evaluate impact and recommend next moves.' },
      { title: 'Self-correcting', desc: 'A weekly critic agent reviews every action taken. If reps ignore its nudges 3 times, it changes its approach. It learns what gets attention and what gets ignored.' },
    ],
  },
  'Workflows': {
    emoji: '🔀', color: '#22c55e',
    tagline: 'Visual automations that connect your tools and run AI reasoning at every step. Not just "if this then that" — intelligent process orchestration.',
    launchDate: 'Coming in July 2026',
    features: [
      { title: 'AI at every node', desc: 'Every step in your workflow can use Claude to reason, classify, draft, or decide. Not just data piping — intelligent processing.' },
      { title: 'Visual drag-and-drop', desc: 'Build complex automations by dragging triggers, AI steps, conditions, and actions onto a canvas. No code, no YAML.' },
      { title: '300+ pre-built templates', desc: 'From "support ticket triage" to "invoice payment reminder loop" — start from a template and customize.' },
      { title: 'Sub-workflows & parallel execution', desc: 'Nest workflows inside each other. Run branches in parallel. Handle errors gracefully with retry logic.' },
      { title: 'Schedule or trigger', desc: 'Run on a cron schedule, trigger from webhooks, or fire when specific events happen in your connected tools.' },
      { title: '30+ tool integrations', desc: 'Gmail, Slack, HubSpot, Notion, Stripe, GitHub, Linear, Airtable — connect everything your business runs on.' },
    ],
  },
  'GTM Engine': {
    emoji: '🎯', color: '#10b981',
    tagline: 'Define your ICP, find matching leads, launch multi-channel outreach — all from one canvas. Your entire go-to-market in one place.',
    launchDate: 'Coming in July 2026',
    features: [
      { title: 'ICP-first targeting', desc: 'Define exactly who you sell to — industry, seniority, company size, geography. Wyber finds matching leads automatically.' },
      { title: 'Multi-channel sequences', desc: 'Email → wait 3 days → follow-up → LinkedIn connect → phone call. Build the entire sequence visually.' },
      { title: 'AI personalization', desc: 'Every email is personalized using the prospect\'s LinkedIn bio, recent posts, company news, and role. Not mail merge — real personalization.' },
      { title: 'Intent signals', desc: 'Trigger outreach when buying signals fire — new hires in relevant roles, funding rounds, tech stack changes, G2 reviews.' },
      { title: 'Built-in email warmup', desc: 'Protect your domain reputation with automated warmup. SPF/DKIM/DMARC verification before you send.' },
      { title: 'Meeting booking', desc: 'Calendly/Cal.com integration. Prospects book directly from your outreach sequence. Auto-logs to CRM.' },
    ],
  },
}

export default function ComingSoonPage() {
  const searchParams = useSearchParams()
  const productName = searchParams.get('product') || 'AI Employees'
  const product = PRODUCTS[productName] || PRODUCTS['AI Employees']

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/community-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coming_soon_waitlist', product: productName, email: email.trim() }),
      })
      setSubmitted(true)
    } catch {}
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 32px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{product.emoji}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: product.color + '15', border: `1px solid ${product.color}30`, fontSize: 11, fontWeight: 700, color: product.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            {product.launchDate}
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
            {productName}
          </h1>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
            {product.tagline}
          </p>
        </div>

        {/* Waitlist form */}
        <div style={{ background: '#111113', border: `1px solid ${product.color}20`, borderRadius: 16, padding: '28px 32px', marginBottom: 48, textAlign: 'center' }}>
          {submitted ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>You're on the list!</div>
              <div style={{ fontSize: 14, color: '#71717a', marginBottom: 12 }}>We've added 25 credits to your account as a thank you.</div>
              <div style={{ fontSize: 13, color: product.color, fontWeight: 600 }}>We'll notify you the moment {productName} launches.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Get early access + 25 free credits</div>
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>Join the waitlist and we'll give you 25 credits when you sign up.</div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={handleSubmit} disabled={submitting || !email.trim()} style={{ padding: '12px 24px', borderRadius: 10, background: product.color, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {submitting ? '...' : 'Join waitlist'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: product.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>What's coming</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Not your average AI tool
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {product.features.map((f, i) => (
              <div key={i} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>{f.title}</div>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product tabs */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32 }}>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 12 }}>Also coming soon:</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(PRODUCTS).filter(([name]) => name !== productName).map(([name, p]) => (
              <Link key={name} href={`/coming-soon?product=${encodeURIComponent(name)}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'border-color 0.15s', flex: 1 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = p.color + '40'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>{name}</div>
                  <div style={{ fontSize: 10, color: p.color }}>Coming soon</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

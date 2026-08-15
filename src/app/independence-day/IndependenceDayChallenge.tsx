'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

// August 15 2026 11:59:59 PM IST = 18:29:59 UTC
const DEADLINE = new Date('2026-08-15T18:29:59Z')

const s = {
  bg: '#09090b',
  card: '#111115',
  border: 'rgba(255,255,255,0.07)',
  text: '#fafafa',
  muted: '#71717a',
  sky: '#0EA5E9',
  green: '#22c55e',
  saffron: '#FF9933',
}

const PRIZES = [
  { place: '1st', emoji: '🥇', cash: '₹50,000', color: '#f59e0b' },
  { place: '2nd', emoji: '🥈', cash: '₹25,000', color: '#a1a1aa' },
  { place: '3rd', emoji: '🥉', cash: '₹25,000', color: '#cd7c2f' },
]

const STEPS = [
  {
    n: '01',
    icon: '🆓',
    title: 'Sign up free on WyberAi',
    desc: 'Create your account and start building. The more you build and refine, the stronger your entry.',
  },
  {
    n: '02',
    icon: '🛠️',
    title: 'Build any working app today',
    desc: 'Describe what you want to build in plain English. WyberAi generates the full app — web, mobile, or SaaS. No code needed.',
  },
  {
    n: '03',
    icon: '🚀',
    title: 'Submit before 11:59 PM IST',
    desc: 'Publish your app and fill in the form below with the URL. Winner announced Wednesday, August 19th.',
  },
]

const CRITERIA = [
  { weight: '30%', label: 'It actually works', desc: 'A real, deployed app with usable features. Not a mockup.' },
  { weight: '25%', label: 'Solves a real problem', desc: 'Would someone come back and use this tomorrow?' },
  { weight: '25%', label: 'Design & polish', desc: 'Does it look professional? Is it intuitive to use?' },
  { weight: '20%', label: 'Wow factor', desc: 'Would someone screenshot this and say "wait, AI built that?"' },
]

const IDEAS = [
  'A student assignment tracker with reminders',
  'A local business ordering system',
  'A freelancer invoice + client portal',
  'A daily habit tracker with streaks',
  'A neighbourhood buy/sell listings app',
  'A restaurant menu with digital ordering',
  'A job board for a specific niche',
  'A fitness log with progress charts',
]

function pad(n: number) { return String(n).padStart(2, '0') }

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '14px 20px', minWidth: 80 }}>
      <div style={{ fontSize: 42, fontWeight: 900, color: s.sky, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad(value)}</div>
      <div style={{ fontSize: 10, color: s.muted, marginTop: 5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function Countdown() {
  const [t, setT] = useState({ h: 0, m: 0, s: 0, done: false })

  useEffect(() => {
    function tick() {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) { setT({ h: 0, m: 0, s: 0, done: true }); return }
      setT({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (t.done) {
    return <div style={{ color: s.muted, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>Submissions closed. Winner announced August 19th.</div>
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <CountdownBox value={t.h} label="Hours" />
      <span style={{ fontSize: 34, color: s.sky, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', marginTop: 14 }}>:</span>
      <CountdownBox value={t.m} label="Minutes" />
      <span style={{ fontSize: 34, color: s.sky, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', marginTop: 14 }}>:</span>
      <CountdownBox value={t.s} label="Seconds" />
    </div>
  )
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

function SubmitForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !appUrl.trim() || !description.trim()) return
    setState('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/independence-day/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), appUrl: appUrl.trim(), description: description.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json.error ?? 'Something went wrong. Please try again.'); setState('error'); return }
      setState('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setState('error')
    }
  }, [name, email, appUrl, description])

  if (state === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(34,197,94,0.04)', border: `1px solid rgba(34,197,94,0.2)`, borderRadius: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: s.green, marginBottom: 8 }}>Entry received!</div>
        <div style={{ fontSize: 15, color: s.muted, lineHeight: 1.6 }}>
          Your build is in the running. We review every submission personally.<br />
          Winners announced <strong style={{ color: s.text }}>Wednesday, August 19th</strong> — we will email you if you win.
        </div>
        <div style={{ marginTop: 20, fontSize: 13, color: s.muted }}>
          Share: <strong style={{ color: s.sky }}>#BuildForIndia</strong>
        </div>
      </div>
    )
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${s.border}`,
    background: 'rgba(255,255,255,0.03)',
    color: s.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: s.muted,
    marginBottom: 6,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" required />
        </div>
      </div>
      <div>
        <label style={labelStyle}>App URL * <span style={{ color: s.sky, textTransform: 'none', letterSpacing: 0 }}>(published on WyberAi)</span></label>
        <input style={inputStyle} type="url" value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://wyberai.com/app/..." required />
        <div style={{ fontSize: 11, color: s.muted, marginTop: 5 }}>Publish your app on WyberAi and paste the link. It must be live and accessible at time of judging.</div>
      </div>
      <div>
        <label style={labelStyle}>What did you build and what problem does it solve? *</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="I built a local marketplace for farmers to sell directly to buyers in their district..."
          maxLength={500}
          required
        />
        <div style={{ fontSize: 11, color: s.muted, marginTop: 5 }}>{description.length}/500</div>
      </div>
      {state === 'error' && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={state === 'submitting'}
        style={{
          padding: '14px 28px',
          borderRadius: 10,
          background: state === 'submitting' ? '#27272a' : s.sky,
          color: '#fff',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.01em',
          boxShadow: state === 'submitting' ? 'none' : '0 0 24px rgba(14,165,233,0.3)',
        }}
      >
        {state === 'submitting' ? 'Submitting...' : 'Submit My Build →'}
      </button>
      <p style={{ fontSize: 11, color: s.muted, textAlign: 'center', margin: 0 }}>
        By submitting you confirm your app was built using WyberAi and agree to the contest rules below.
      </p>
    </form>
  )
}

export function IndependenceDayChallenge() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display, system-ui, sans-serif)' }}>
      <style>{`
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 640px) { .steps-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* India flag stripe — CSS only, no emoji */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${s.saffron} 33.3%, #ffffff 33.3% 66.6%, #138808 66.6%)` }} />

      {/* Sticky nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: s.text }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <Link href="/signup" style={{ padding: '7px 18px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Start Building Free →
        </Link>
      </nav>

      {/* Sky radial glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: `radial-gradient(ellipse at top, rgba(14,165,233,0.10) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 'clamp(56px,9vw,110px) clamp(20px,4vw,48px) 60px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: `rgba(255,153,51,0.10)`, border: `1px solid rgba(255,153,51,0.3)`, marginBottom: 24, fontSize: 12, fontWeight: 700, color: s.saffron, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.saffron, display: 'inline-block', flexShrink: 0 }} />
            Independence Day · August 15, 2026
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,7vw,68px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
            Build India&apos;s next startup.{' '}
            <span style={{ color: s.sky }}>Win prizes upto ₹1 Lakh.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: s.muted, lineHeight: 1.65, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            On Independence Day, we&apos;re giving away <strong style={{ color: s.text }}>₹1,00,000 in cash prizes</strong> across 3 winners — plus free mentorship to turn your app into a real product and help you become a tech founder.
          </p>

          {/* Countdown */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Submissions close in</div>
            <Countdown />
            <div style={{ fontSize: 12, color: s.muted, marginTop: 12 }}>August 15, 2026 at 11:59 PM IST</div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 36px', borderRadius: 12, background: s.sky, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 40px rgba(14,165,233,0.35)' }}>
              Start Building Free →
            </Link>
            <a href="#submit" style={{ padding: '14px 36px', borderRadius: 12, border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Already built? Submit →
            </a>
          </div>
          <p style={{ fontSize: 12, color: s.muted, marginTop: 16 }}>
            Open to all · Sign up and start building today
          </p>
        </div>
      </section>

      {/* Prizes */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.saffron, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Prize Pool</div>
          <div style={{ fontSize: 'clamp(40px,7vw,64px)', fontWeight: 900, letterSpacing: '-0.04em', color: s.text, lineHeight: 1 }}>₹1,00,000</div>
          <div style={{ fontSize: 15, color: s.muted, marginTop: 8 }}>across 3 winners · Cash · Bank transfer</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 32 }}>
          {PRIZES.map(p => (
            <div key={p.place} style={{ padding: '24px 20px', borderRadius: 16, border: `1px solid ${s.border}`, background: s.card, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{p.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: p.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{p.place} Place</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: s.text, letterSpacing: '-0.03em' }}>{p.cash}</div>
              <div style={{ fontSize: 12, color: s.muted, marginTop: 6 }}>cash prize</div>
            </div>
          ))}
        </div>

        {/* Mentorship bonus */}
        <div style={{ marginTop: 14, padding: '22px 28px', borderRadius: 16, border: `1px solid rgba(14,165,233,0.2)`, background: 'rgba(14,165,233,0.04)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>🎓</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>All 3 winners get free mentorship</div>
            <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>
              Work directly with the WyberAi founder to turn your app into a full product — and get the guidance you need to become a tech founder. Not a credit. Not a template. Real mentorship.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['Cash — not credits', 'Paid within 7 working days', 'Winners announced August 19th (Wed)'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: s.muted }}>
              <span style={{ color: s.green, fontWeight: 800 }}>✓</span> {f}
            </div>
          ))}
        </div>
      </section>

      {/* How to enter */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>How to enter</h2>
        <p style={{ textAlign: 'center', color: s.muted, fontSize: 15, marginBottom: 40 }}>Three steps. Less than 5 minutes to start.</p>
        <div className="steps-grid">
          {STEPS.map(step => (
            <div key={step.n} style={{ padding: '24px', borderRadius: 16, border: `1px solid ${s.border}`, background: s.card }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: s.saffron, letterSpacing: '0.12em', marginBottom: 14, opacity: 0.7 }}>STEP {step.n}</div>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{step.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>{step.title}</div>
              <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.65 }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/signup" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Build ideas */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Not sure what to build?</h2>
        <p style={{ textAlign: 'center', color: s.muted, fontSize: 14, marginBottom: 28 }}>8 ideas you can ship in a few hours on WyberAi</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {IDEAS.map((idea, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${s.border}`, background: 'rgba(255,255,255,0.015)', fontSize: 13, color: s.muted, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: s.sky, fontWeight: 800, flexShrink: 0 }}>→</span> {idea}
            </div>
          ))}
        </div>
      </section>

      {/* Judging */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 40 }}>What we judge on</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CRITERIA.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', borderRadius: 12, border: `1px solid ${s.border}`, background: s.card }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.sky, minWidth: 48, flexShrink: 0 }}>{c.weight}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: s.muted }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: s.muted, marginTop: 20 }}>
          The WyberAi team reviews every submission personally. Our decision is final.
        </p>
      </section>

      {/* Submit form */}
      <section id="submit" style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ padding: '40px clamp(24px,4vw,48px)', borderRadius: 20, border: `1px solid ${s.border}`, background: s.card }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
            <h2 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Submit your build</h2>
            <p style={{ fontSize: 14, color: s.muted }}>Built something on WyberAi? Enter it here.</p>
          </div>
          <SubmitForm />
        </div>
      </section>

      {/* Official rules */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,4vw,48px) 80px', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 24 }}>Official Contest Rules</h2>
        <div style={{ padding: '28px 32px', borderRadius: 16, border: `1px solid ${s.border}`, background: s.card, fontSize: 13, color: s.muted, lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Open to individuals aged 18 and above residing in India.',
            'Entry requires building and publishing a working app using WyberAi (wyberai.com).',
            'One submission per person. Multiple accounts or submissions will result in disqualification.',
            'Submitted apps must be live and accessible via a public URL at time of judging.',
            'Submission deadline: August 15, 2026 at 11:59:59 PM IST. Late submissions will not be considered.',
            'The winner will be selected by the WyberAi team based on the judging criteria stated above. The decision is final and not subject to appeal.',
            'Winners announced: Wednesday, August 19, 2026 via email.',
            'Prizes: 1st place ₹50,000 · 2nd place ₹25,000 · 3rd place ₹25,000, paid via NEFT/IMPS bank transfer within 7 working days of winner confirmation. Winners must provide valid bank account details and government-issued ID. All 3 winners also receive free mentorship from the WyberAi founder.',
            'WyberAi reserves the right to disqualify entries that violate our Terms of Service or contain offensive content.',
            'By submitting, participants grant WyberAi a non-exclusive licence to showcase their build in marketing materials, with attribution.',
            'WyberAi reserves the right to modify or cancel the contest in case of unforeseen circumstances.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: s.sky, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px clamp(20px,4vw,48px) 80px', textAlign: 'center', borderTop: `1px solid ${s.border}` }}>
        <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
          Today is the day.<br />
          <span style={{ color: s.sky }}>Build something real.</span>
        </h2>
        <p style={{ fontSize: 16, color: s.muted, marginBottom: 32 }}>
          Every great startup started with one build. Today, yours could win ₹1 lakh.
        </p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '16px 48px', borderRadius: 14, background: s.sky, color: '#fff', fontSize: 17, fontWeight: 900, textDecoration: 'none', boxShadow: '0 0 50px rgba(14,165,233,0.3)' }}>
          Start Building Free →
        </Link>
        <div style={{ fontSize: 12, color: s.muted, marginTop: 16 }}>Sign up · Build · Submit by 11:59 PM IST</div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px clamp(20px,4vw,48px)', borderTop: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <WyberLogo markSize={20} wordmarkSize={13} />
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: s.muted }}>
          <Link href="/terms" style={{ color: s.muted, textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ color: s.muted, textDecoration: 'none' }}>Privacy</Link>
          <Link href="/contact" style={{ color: s.muted, textDecoration: 'none' }}>Contact</Link>
        </div>
      </footer>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { MARKETING_MANAGER as M, MM_SCENARIO_COUNT } from '@/lib/ai-employees/marketing-manager-profile'

const BG = '#0b0d12', CARD = '#111115', BORDER = '#1e1e26', TEXT = '#e4e4e7', MUTED = '#71717a', DIM = '#3f3f46'
const ACCENT = M.color // magenta
const SKY = '#0EA5E9'

const hireUrl = `/ai-employees/roles/${M.slug}/hire`
const interviewUrl = `/ai-employees/roles/${M.slug}/interview`

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function MarketingManagerPage() {
  const [price, setPrice] = useState<{ priceLabel: string; label: string; hot: boolean } | null>(null)
  useEffect(() => {
    fetch(`/api/ai-employees/pricing?role=${M.slug}`).then(r => r.ok ? r.json() : null).then(d => d && setPrice(d)).catch(() => {})
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,13,18,0.9)', backdropFilter: 'blur(12px)' }}>
        <Link href="/ai-employees" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={interviewUrl} style={{ fontSize: 13, fontWeight: 600, color: ACCENT, textDecoration: 'none', padding: '8px 16px', borderRadius: 8, border: `1px solid ${ACCENT}40`, background: ACCENT + '12' }}>Interview him</Link>
          <Link href={hireUrl} style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, background: SKY }}>Hire {M.name} →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(800px 400px at 50% -10%, ${ACCENT}22, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 32px 56px', position: 'relative', textAlign: 'center' }}>
          <div style={{ width: 92, height: 92, borderRadius: 24, margin: '0 auto 24px', background: ACCENT + '18', border: `2px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46 }}>{M.emoji}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, padding: '5px 14px', borderRadius: 20, background: ACCENT + '12', border: `1px solid ${ACCENT}30` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> {M.years}+ years experience · Available to hire
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1.05 }}>
            Meet {M.name}, your<br />AI {M.title}
          </h1>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.6, maxWidth: 620, margin: '16px auto 0' }}>{M.tagline}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <Link href={hireUrl} style={{ padding: '15px 36px', borderRadius: 12, background: SKY, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 30px ${SKY}40` }}>Hire {M.name} →</Link>
            <Link href={interviewUrl} style={{ padding: '15px 28px', borderRadius: 12, background: 'transparent', color: TEXT, fontSize: 16, fontWeight: 600, textDecoration: 'none', border: `1px solid ${BORDER}` }}>Interview him first</Link>
          </div>
          {price && (
            <div style={{ marginTop: 18, fontSize: 14, color: MUTED }}>
              from <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{price.priceLabel}</span>
              {price.hot && <span style={{ marginLeft: 10, color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>🔥 in demand</span>}
              <span style={{ display: 'block', fontSize: 12, color: DIM, marginTop: 4 }}>{price.label}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <Stat value={`${M.years} yrs`} label="Experience" />
            <Stat value={`${M.tools.reduce((n, g) => n + g.tools.length, 0)}+`} label="Tools he works with" />
            <Stat value={`${MM_SCENARIO_COUNT}+`} label="Things he does" />
            <Stat value="∞" label="Agents he can deploy" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 32px 80px' }}>
        {/* Intro */}
        <p style={{ fontSize: 17, color: '#a1a1aa', lineHeight: 1.75, textAlign: 'center', maxWidth: 720, margin: '0 auto 64px' }}>{M.intro}</p>

        {/* How he works */}
        <Section eyebrow="How he works" title="A department head, not a chatbot" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 72 }}>
          {M.howItWorks.map((s, i) => (
            <div key={s.step} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT, marginBottom: 8 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{s.step}</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{s.detail}</div>
            </div>
          ))}
        </div>

        {/* What he knows */}
        <Section eyebrow="What he knows" title="A full marketing brain" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 72, justifyContent: 'center' }}>
          {M.knows.map(k => (
            <span key={k} style={{ fontSize: 13.5, padding: '9px 16px', borderRadius: 10, background: ACCENT + '10', border: `1px solid ${ACCENT}25`, color: '#e9d5f5', fontWeight: 500 }}>{k}</span>
          ))}
        </div>

        {/* What he does */}
        <Section eyebrow="What he does" title={`${MM_SCENARIO_COUNT}+ scenarios across every channel`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14, marginBottom: 72 }}>
          {M.capabilities.map(c => (
            <div key={c.area} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{c.area}</span>
              </div>
              <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, margin: '0 0 14px' }}>{c.blurb}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {c.scenarios.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#a1a1aa', lineHeight: 1.45 }}>
                    <span style={{ color: ACCENT, flexShrink: 0, fontWeight: 700 }}>›</span>{s}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tools */}
        <Section eyebrow="Tools he works with" title="Plugs into your stack — or tells you what to add" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 40 }}>
          {M.tools.map(g => (
            <div key={g.category} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span>{g.icon}</span>{g.category}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {g.tools.map(t => (
                  <span key={t} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: '#cbd5e1' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: DIM, textAlign: 'center', marginBottom: 72 }}>Don&apos;t have one of these? {M.name} will tell you exactly what to connect — or buy and assign to his work email — before he runs.</p>

        {/* KPIs */}
        <Section eyebrow="What he's measured on" title="He manages the number" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 72 }}>
          {M.kpis.map(k => (
            <div key={k.name} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: ACCENT }}>{k.target.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: DIM, marginBottom: 6 }}>{k.unit}</div>
              <div style={{ fontSize: 12.5, color: '#a1a1aa' }}>{k.name}</div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 20, background: `radial-gradient(600px 300px at 50% 0%, ${ACCENT}1f, transparent 70%)`, border: `1px solid ${BORDER}` }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Put {M.name} to work today</h2>
          <p style={{ fontSize: 15, color: MUTED, margin: '0 0 28px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>Interview him like a real candidate, then hire him in two minutes. He starts working immediately.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={hireUrl} style={{ padding: '15px 40px', borderRadius: 12, background: SKY, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 30px ${SKY}40` }}>Hire {M.name} →</Link>
            <Link href={interviewUrl} style={{ padding: '15px 28px', borderRadius: 12, background: 'transparent', color: TEXT, fontSize: 16, fontWeight: 600, textDecoration: 'none', border: `1px solid ${BORDER}` }}>Interview first</Link>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

function Section({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{title}</h2>
    </div>
  )
}

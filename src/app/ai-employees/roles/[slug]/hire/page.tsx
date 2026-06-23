'use client'
import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import { getRoleBySlug } from '@/lib/employee-roles'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }
const SKY = '#0EA5E9'

export default function HireRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const role = getRoleBySlug(slug)

  const [price, setPrice] = useState<{ priceLabel: string } | null>(null)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ priceLabel: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ai-employees/pricing?role=${slug}`).then(r => r.ok ? r.json() : null).then(d => d && setPrice(d)).catch(() => {})
  }, [slug])

  if (!role) return null
  const accent = role.color

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Give your employee a name first.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/ai-employees/hire-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleSlug: slug, employeeName: name.trim(), company, note }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Something went wrong'); setSubmitting(false); return }
      // Payment is the gate: send them straight to Dodo checkout. On success the
      // webhook provisions the employee. If no checkout link is configured yet,
      // fall back to the "we'll email you" confirmation.
      if (d.checkoutUrl) { window.location.href = d.checkoutUrl; return }
      setDone({ priceLabel: d.priceLabel })
    } catch { setError('Network error — please try again.'); setSubmitting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/ai-employees/${slug === 'marketing-manager' ? 'marketing-manager' : `roles/${slug}`}`} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href={`/ai-employees/roles/${slug}/interview`} style={{ fontSize: 12, color: s.muted, textDecoration: 'none' }}>← Interview first</Link>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 32px' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, margin: '0 0 10px' }}>Almost there</h1>
            <p style={{ fontSize: 15, color: s.muted, lineHeight: 1.65, maxWidth: 380, margin: '0 auto' }}>
              <strong style={{ color: s.text }}>{name}</strong> is reserved at <strong style={{ color: accent }}>{done.priceLabel}</strong>. We&apos;ll email you a secure payment link — once you pay, {name} is hired and ready to set up.
            </p>
            <Link href="/ai-employees" style={{ display: 'inline-block', marginTop: 28, padding: '12px 28px', borderRadius: 10, background: s.card, border: `1px solid ${s.border}`, color: s.text, textDecoration: 'none', fontSize: 14 }}>Back to employees</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: accent + '15', border: `2px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{role.emoji}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role.department}</div>
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, margin: 0 }}>Hire a {role.title}</h1>
              </div>
            </div>

            {/* Live price */}
            <div style={{ margin: '22px 0', padding: 18, borderRadius: 14, background: accent + '0d', border: `1px solid ${accent}30` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: s.muted }}>Current price</span>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff' }}>{price?.priceLabel ?? '…'}</span>
              </div>
              <p style={{ fontSize: 12, color: s.muted, margin: '8px 0 0', lineHeight: 1.5 }}>Billed monthly. You&apos;re only charged once your hire is approved and you complete payment.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Name your {role.title.toLowerCase()}</label>
                <p style={{ fontSize: 12, color: s.dim, margin: '0 0 8px' }}>This is your own hire — give them a name your team will use (e.g. Max, Nina, Priya).</p>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Max" required style={inp} />
              </div>
              <div>
                <label style={lbl}>Company (optional)</label>
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." style={inp} />
              </div>
              <div>
                <label style={lbl}>Anything we should know? (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What you'd want them focused on first…" style={{ ...inp, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={submitting} style={{ padding: '14px', borderRadius: 11, background: submitting ? '#1a1a22' : SKY, border: 'none', color: submitting ? s.dim : '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Taking you to checkout…' : `Continue to payment — ${price?.priceLabel ?? ''}`}
              </button>
              <p style={{ fontSize: 11, color: s.dim, textAlign: 'center' }}>Secure monthly payment via Dodo. Your employee activates the moment payment succeeds.</p>
            </form>
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 4 }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit' }

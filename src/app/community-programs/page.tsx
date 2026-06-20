'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

const PROGRAMS = [
  {
    id: 'blood_donor' as const,
    emoji: '🩸',
    title: 'Blood Donor Bonus',
    tagline: 'Donated blood in the last 90 days? Get 50% extra credits on your next top-up.',
    color: '#ef4444',
    how: 'Upload a selfie from the blood bank (no medical certificates — just a photo showing you donated). We review within 24 hours and add the bonus to your next credit purchase.',
    reward: '50% extra credits on next top-up',
    proofLabel: 'Photo URL (upload to imgur/drive and paste link)',
    proofPlaceholder: 'https://i.imgur.com/your-photo.jpg',
    needsUrl: true,
  },
  {
    id: 'build_in_public' as const,
    emoji: '📣',
    title: 'Build in Public',
    tagline: 'Share what you built with WyberAI on Twitter/LinkedIn. Get 50 bonus credits instantly.',
    color: SKY,
    how: 'Post about your WyberAI project on Twitter or LinkedIn with #BuiltWithWyber. Paste the post URL below — credits are added automatically.',
    reward: '50 bonus credits (instant)',
    proofLabel: 'Post URL',
    proofPlaceholder: 'https://twitter.com/you/status/...',
    needsUrl: true,
  },
  {
    id: 'accessibility' as const,
    emoji: '♿',
    title: 'Accessibility Program',
    tagline: '50% off any plan. Verified through ID.me — we never see your medical records.',
    color: '#a855f7',
    how: 'We partner with ID.me for verification. Click submit and we\'ll send you a verification link via email. Once verified, the discount applies automatically to your next billing cycle.',
    reward: '50% discount on any plan',
    proofLabel: 'Your email (we\'ll send the ID.me verification link)',
    proofPlaceholder: 'your@email.com',
    needsUrl: false,
  },
  {
    id: 'open_source' as const,
    emoji: '🌟',
    title: 'Open Source Builder',
    tagline: 'Maintain a repo with 50+ stars? Get 30% off your plan.',
    color: '#f59e0b',
    how: 'Paste a link to your GitHub/GitLab repo with 50+ stars. We verify the star count and that you\'re listed as a contributor.',
    reward: '30% discount on any plan',
    proofLabel: 'Repository URL',
    proofPlaceholder: 'https://github.com/you/project',
    needsUrl: true,
  },
]

export default function CommunityProgramsPage() {
  const [submissions, setSubmissions] = useState<Array<{ program: string; status: string }>>([])
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [proofValues, setProofValues] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        setUser(data.user)
        if (data.user) {
          fetch('/api/community-programs').then(r => r.json()).then(d => setSubmissions(d.submissions ?? []))
        }
      })
    })
  }, [])

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

  const handleSubmit = async (programId: string) => {
    if (!user) { window.location.href = '/login?next=/community-programs'; return }
    setSubmitting(programId)
    try {
      const res = await fetch('/api/community-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: programId, proof_url: proofValues[programId] || '', proof_text: proofValues[programId] || '' }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(d.message || 'Submitted!')
        setSubmissions(prev => [...prev, { program: programId, status: d.auto_approved ? 'approved' : 'pending' }])
      } else {
        showToast(d.error || 'Something went wrong', false)
      }
    } catch { showToast('Network error', false) }
    setSubmitting(null)
  }

  const getStatus = (programId: string) => submissions.find(s => s.program === programId)?.status

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0f2a1a' : '#2a0f0f', border: `1px solid ${toast.ok ? '#22c55e33' : '#ef444433'}`, color: toast.ok ? '#22c55e' : '#ef4444', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}>Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: SKY, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Community
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
            Good people get rewarded
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            We believe in giving back. These programs reward our community for doing good — whether it's saving lives, building in the open, or contributing to open source.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PROGRAMS.map(p => {
            const status = getStatus(p.id)
            return (
              <div key={p.id} style={{ background: '#111113', border: `1px solid ${status === 'approved' ? p.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: 'clamp(24px,3vw,32px)', position: 'relative', overflow: 'hidden' }}>
                {status === 'approved' && (
                  <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                    Applied
                  </div>
                )}
                {status === 'pending' && (
                  <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                    Under review
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: p.color + '12', border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {p.emoji}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#fafafa' }}>{p.title}</h2>
                    <p style={{ fontSize: 13, color: '#71717a', margin: 0, lineHeight: 1.5 }}>{p.tagline}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>How it works</div>
                  <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>{p.how}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: p.color + '12', color: p.color, border: `1px solid ${p.color}25` }}>
                    {p.reward}
                  </span>
                </div>

                {!status && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#52525b', marginBottom: 6, display: 'block' }}>{p.proofLabel}</label>
                      <input
                        value={proofValues[p.id] || ''}
                        onChange={e => setProofValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder={p.proofPlaceholder}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d10', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(p.id)}
                      disabled={submitting === p.id || !proofValues[p.id]?.trim()}
                      style={{
                        padding: '10px 20px', borderRadius: 8, border: 'none',
                        background: submitting === p.id ? '#1a1a22' : p.color,
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting === p.id ? 'wait' : 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {submitting === p.id ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, padding: '24px', background: '#111113', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
            Questions? Email us at <a href="mailto:hello@wyberai.com" style={{ color: SKY, textDecoration: 'none' }}>hello@wyberai.com</a>. We review all submissions within 24 hours.
          </p>
        </div>
      </div>
    </div>
  )
}

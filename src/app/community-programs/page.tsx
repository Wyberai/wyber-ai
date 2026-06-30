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
    tagline: '50% off any plan for people with disabilities. Reviewed manually — we never ask for medical records.',
    color: '#a855f7',
    how: 'Enter your email and we\'ll follow up to confirm eligibility (a one-line note is enough — no medical documentation needed). Once confirmed, the discount applies to your next billing cycle.',
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
  {
    id: 'follow_linkedin' as const,
    emoji: '💼',
    title: 'Follow us on LinkedIn',
    tagline: 'Follow WyberAI on LinkedIn and get 25 bonus credits instantly.',
    color: '#0a66c2',
    how: 'Follow our LinkedIn page, then paste a link to your LinkedIn profile below. Credits are added automatically.',
    reward: '25 bonus credits (instant)',
    proofLabel: 'Your LinkedIn profile URL',
    proofPlaceholder: 'https://linkedin.com/in/you',
    needsUrl: true,
  },
  {
    id: 'follow_reddit' as const,
    emoji: '👽',
    title: 'Follow us on Reddit',
    tagline: 'Join r/WyberAI on Reddit and get 25 bonus credits instantly.',
    color: '#ff4500',
    how: 'Join our subreddit, then paste a link to your Reddit profile below. Credits are added automatically.',
    reward: '25 bonus credits (instant)',
    proofLabel: 'Your Reddit profile URL',
    proofPlaceholder: 'https://reddit.com/user/you',
    needsUrl: true,
  },
  {
    id: 'review_taaft' as const,
    emoji: '⭐',
    title: 'Review us on TAAFT',
    tagline: 'Leave an honest review on There\'s An AI For That and get 50 bonus credits.',
    color: '#22c55e',
    how: 'Review WyberAI on theresanaiforthat.com, then paste the link to your review below. Credits are added automatically.',
    reward: '50 bonus credits (instant)',
    proofLabel: 'Link to your TAAFT review',
    proofPlaceholder: 'https://theresanaiforthat.com/ai/wyberai/',
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
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: 'var(--font-display)', color: '#fafafa' }}>
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
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
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: p.id === 'blood_donor' ? 10 : 0 }}>
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
                    {p.id === 'blood_donor' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ fontSize: 11, color: '#3f3f46' }}>or upload a photo directly</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                    )}
                    {p.id === 'blood_donor' && (
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '14px 16px', borderRadius: 10,
                            border: '2px dashed rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)',
                            color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(239,68,68,0.5)'; (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)'; (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.04)' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload blood donation selfie
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setSubmitting('blood_donor')
                              try {
                                const { createClient } = await import('@/lib/supabase/client')
                                const supabase = createClient()
                                const fileName = `blood-donor/${Date.now()}-${file.name}`
                                const { error: uploadErr } = await supabase.storage.from('community-proofs').upload(fileName, file, { contentType: file.type })
                                if (uploadErr) { showToast('Upload failed: ' + uploadErr.message, false); setSubmitting(null); return }
                                const { data: urlData } = supabase.storage.from('community-proofs').getPublicUrl(fileName)
                                setProofValues(prev => ({ ...prev, blood_donor: urlData.publicUrl }))
                                showToast('Photo uploaded! Click Submit to complete.')
                              } catch { showToast('Upload failed — try pasting a URL instead', false) }
                              setSubmitting(null)
                            }}
                          />
                        </label>
                        {proofValues['blood_donor']?.includes('supabase') && (
                          <div style={{ marginTop: 8, fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>&#10003;</span> Photo uploaded — click Submit above to complete
                          </div>
                        )}
                      </div>
                    )}
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

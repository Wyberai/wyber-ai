'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

interface Affiliate {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  payout_email: string | null
  payout_method: string | null
  applied_at: string
}

export interface Commission {
  id: string
  dodo_event_type: string
  plan_key: string | null
  charge_usd: number
  commission_usd: number
  status: 'pending' | 'paid' | 'reversed'
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Application pending review', color: '#f59e0b' },
  approved: { label: 'Approved — earning commission', color: '#22c55e' },
  rejected: { label: 'Application not approved', color: '#ef4444' },
  suspended: { label: 'Suspended', color: '#a1a1aa' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}

export function AffiliateClient({ affiliate, commissions, pendingUsd, paidUsd }: { affiliate: Affiliate | null; commissions: Commission[]; pendingUsd: number; paidUsd: number }) {
  const router = useRouter()
  const [applying, setApplying] = useState(false)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [payoutEmail, setPayoutEmail] = useState(affiliate?.payout_email ?? '')
  const [payoutMethod, setPayoutMethod] = useState(affiliate?.payout_method ?? '')
  const [savingPayout, setSavingPayout] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(d => { if (d.code) setCode(d.code) }).catch(() => {})
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const apply = async () => {
    setApplying(true)
    const res = await fetch('/api/affiliate/apply', { method: 'POST' })
    if (res.ok) { router.refresh(); showToast('Application submitted') }
    else showToast('Failed to apply — try again')
    setApplying(false)
  }

  const copyLink = () => {
    const link = `https://wyberai.com/signup?ref=${code}`
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const savePayoutInfo = async () => {
    setSavingPayout(true)
    const res = await fetch('/api/affiliate/payout-info', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutEmail, payoutMethod }),
    })
    if (res.ok) showToast('Payout info saved')
    else showToast('Failed to save')
    setSavingPayout(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f2a1a', border: '1px solid #22c55e33', color: '#22c55e', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>
      )}

      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Affiliate dashboard</h1>
        <p style={{ color: '#3f3f46', fontSize: 14, margin: '0 0 32px' }}>30% recurring commission, for the lifetime of a referred customer&apos;s subscription.</p>

        {!affiliate ? (
          <div style={{ background: '#111115', border: `1px solid ${SKY}33`, borderRadius: 14, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Apply to become an affiliate</div>
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20, lineHeight: 1.6 }}>Approved applicants earn cash commission on every payment their referrals make. Reviewed within 24 hours.</p>
            <button onClick={apply} disabled={applying} style={{ padding: '10px 26px', borderRadius: 9, background: applying ? '#1a1a22' : SKY, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{applying ? 'Applying…' : 'Apply now'}</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_LABEL[affiliate.status].color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_LABEL[affiliate.status].color }}>{STATUS_LABEL[affiliate.status].label}</span>
            </div>

            {affiliate.status === 'approved' && code && (
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your link</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input readOnly value={`wyberai.com/signup?ref=${code}`} style={{ ...inputStyle, flex: 1, color: '#a1a1aa' }} />
                  <button onClick={copyLink} style={{ padding: '10px 18px', borderRadius: 9, background: copied ? '#22c55e' : SKY, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>${pendingUsd.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>Pending payout</div>
              </div>
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>${paidUsd.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>Paid lifetime</div>
              </div>
            </div>

            {affiliate.status === 'approved' && (
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Payout info</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <input value={payoutEmail} onChange={e => setPayoutEmail(e.target.value)} placeholder="PayPal / Wise email" style={inputStyle} />
                  <input value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} placeholder="Method (PayPal, Wise, bank…)" style={inputStyle} />
                </div>
                <button onClick={savePayoutInfo} disabled={savingPayout} style={{ padding: '8px 18px', borderRadius: 9, background: savingPayout ? '#1a1a22' : SKY, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{savingPayout ? 'Saving…' : 'Save'}</button>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Commission history</div>
              {commissions.length === 0 ? (
                <p style={{ color: '#3f3f46', fontSize: 13 }}>No commissions yet — they&apos;ll show up here after a referred signup pays.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {commissions.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#111115', border: '1px solid #1e1e26', borderRadius: 9, fontSize: 13 }}>
                      <div>
                        <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{c.plan_key || c.dodo_event_type}</span>
                        <span style={{ color: '#3f3f46', marginLeft: 8 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: c.status === 'reversed' ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                          {c.status === 'reversed' ? '−' : '+'}${c.commission_usd.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase' }}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }
const SKY = '#0EA5E9', GREEN = '#22c55e', RED = '#ef4444'

interface HireRequest {
  id: string; role_title: string; employee_name: string; requester_email?: string
  company?: string; note?: string; quoted_price_cents: number; status: string; created_at: string
}

const fmt = (c: number) => `$${(c / 100).toLocaleString()}`

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<HireRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/ai-employees/hire-request')
    if (res.status === 403) { setForbidden(true); setLoading(false); return }
    if (res.ok) { const d = await res.json(); setRequests(d.requests ?? []) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id)
    await fetch('/api/ai-employees/hire-request', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    await load(); setBusy(null)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const decided = requests.filter(r => r.status !== 'pending')

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/ai-employees" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <span style={{ fontSize: 12, color: s.muted }}>Hire requests</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, margin: '0 0 24px' }}>Hire requests</h1>

        {forbidden ? (
          <p style={{ color: s.muted }}>This page is for the platform owner only.</p>
        ) : loading ? (
          <p style={{ color: s.dim }}>Loading…</p>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Pending ({pending.length})</div>
            {pending.length === 0 && <p style={{ color: s.dim, fontSize: 14, marginBottom: 32 }}>No pending requests.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
              {pending.map(r => (
                <div key={r.id} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{r.employee_name} <span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>· {r.role_title}</span></div>
                      <div style={{ fontSize: 13, color: s.muted, marginTop: 4 }}>{r.requester_email}{r.company ? ` · ${r.company}` : ''}</div>
                      {r.note && <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 8, fontStyle: 'italic' }}>“{r.note}”</div>}
                    </div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: SKY, whiteSpace: 'nowrap' }}>{fmt(r.quoted_price_cents)}<span style={{ fontSize: 11, color: s.dim }}>/mo</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'approve')} style={{ flex: 1, padding: '10px', borderRadius: 9, background: GREEN, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{busy === r.id ? '…' : '✓ Approve & provision'}</button>
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'reject')} style={{ padding: '10px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${RED}40`, color: RED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>

            {decided.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Decided</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {decided.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, fontSize: 13 }}>
                      <span style={{ color: s.text }}>{r.employee_name} · {r.role_title} <span style={{ color: s.dim }}>({r.requester_email})</span></span>
                      <span style={{ color: r.status === 'approved' ? GREEN : RED, fontWeight: 600, textTransform: 'capitalize' }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

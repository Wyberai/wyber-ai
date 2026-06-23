'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }
const SKY = '#0EA5E9', GREEN = '#22c55e', AMBER = '#f59e0b'

interface HireRequest {
  id: string; role_title: string; employee_name: string; requester_email?: string
  company?: string; quoted_price_cents: number; status: string; created_at: string
}

const fmt = (c: number) => `$${(c / 100).toLocaleString()}`
const STATUS_COLOR: Record<string, string> = { active: GREEN, pending_payment: AMBER }
const STATUS_LABEL: Record<string, string> = { active: 'Hired & paid', pending_payment: 'Awaiting payment' }

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<HireRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/ai-employees/hire-request').then(async res => {
      if (res.status === 403) { setForbidden(true); setLoading(false); return }
      if (res.ok) { const d = await res.json(); setRequests(d.requests ?? []) }
      setLoading(false)
    })
  }, [])

  const active = requests.filter(r => r.status === 'active')
  const pending = requests.filter(r => r.status === 'pending_payment')

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/ai-employees" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <span style={{ fontSize: 12, color: s.muted }}>Hires</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Hires</h1>
        <p style={{ fontSize: 13, color: s.muted, margin: '0 0 28px' }}>Every employee hired through the site. Payment activates them automatically.</p>

        {forbidden ? (
          <p style={{ color: s.muted }}>This page is for the platform owner only.</p>
        ) : loading ? (
          <p style={{ color: s.dim }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p style={{ color: s.dim, fontSize: 14 }}>No hires yet.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
              <div><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: GREEN }}>{active.length}</div><div style={{ fontSize: 12, color: s.muted }}>Active hires</div></div>
              <div><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: AMBER }}>{pending.length}</div><div style={{ fontSize: 12, color: s.muted }}>Awaiting payment</div></div>
              <div><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: SKY }}>{fmt(active.reduce((n, r) => n + r.quoted_price_cents, 0))}</div><div style={{ fontSize: 12, color: s.muted }}>MRR</div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: s.card, border: `1px solid ${s.border}`, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{r.employee_name} <span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>· {r.role_title}</span></div>
                    <div style={{ fontSize: 12.5, color: s.muted, marginTop: 3 }}>{r.requester_email}{r.company ? ` · ${r.company}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>{fmt(r.quoted_price_cents)}<span style={{ fontSize: 11, color: s.dim }}>/mo</span></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[r.status] ?? s.dim, marginTop: 2 }}>{STATUS_LABEL[r.status] ?? r.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

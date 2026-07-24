'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const ACCENT = '#0EA5E9'

const CATEGORY_SUGGESTIONS = ['SaaS', 'CRM', 'Ecommerce', 'Productivity', 'Finance', 'Healthcare', 'Education', 'Landing', 'ProjectManagement', 'Other']

type Project = { id: string; name: string; framework: string }
type Listing = { id: string; title: string; category: string; price_usd: number; status: string; sales_count: number; created_at: string }

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', label: 'Pending review' },
  approved: { bg: 'rgba(16,185,129,0.12)', fg: '#34d399', label: 'Live' },
  rejected: { bg: 'rgba(239,68,68,0.10)',  fg: '#f87171', label: 'Rejected' },
  hidden:   { bg: 'rgba(113,113,122,0.12)', fg: '#a1a1aa', label: 'Hidden' },
}

export function SellClient({ projects, listings }: { projects: Project[]; listings: Listing[] }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('9')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    background: '#111113', color: '#fafafa', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 6, display: 'block' }

  const canSubmit = projectId && title.trim() && description.trim() && category.trim() && Number(price) >= 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('submitting'); setError('')
    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title, description, category, priceUsd: Number(price) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit listing')
      setTitle(''); setDescription(''); setCategory(''); setPrice('9')
      setStatus('idle')
      router.refresh()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={13} />
        </Link>
        <Link href="/marketplace" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>← Marketplace</Link>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,48px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Sell your app</div>
        <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>List one of your apps for sale</h1>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 28, lineHeight: 1.6 }}>
          Pick a project you&apos;ve built, set a price, and submit. Listings are reviewed before going live — once approved, buyers see your name and get a full editable copy the moment they pay.
        </p>

        {projects.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.15)', color: '#71717a', fontSize: 13, marginBottom: 32 }}>
            You don&apos;t have any projects yet. <Link href="/dashboard" style={{ color: ACCENT, textDecoration: 'none' }}>Build one first →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            <div>
              <label style={labelStyle}>Which project?</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Listing title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. SaaS Analytics Dashboard" style={inputStyle} maxLength={80} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does it do? Who's it for?" rows={4} style={{ ...inputStyle, resize: 'vertical' }} maxLength={600} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Category</label>
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. SaaS" style={inputStyle} list="category-suggestions" />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div style={{ width: 140 }}>
                <label style={labelStyle}>Price (USD)</label>
                <input type="number" min={1} step={1} value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
              </div>
            </div>
            {status === 'error' && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
            <button type="submit" disabled={!canSubmit || status === 'submitting'}
              style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.5, fontFamily: 'inherit' }}>
              {status === 'submitting' ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}

        {listings.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Your submissions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listings.map(l => {
                const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: '#111113' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{l.category} · ${l.price_usd}{l.sales_count > 0 ? ` · ${l.sales_count} sold` : ''}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', background: st.bg, color: st.fg }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

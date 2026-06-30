'use client'
import { useState } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  sky: '#0EA5E9', orange: '#f97316', green: '#10b981', violet: '#8b5cf6',
}

interface Props {
  user: any
  profile: any
  campaigns: any[]
  totalLeads: number
}

export default function GTMDashboardClient({ user, profile, campaigns, totalLeads }: Props) {
  const hasProfile = !!profile?.company_name
  const activeCampaigns = (campaigns || []).filter(c => c.status === 'active').length
  const totalSent = (campaigns || []).reduce((a, c) => a + (c.stats?.sent || 0), 0)
  const totalReplies = (campaigns || []).reduce((a, c) => a + (c.stats?.replies || 0), 0)
  const [editing, setEditing] = useState(false)
  const [gtmName, setGtmName] = useState(hasProfile ? `${profile.company_name} — GTM` : 'Go-to-Market')
  const [saving, setSaving] = useState(false)

  const handleRename = async () => {
    if (!gtmName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/gtm/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: gtmName.trim() }) })
    } catch {}
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['Web Apps', 'Mobile', 'Agents', 'Workflows', 'AI Employees', 'GTM'].map((l, i) => {
            const hrefs = ['/gallery', '/templates/mobile', '/agents', '/workflows', '/ai-employees', '/gtm']
            const active = l === 'GTM'
            return <Link key={l} href={hrefs[i]} style={{ fontSize: 13, color: active ? s.sky : s.muted, textDecoration: 'none', fontWeight: active ? 700 : 400 }}>{l}</Link>
          })}
          <Link href="/settings" style={{ marginLeft: 8, width: 32, height: 32, borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14 }}>⚙</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.orange, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>GTM Engine</div>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={gtmName} onChange={e => setGtmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.03em', background: '#111113', border: `1px solid ${s.border}`, borderRadius: 8, color: s.text, padding: '4px 12px', outline: 'none', width: 320 }} />
                <button onClick={handleRename} disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, background: s.sky, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{saving ? '...' : 'Save'}</button>
                <button onClick={() => setEditing(false)} style={{ padding: '6px 14px', borderRadius: 6, background: 'transparent', color: s.muted, border: `1px solid ${s.border}`, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <h1 onClick={() => setEditing(true)} title="Click to rename" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, cursor: 'pointer', borderBottom: '1px dashed transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderBottomColor = s.muted)} onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}>
                {gtmName} <span style={{ fontSize: 14, color: s.dim, fontWeight: 400 }}>✎</span>
              </h1>
            )}
            <p style={{ fontSize: 14, color: s.muted }}>Find customers, run outreach, book meetings. All from one canvas.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/gtm/settings" style={{ padding: '9px 16px', borderRadius: 8, background: s.card, border: `1px solid ${s.border}`, color: s.muted, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Connectors</Link>
            <Link href="/gtm/campaigns/new" style={{ padding: '9px 18px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>+ New campaign</Link>
          </div>
        </div>

        {/* Setup banner */}
        {!hasProfile && (
          <div style={{ marginBottom: 28, padding: '20px 24px', borderRadius: 12, background: `${s.orange}0d`, border: `1px solid ${s.orange}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Set up your GTM profile first</div>
              <div style={{ fontSize: 13, color: s.muted }}>Tell us about your company and ICP — Wyber auto-generates your campaign strategy and finds your market.</div>
            </div>
            <Link href="/gtm/setup" style={{ padding: '10px 20px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Set up ICP →</Link>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total leads', value: totalLeads.toLocaleString(), color: s.sky, href: '/gtm/leads' },
            { label: 'Active campaigns', value: String(activeCampaigns), color: s.green, href: '/gtm/campaigns' },
            { label: 'Emails sent', value: totalSent.toLocaleString(), color: s.violet, href: null },
            { label: 'Replies', value: totalReplies.toLocaleString(), color: s.orange, href: '/gtm/inbox' },
          ].map(stat => (
            <div key={stat.label} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: s.muted, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Campaigns */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Recent Campaigns</div>
            {campaigns.length === 0 ? (
              <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📣</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No campaigns yet</div>
                <div style={{ fontSize: 13, color: s.muted, marginBottom: 20 }}>Build your first campaign on the visual canvas — email, calls, and branches in one flow.</div>
                <Link href="/gtm/campaigns/new" style={{ padding: '9px 18px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Build campaign →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campaigns.map(c => {
                  const statusColor = c.status === 'active' ? s.green : c.status === 'paused' ? s.orange : s.muted
                  return (
                    <Link key={c.id} href={`/gtm/campaigns/${c.id}`} style={{ display: 'block', textDecoration: 'none', background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{c.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: statusColor + '15', border: `1px solid ${statusColor}30`, color: statusColor }}>{c.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: s.muted }}>
                        <span>📤 {c.stats?.sent || 0} sent</span>
                        <span>👁 {c.stats?.opens || 0} opens</span>
                        <span>💬 {c.stats?.replies || 0} replies</span>
                        {c.stats?.calls_made > 0 && <span>📞 {c.stats.calls_made} calls</span>}
                      </div>
                    </Link>
                  )
                })}
                <Link href="/gtm/campaigns" style={{ fontSize: 13, color: s.sky, textDecoration: 'none', paddingTop: 4 }}>View all campaigns →</Link>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Quick actions</div>

            {[
              { icon: '🎯', label: hasProfile ? 'Edit ICP profile' : 'Set up ICP', sub: 'Company + ideal customer', href: '/gtm/setup', color: s.orange },
              { icon: '🌍', label: 'Market intelligence', sub: 'See your total addressable market', href: '/gtm/market', color: s.sky },
              { icon: '👤', label: 'Import leads', sub: 'Apollo search or CSV upload', href: '/gtm/leads/import', color: s.violet },
              { icon: '📚', label: 'Sequence templates', sub: '10 high-converting sequences', href: '/gtm/sequences', color: '#f59e0b' },
              { icon: '📥', label: 'Reply inbox', sub: 'AI-drafted responses ready', href: '/gtm/inbox', color: s.green },
              { icon: '🔗', label: 'Connect tools', sub: 'Apollo, Smartlead, JustCall...', href: '/gtm/settings', color: s.muted },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: s.card, border: `1px solid ${s.border}`, borderRadius: 9, textDecoration: 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: s.muted }}>{item.sub}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: s.dim, fontSize: 14 }}>→</div>
              </Link>
            ))}

            {/* SDR Employee upsell */}
            <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 9, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>💡 Hire an SDR Employee</div>
              <div style={{ fontSize: 12, color: s.muted, marginBottom: 10 }}>Let an AI Employee monitor replies and surface hot leads every morning — automatically.</div>
              <Link href="/employees/sdr" style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}>Hire SDR Employee →</Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

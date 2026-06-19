import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { notFound } from 'next/navigation'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', violet: '#8b5cf6',
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaign } = await supabase
    .from('gtm_campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id || '')
    .single()

  if (!campaign) notFound()

  const stats = campaign.stats || {}
  const statCards = [
    { label: 'Emails sent', value: stats.emails_sent || 0, icon: '📤', color: s.sky },
    { label: 'Opens', value: stats.opens || 0, icon: '👁', color: s.yellow, sub: stats.emails_sent ? `${Math.round((stats.opens || 0) / stats.emails_sent * 100)}% rate` : undefined },
    { label: 'Replies', value: stats.replies || 0, icon: '💬', color: s.green, sub: stats.emails_sent ? `${Math.round((stats.replies || 0) / stats.emails_sent * 100)}% rate` : undefined },
    { label: 'Calls made', value: stats.calls || 0, icon: '📞', color: s.orange },
    { label: 'Meetings', value: stats.meetings || 0, icon: '📅', color: s.violet },
    { label: 'Leads total', value: stats.leads || 0, icon: '👥', color: s.muted },
  ]

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/gtm/campaigns/${id}/canvas`} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: s.violet, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Edit canvas</Link>
          <Link href="/gtm/campaigns" style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, textDecoration: 'none' }}>← Campaigns</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px,5vw,60px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{campaign.name}</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: (campaign.status === 'active' ? s.green : s.muted) + '15', border: `1px solid ${(campaign.status === 'active' ? s.green : s.muted)}30`, color: campaign.status === 'active' ? s.green : s.muted }}>
              {campaign.status}
            </span>
          </div>
          <div style={{ fontSize: 13, color: s.muted }}>Created {new Date(campaign.created_at).toLocaleDateString()}</div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
          {statCards.map(stat => (
            <div key={stat.label} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, letterSpacing: '-0.02em', marginBottom: 2 }}>{stat.value.toLocaleString()}</div>
              {stat.sub && <div style={{ fontSize: 11, color: s.green, fontWeight: 600, marginBottom: 2 }}>{stat.sub}</div>}
              <div style={{ fontSize: 11, color: s.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Empty state when no data */}
        {!stats.emails_sent && (
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.yellow, marginBottom: 6 }}>Campaign not yet active</div>
            <div style={{ fontSize: 13, color: s.muted, marginBottom: 12 }}>Connect your email provider in settings and activate to start sending.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/gtm/settings" style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: s.yellow, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Connect tools →</Link>
            </div>
          </div>
        )}

        {/* Canvas preview placeholder */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: s.muted }}>Campaign canvas</div>
          <div style={{ background: '#0a0a0c', borderRadius: 8, padding: '24px', textAlign: 'center', color: s.dim, fontSize: 13 }}>
            {campaign.canvas ? (
              <div>
                {campaign.canvas.nodes?.length || 0} nodes · {campaign.canvas.edges?.length || 0} connections
                <div style={{ marginTop: 8 }}><Link href={`/gtm/campaigns/${id}/canvas`} style={{ color: s.violet, textDecoration: 'none', fontWeight: 700 }}>Open canvas editor →</Link></div>
              </div>
            ) : (
              <div>No canvas built yet. <Link href="/gtm/campaigns/new" style={{ color: s.sky, textDecoration: 'none' }}>Create one →</Link></div>
            )}
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

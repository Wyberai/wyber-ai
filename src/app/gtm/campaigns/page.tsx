import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', orange: '#f97316', green: '#10b981', yellow: '#f59e0b',
}

const STATUS_COLORS: Record<string, string> = {
  draft: s.muted, active: s.green, paused: s.yellow, completed: '#8b5cf6',
}

export default async function CampaignsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaigns } = user ? await supabase
    .from('gtm_campaigns')
    .select('id, name, status, stats, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) : { data: [] }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm/campaigns/new" style={{ padding: '8px 16px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>+ New campaign</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>Campaigns</h1>

        {(!campaigns || campaigns.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: s.card, borderRadius: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No campaigns yet</div>
            <div style={{ fontSize: 14, color: s.muted, marginBottom: 24 }}>Build your first campaign on the visual canvas</div>
            <Link href="/gtm/campaigns/new" style={{ padding: '12px 24px', borderRadius: 10, background: s.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Create campaign →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campaigns.map((c: any) => {
              const stats = c.stats || {}
              const color = STATUS_COLORS[c.status] || s.muted
              return (
                <Link key={c.id} href={`/gtm/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.text, marginBottom: 4 }}>{c.name}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: s.muted }}>
                        <span>📤 {stats.emails_sent || 0} sent</span>
                        <span>👁 {stats.opens || 0} opens</span>
                        <span>💬 {stats.replies || 0} replies</span>
                        <span>📞 {stats.calls || 0} calls</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: color + '15', border: `1px solid ${color}30`, color }}>{c.status}</div>
                    <div style={{ fontSize: 12, color: s.muted }}>{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

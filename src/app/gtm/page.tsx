import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GTMDashboardClient from './GTMDashboardClient'

export const metadata = { title: 'GTM Engine — WyberAi', description: 'Define your ICP. Wyber finds matching leads, enriches them, and launches outreach sequences automatically.' }

export default async function GTMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px,8vw,80px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28 }}>
          🎯 GTM Engine
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20, maxWidth: 700 }}>
          Define your ICP.<br />
          <span style={{ background: 'linear-gradient(135deg, #10b981, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Wyber fills your pipeline.
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: '#71717a', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 40px' }}>
          Describe who you sell to. Wyber finds matching leads via Apollo, enriches them with verified emails and buying signals, and runs multi-step email, call, and LinkedIn sequences — all from a visual canvas.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <Link href="/signup" style={{ padding: '13px 28px', borderRadius: 10, background: '#10b981', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
            Start for free →
          </Link>
          <Link href="/login" style={{ padding: '13px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, maxWidth: 680, width: '100%' }}>
          {[
            { icon: '🎯', title: 'ICP-driven discovery', body: 'Describe your ideal customer. We search Apollo's 270M+ contact database.' },
            { icon: '✉️', title: 'Multi-step sequences', body: '10 battle-tested outreach templates across email, call, and LinkedIn.' },
            { icon: '🗺️', title: 'Visual campaign canvas', body: 'Drag, connect, and launch campaigns from a no-code flow builder.' },
            { icon: '📊', title: 'Live analytics', body: 'Open rates, reply rates, and pipeline value updated in real time.' },
          ].map(f => (
            <div key={f.title} style={{ padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const [profileRes, campaignsRes, leadsRes] = await Promise.all([
    supabase.from('gtm_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('gtm_campaigns').select('id,name,status,type,stats,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('gtm_leads').select('id,status', { count: 'exact', head: false }).eq('user_id', user.id).limit(1),
  ])

  return (
    <GTMDashboardClient
      user={user}
      profile={profileRes.data}
      campaigns={campaignsRes.data || []}
      totalLeads={leadsRes.count || 0}
    />
  )
}

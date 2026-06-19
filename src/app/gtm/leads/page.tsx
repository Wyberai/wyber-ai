import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9',
}

const STATUS_COLORS: Record<string, string> = {
  new: s.sky, contacted: s.yellow, replied: s.green, meeting: '#8b5cf6',
  disqualified: '#ef4444', suppressed: s.dim,
}

export default async function LeadsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leads, count } = user ? await supabase
    .from('gtm_leads')
    .select('id, first_name, last_name, email, company_name, title, status, icp_score, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('icp_score', { ascending: false })
    .limit(50) : { data: [], count: 0 }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/gtm/leads/import" style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: s.sky, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Import leads</Link>
          <Link href="/gtm" style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, fontSize: 13, textDecoration: 'none' }}>← GTM</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,60px) clamp(16px,4vw,48px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Leads</h1>
            <div style={{ fontSize: 13, color: s.muted }}>{count || 0} contacts total</div>
          </div>
        </div>

        {(!leads || leads.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: s.card, borderRadius: 16, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No leads yet</div>
            <div style={{ fontSize: 14, color: s.muted, marginBottom: 24 }}>Import from Apollo or upload a CSV to get started</div>
            <Link href="/gtm/leads/import" style={{ padding: '12px 24px', borderRadius: 10, background: s.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Import leads →</Link>
          </div>
        ) : (
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  {['Name', 'Company', 'Title', 'Status', 'ICP Score', 'Added'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any, i: number) => {
                  const color = STATUS_COLORS[lead.status] || s.muted
                  const score = lead.icp_score || 0
                  const scoreColor = score >= 80 ? s.green : score >= 60 ? s.yellow : s.muted
                  return (
                    <tr key={lead.id} style={{ borderBottom: i < leads.length - 1 ? `1px solid ${s.border}` : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: s.text }}>{lead.first_name} {lead.last_name}<div style={{ fontSize: 11, color: s.muted, fontWeight: 400 }}>{lead.email}</div></td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: s.muted }}>{lead.company_name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: s.muted }}>{lead.title || '—'}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: color + '15', border: `1px solid ${color}30`, color }}>{lead.status || 'new'}</span></td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: scoreColor }}>{score > 0 ? score : '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: s.dim }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}

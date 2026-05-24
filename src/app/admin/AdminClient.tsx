'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

interface AdminData {
  totalUsers: number;
  totalProjects: number;
  totalGenerations: number;
  recentUsers: any[];
  recentProjects: any[];
  planBreakdown: Record<string, number>;
}

export function AdminClient({ data }: { data: AdminData }) {
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<'overview' | 'users' | 'projects'>('overview');

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: 'var(--sky)' },
    { label: 'Total Projects', value: data.totalProjects, icon: '⚡', color: 'var(--green)' },
    { label: 'Total Generations', value: data.totalGenerations, icon: '◎', color: 'var(--amber)' },
    { label: 'Free Users', value: data.planBreakdown['free'] ?? 0, icon: '○', color: 'var(--text3)' },
    { label: 'Starter Users', value: data.planBreakdown['starter'] ?? 0, icon: '◆', color: 'var(--sky)' },
    { label: 'Pro Users', value: data.planBreakdown['pro'] ?? 0, icon: '★', color: 'var(--green)' },
    { label: 'Teams Users', value: data.planBreakdown['teams'] ?? 0, icon: '⬡', color: 'var(--amber)' },
    { label: 'Est. MRR', value: `$${((data.planBreakdown['starter'] ?? 0) * 15 + (data.planBreakdown['pro'] ?? 0) * 39 + (data.planBreakdown['teams'] ?? 0) * 79).toLocaleString()}`, icon: '💰', color: 'var(--green)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 32px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <WyberLogo size={26} />
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.04em', color: 'var(--text)' }}>Wyber<span style={{ color: 'var(--sky)' }}>AI</span></span>
          </Link>
          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: 'var(--red)', fontWeight: 700, border: '1px solid rgba(239,68,68,0.2)' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)' }}>← Back to Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 6px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>SignalPulse Technologies · Wyber AI</p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 36 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.04em', color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {(['overview', 'users', 'projects'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === t ? 'var(--sky)' : 'var(--text3)', borderBottom: `2px solid ${tab === t ? 'var(--sky)' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Recent users */}
        {(tab === 'overview' || tab === 'users') && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Recent Signups</h2>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                    {['Email', 'Plan', 'Credits', 'Signed Up'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < data.recentUsers.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{u.email}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: u.plan === 'pro' ? 'rgba(5,150,105,0.1)' : u.plan === 'starter' ? 'rgba(14,165,233,0.1)' : u.plan === 'teams' ? 'rgba(245,158,11,0.1)' : 'var(--bg2)', color: u.plan === 'pro' ? 'var(--green)' : u.plan === 'starter' ? 'var(--sky)' : u.plan === 'teams' ? 'var(--amber)' : 'var(--text3)', fontWeight: 600, textTransform: 'capitalize', border: '1px solid var(--border)' }}>
                          {u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.credits}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)' }}>
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recentUsers.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No users yet</div>
              )}
            </div>
          </div>
        )}

        {/* Recent projects */}
        {(tab === 'overview' || tab === 'projects') && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Recent Projects</h2>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                    {['Project', 'Framework', 'Status', 'Created'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentProjects.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < data.recentProjects.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: 'var(--sky)', fontWeight: 600, border: '1px solid rgba(14,165,233,0.15)' }}>
                          {p.framework}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {p.deployed_url ? (
                          <a href={p.deployed_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(5,150,105,0.1)', color: 'var(--green)', fontWeight: 600, border: '1px solid rgba(5,150,105,0.2)', textDecoration: 'none' }}>● Live</a>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Draft</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recentProjects.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No projects yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

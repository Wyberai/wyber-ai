'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { WyberLogo } from '@/components/shared/WyberLogo';

interface AdminData {
  totalUsers: number;
  totalProjects: number;
  totalGenerations: number;
  totalFlows: number;
  waitlistCount: number;
  totalMcpProjects: number;
  recentMcpProjects: any[];
  todaySignups: number;
  totalCreditsBurned: number;
  totalCreditsInSystem: number;
  estimatedMRR: number;
  recentUsers: any[];
  allProfiles: any[];
  recentProjects: any[];
  recentFlows: any[];
  waitlistEmails: any[];
  creditUsage: any[];
  planBreakdown: Record<string, number>;
  genByDay: Record<string, number>;
}

type Tab = 'overview' | 'users' | 'projects' | 'flows' | 'credits' | 'waitlist';

const SKY = '#0EA5E9';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const PURPLE = '#a855f7';

function StatCard({ label, value, sub, color = SKY, icon }: { label: string; value: string | number; sub?: string; color?: string; icon: string }) {
  return (
    <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#52525b', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#3f3f46' }}>{sub}</div>}
    </div>
  );
}

function Badge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pro:      { label: 'Builder', bg: 'rgba(14,165,233,0.12)', color: SKY },
    business: { label: 'Team',    bg: 'rgba(34,197,94,0.12)',  color: GREEN },
    free:     { label: 'Free',    bg: 'rgba(82,82,91,0.15)',   color: '#71717a' },
  };
  const s = map[plan] ?? map.free;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  );
}

function Table({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ background: '#0d0d11', border: '1px solid #1e1e26', borderRadius: 14, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e1e26', background: '#111115' }}>
            {cols.map(h => (
              <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} style={{ padding: 40, textAlign: 'center', color: '#3f3f46', fontSize: 13 }}>No data yet</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #1a1a22' : 'none' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 16px', fontSize: 13, color: '#a1a1aa', verticalAlign: 'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#1e1e26', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: '#52525b', width: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function AdminClient({ data }: { data: AdminData }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!search) return data.recentUsers;
    const q = search.toLowerCase();
    return data.recentUsers.filter(u => u.email?.toLowerCase().includes(q));
  }, [search, data.recentUsers]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'users',     label: 'Users',    count: data.totalUsers },
    { id: 'projects',  label: 'Projects', count: data.totalProjects },
    { id: 'flows',     label: 'Flows',    count: data.totalFlows },
    { id: 'credits',   label: 'Credits' },
    { id: 'waitlist',  label: 'Waitlist', count: data.waitlistCount },
  ];

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const maxGen = Math.max(...Object.values(data.genByDay), 1);
  const dayEntries = Object.entries(data.genByDay).slice(-7);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <WyberLogo markSize={24} wordmarkSize={14} />
          </Link>
          <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: RED, fontWeight: 700, letterSpacing: '0.06em', border: '1px solid rgba(239,68,68,0.2)' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/admin/challenge" style={{ fontSize: 12, color: SKY, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.3)' }}>🏆 Challenge</Link>
          <Link href="/admin/community" style={{ fontSize: 12, color: SKY, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.3)' }}>🎁 Rewards</Link>
          <Link href="/admin/marketplace" style={{ fontSize: 12, color: SKY, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.3)' }}>🛍 Marketplace</Link>
          <Link href="/admin/consultations" style={{ fontSize: 12, color: SKY, textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.3)' }}>📞 Consultations</Link>
          <Link href="/dashboard" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid #1e1e26' }}>← Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 4px' }}>Command Center</h1>
          <p style={{ color: '#3f3f46', fontSize: 13, margin: 0 }}>WyberAi · SignalPulse Technologies · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 32 }}>
          <StatCard label="Total Users"       value={fmt(data.totalUsers)}       icon="👥" color={SKY}    sub={`+${data.todaySignups} today`} />
          <StatCard label="Est. MRR"          value={`$${data.estimatedMRR.toFixed(0)}`} icon="💰" color={GREEN}  sub="Builder + Team plans" />
          <StatCard label="Builder Plans"     value={data.planBreakdown['pro'] ?? 0}      icon="⚡" color={SKY}    sub={`${data.planBreakdown['business'] ?? 0} Team`} />
          <StatCard label="Total Projects"    value={fmt(data.totalProjects)}    icon="🗂️" color={AMBER}  />
          <StatCard label="Total Flows"       value={fmt(data.totalFlows)}       icon="🔀" color={PURPLE} />
          <StatCard label="Generations"       value={fmt(data.totalGenerations)} icon="✨" color={SKY}    />
          <StatCard label="Credits Burned"    value={fmt(data.totalCreditsBurned)} icon="🔥" color={RED}  sub="all time" />
          <StatCard label="AI Emp. Waitlist"  value={data.waitlistCount}         icon="🤖" color={PURPLE} sub="early access" />
          <StatCard label="Built via MCP"     value={data.totalMcpProjects}      icon="⚡" color={SKY}    sub="Claude connector" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #1a1a22', marginBottom: 28 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.id ? SKY : '#52525b', borderBottom: `2px solid ${tab === t.id ? SKY : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.label}
              {t.count !== undefined && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: tab === t.id ? 'rgba(14,165,233,0.15)' : '#1a1a22', color: tab === t.id ? SKY : '#52525b', fontWeight: 700 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Plan breakdown */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Plan breakdown</h2>
              <div style={{ background: '#0d0d11', border: '1px solid #1e1e26', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Free',    key: 'free',     color: '#52525b' },
                  { label: 'Builder', key: 'pro',      color: SKY },
                  { label: 'Team',    key: 'business', color: GREEN },
                ].map(({ label, key, color }) => {
                  const v = data.planBreakdown[key] ?? 0;
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#a1a1aa' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{v}</span>
                      </div>
                      <MiniBar value={v} max={data.totalUsers} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generations last 7 days */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Generations — last 7 days</h2>
              <div style={{ background: '#0d0d11', border: '1px solid #1e1e26', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dayEntries.length === 0 ? (
                  <div style={{ color: '#3f3f46', fontSize: 13 }}>No data yet</div>
                ) : dayEntries.map(([day, count]) => (
                  <div key={day}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#52525b' }}>{day}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: SKY }}>{count}</span>
                    </div>
                    <MiniBar value={count} max={maxGen} color={SKY} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Recent signups</h2>
              <Table
                cols={['Email', 'Plan', 'Credits', 'Joined']}
                rows={data.recentUsers.slice(0, 10).map(u => [
                  <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{u.email}</span>,
                  <Badge plan={u.plan ?? 'free'} />,
                  <span style={{ color: u.credits < 3 ? RED : '#a1a1aa' }}>{u.credits}</span>,
                  <span style={{ color: '#52525b' }}>{fmtDate(u.created_at)}</span>,
                ])}
              />
            </div>

            {/* Recent MCP builds */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Recent builds via Claude MCP
                <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(14,165,233,0.15)', color: SKY, fontWeight: 700 }}>{data.totalMcpProjects}</span>
              </h2>
              <Table
                cols={['Project', 'Framework', 'Created']}
                rows={data.recentMcpProjects.slice(0, 8).map(p => [
                  <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{p.name || 'Untitled'}</span>,
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: SKY, fontWeight: 600 }}>{p.framework}</span>,
                  <span style={{ color: '#52525b' }}>{fmtTime(p.created_at)}</span>,
                ])}
              />
            </div>

            {/* Recent credit usage */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Recent credit burns</h2>
              <Table
                cols={['User ID', 'Credits', 'Reason', 'When']}
                rows={data.creditUsage.slice(0, 8).map(c => [
                  <span style={{ color: '#52525b', fontFamily: 'monospace', fontSize: 11 }}>{c.user_id?.slice(0, 16)}…</span>,
                  <span style={{ color: RED, fontWeight: 700 }}>−{c.amount}</span>,
                  <span style={{ color: '#71717a' }}>{c.reason ?? '—'}</span>,
                  <span style={{ color: '#3f3f46' }}>{fmtTime(c.created_at)}</span>,
                ])}
              />
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>All users ({data.recentUsers.length} shown)</h2>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by email…"
                style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#e4e4e7', outline: 'none', width: 240, fontFamily: 'inherit' }}
              />
            </div>
            <Table
              cols={['Email', 'Plan', 'Credits', 'Joined']}
              rows={filteredUsers.map(u => [
                <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{u.email}</span>,
                <Badge plan={u.plan ?? 'free'} />,
                <span style={{ color: u.credits < 3 ? RED : u.credits > 50 ? GREEN : '#a1a1aa', fontWeight: 600 }}>{u.credits}</span>,
                <span style={{ color: '#52525b' }}>{fmtDate(u.created_at)}</span>,
              ])}
            />
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === 'projects' && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>Recent projects</h2>
            <Table
              cols={['Name', 'Type', 'Framework', 'Source', 'Status', 'Created']}
              rows={data.recentProjects.map(p => {
                const via = p.created_via || 'web';
                const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
                  mcp:      { label: '⚡ MCP',      bg: 'rgba(14,165,233,0.12)', color: SKY },
                  template: { label: '📋 Template', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
                  clone:    { label: '🔁 Clone',    bg: 'rgba(245,158,11,0.12)', color: AMBER },
                  import:   { label: '📥 Import',   bg: 'rgba(34,197,94,0.12)',  color: GREEN },
                  api:      { label: '🔌 API',      bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
                  web:      { label: '🌐 Web',      bg: 'rgba(255,255,255,0.05)', color: '#71717a' },
                };
                const TYPE_ICON: Record<string, string> = {
                  webapp: '🌐 Web app', mobile: '📱 Mobile', website: '🖥️ Website', saas: '☁️ SaaS',
                };
                const badge = SOURCE_BADGE[via] ?? { label: via, bg: 'rgba(255,255,255,0.05)', color: '#71717a' };
                return [
                  <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{p.name || 'Untitled'}</span>,
                  <span style={{ fontSize: 11, color: '#a1a1aa' }}>{TYPE_ICON[p.project_type] ?? p.project_type ?? '—'}</span>,
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: SKY, fontWeight: 600 }}>{p.framework}</span>,
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 600 }}>{badge.label}</span>,
                  p.deployed_url
                    ? <a href={p.deployed_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: GREEN, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>● Live ↗</a>
                    : <span style={{ color: '#3f3f46', fontSize: 12 }}>Draft</span>,
                  <span style={{ color: '#52525b' }}>{fmtDate(p.created_at)}</span>,
                ];
              })}
            />
          </div>
        )}

        {/* ── FLOWS ── */}
        {tab === 'flows' && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>Recent flows</h2>
            <Table
              cols={['Name', 'Runs', 'Last run', 'Created']}
              rows={data.recentFlows.map(f => [
                <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{f.name || 'Untitled flow'}</span>,
                <span style={{ color: f.run_count > 0 ? AMBER : '#3f3f46', fontWeight: 600 }}>{f.run_count ?? 0}</span>,
                <span style={{ color: '#52525b' }}>{f.last_run_at ? fmtTime(f.last_run_at) : '—'}</span>,
                <span style={{ color: '#52525b' }}>{fmtDate(f.created_at)}</span>,
              ])}
            />
          </div>
        )}

        {/* ── CREDITS ── */}
        {tab === 'credits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <StatCard label="Total burned"    value={fmt(data.totalCreditsBurned)}    icon="🔥" color={RED}   sub="all time" />
              <StatCard label="Credits in wallets" value={fmt(data.totalCreditsInSystem)} icon="💳" color={AMBER} sub="across all users" />
              <StatCard label="Burn events"     value={data.creditUsage.length}          icon="📊" color={SKY}  sub="last 50 shown" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>Credit burn log</h2>
              <Table
                cols={['User', 'Amount', 'Reason', 'When']}
                rows={data.creditUsage.map(c => [
                  <span style={{ color: '#52525b', fontFamily: 'monospace', fontSize: 11 }}>{c.user_id?.slice(0, 20)}…</span>,
                  <span style={{ color: RED, fontWeight: 700 }}>−{c.amount}</span>,
                  <span style={{ color: '#71717a', fontSize: 12 }}>{c.reason ?? '—'}</span>,
                  <span style={{ color: '#3f3f46', fontSize: 12 }}>{fmtTime(c.created_at)}</span>,
                ])}
              />
            </div>
          </div>
        )}

        {/* ── WAITLIST ── */}
        {tab === 'waitlist' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>AI Employees waitlist — {data.waitlistCount} total</h2>
              <span style={{ fontSize: 12, color: '#52525b' }}>Showing latest {data.waitlistEmails.length}</span>
            </div>
            <Table
              cols={['Email', 'Joined']}
              rows={data.waitlistEmails.map(w => [
                <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{w.email}</span>,
                <span style={{ color: '#52525b' }}>{fmtTime(w.created_at)}</span>,
              ])}
            />
          </div>
        )}

      </div>
    </div>
  );
}

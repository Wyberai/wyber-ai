'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project, PLAN_LIMITS } from '@/lib/supabase/types';
import Link from 'next/link';
import { ReferralCard } from '@/components/shared/ReferralCard';

interface Props { profile: Profile | null; projects: Partial<Project>[]; }

function WyberLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

const QUICK_PROMPTS = [
  'Build a SaaS analytics dashboard with MRR, churn rate, and customer health scores',
  'Build a CRM with lead pipeline, email sequences, and deal forecasting',
  'Build a VC portfolio management platform with fund analytics and deal tracking',
  'Build an HR platform with onboarding tracker, org chart, and performance reviews',
  'Build a customer support hub with ticket queue, SLA tracking, and escalations',
  'Build a revenue operations dashboard with pipeline scoring and forecast analytics',
];

export function DashboardClient({ profile, projects: initialProjects }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Auto-clone if ?clone=projectId in URL
  useEffect(() => {
    const cloneId = searchParams?.get('clone');
    if (!cloneId || !profile?.id) return;
    fetch('/api/projects/duplicate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ projectId: cloneId, userId: profile.id })
    }).then(r => r.json()).then(data => {
      if (data.project?.id) window.location.href = '/project/' + data.project.id;
    });
  }, [searchParams, profile?.id]);
    const [renamingId, setRenamingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'apps' | 'agents' | 'automations'>('apps');

  const handleClone = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); e.stopPropagation();
    const res = await fetch('/api/projects/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, userId: profile?.id })
    });
    const data = await res.json();
    if (data.project?.id) {
      window.location.href = '/project/' + data.project.id;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ projectId: id, userId: profile?.id })
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Delete failed:', err.error || res.status);
      }
    } catch(err) { console.error('Delete failed', err); }
    finally { setDeletingId(null); }
  };

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) { setRenamingId(null); return; }
    await fetch('/api/projects', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ projectId: id, name: name.trim(), userId: profile?.id }) });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
    setRenamingId(null);
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setDuplicatingId(id);
    const res = await fetch('/api/projects/duplicate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ projectId: id, userId: profile?.id }) });
    const data = await res.json();
    if (data?.project) setProjects(prev => [data.project, ...prev]);
    setDuplicatingId(null);
  };
  const [promptInput, setPromptInput] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? 'free';
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'there';
  const totalCredits = plan === 'starter' ? 500 : plan === 'pro' ? 2000 : plan === 'teams' ? 99999 : 50;
  const creditPct = Math.min(100, (credits / totalCredits) * 100);

  const startProject = async (prompt?: string) => {
    if (!profile?.id || creating) return;
    setCreating(true);
    try {
      const projectName = prompt
        ? prompt.slice(0, 40).trim()
        : 'New Project ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const { data, error } = await supabase
        .from('projects')
        .insert({ name: projectName, framework: 'react-vite', user_id: profile.id, initial_prompt: prompt || '' })
        .select('id');

      if (error) throw error;
      if (data?.[0]?.id) {
        if (prompt) sessionStorage.setItem(`wyber_prompt_${data[0].id}`, prompt);
        router.push(`/project/${data[0].id}`);
      }
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startProject(promptInput.trim() || undefined);
    }
  };

  const NAV = [
    { label: 'Home', href: '/dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
    { label: 'Projects', href: '/dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { label: 'Templates', href: '/templates', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { label: 'Community', href: '/community', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: 'Connectors', href: '/connectors', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg> },
    { label: 'Settings', href: '/settings', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, height: '100vh', background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0 }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <WyberLogo size={26} />
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em' }}>Wyber AI</div>
            </div>
          </div>
        </div>

        {/* User workspace */}
        <button onClick={() => setSidebarExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', border: 'none', background: 'transparent', color: '#fafafa', cursor: 'pointer', width: '100%', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #0EA5E9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{plan} plan</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" style={{ transform: sidebarExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
        </button>

        {/* Expanded workspace info */}
        {sidebarExpanded && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8 }}>Credits</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{credits} left</span>
              <Link href="/settings?tab=billing" style={{ fontSize: 11, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Add credits</Link>
            </div>
            <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', borderRadius: 9999, background: creditPct < 20 ? '#ef4444' : '#0EA5E9', width: creditPct + '%', transition: 'width 0.5s ease' }} />
            </div>
            {credits < 10 && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>Low on credits — upgrade to continue building</div>}
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '8px 8px', flex: 1, overflow: 'auto' }}>
          {NAV.map(n => (
            <Link key={n.label} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, color: '#a1a1aa', fontSize: 13, fontWeight: 400, textDecoration: 'none', marginBottom: 1, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
              {n.icon}{n.label}
            </Link>
          ))}

          {/* Recents */}
          {projects.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 5px' }}>Recent</div>
            {projects.slice(0, 4).map(p => (
              <Link key={p.id} href={`/project/${p.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, color: '#71717a', fontSize: 12, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#71717a' }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: '#0EA5E9', flexShrink: 0 }} />
                {p.name || 'Untitled'}
              </Link>
            ))}
          </>}
        </nav>

        <ReferralCard />
        {/* Upgrade CTA */}
        {plan === 'free' && (
          <div style={{ padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.1)'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0EA5E9"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9' }}>Upgrade to Pro</div>
                <div style={{ fontSize: 10, color: '#52525b' }}>2000 credits/month</div>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Hero with gradient */}
        <div style={{ position: 'relative', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflow: 'hidden' }}>
          {/* Animated mesh gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(14,165,233,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(139,92,246,0.2) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 0%, rgba(16,185,129,0.1) 0%, transparent 70%)', animation: 'gradientShift 8s ease infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          {/* Connector pill */}
          <Link href="/connectors" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 20, backdropFilter: 'blur(10px)', zIndex: 1, transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>
            Power your app with connectors →
          </Link>

          {/* Greeting */}
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 24, zIndex: 1, position: 'relative' }}>
            What are we building, {name.split(' ')[0]}?
          </h1>

          {/* Prompt box */}
          <div style={{ width: '100%', maxWidth: 640, zIndex: 1, position: 'relative' }}>
            <div style={{ background: 'rgba(17,17,19,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
              <textarea
                ref={textareaRef}
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the app you want to build..."
                rows={3}
                style={{ width: '100%', padding: '16px 18px 12px', border: 'none', background: 'transparent', color: '#fafafa', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.55 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 14px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Image attach */}
                  <button style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#52525b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Attach image">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#3f3f46' }}>↵ Enter to build</span>
                  <button
                    onClick={() => startProject(promptInput.trim() || undefined)}
                    disabled={creating}
                    style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: creating ? '#27272a' : '#0EA5E9', color: '#fff', cursor: creating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !creating ? '0 4px 16px rgba(14,165,233,0.35)' : 'none', transition: 'all 0.15s' }}>
                    {creating
                      ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Quick prompts */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {QUICK_PROMPTS.slice(0, 4).map(p => (
                <button key={p} onClick={() => { setPromptInput(p); textareaRef.current?.focus() }}
                  style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#71717a', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', backdropFilter: 'blur(10px)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fafafa'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#71717a'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  {p.replace('Build a ', '').replace('Create a ', '').replace('Create an ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ padding: '16px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4 }}>
          {[
            { id: 'apps' as const, label: '⚡ Apps' },
            { id: 'agents' as const, label: '🤖 Agents' },
            { id: 'automations' as const, label: '🔀 Automations' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #0EA5E9' : '2px solid transparent', background: activeTab === tab.id ? 'rgba(14,165,233,0.08)' : 'transparent', color: activeTab === tab.id ? '#0EA5E9' : '#52525b', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {activeTab === 'agents' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>AI Agent Library</h2>
                  <div style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>5,000+ agents ready to deploy across 18 industries</div>
                </div>
                <a href="/agents" style={{ padding: '8px 18px', borderRadius: 8, background: '#0EA5E9', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Browse all agents →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {[
                  { id: 'WYBER-001', name: 'Revenue Operations Command', cat: 'Sales & Revenue', desc: 'CRM chaos, missed follow-ups, unreliable forecasts', complexity: 'Enterprise' },
                  { id: 'WYBER-002', name: 'Inbound Lead Response Agent', cat: 'Sales & Revenue', desc: 'Slow response to inbound leads', complexity: 'Growth' },
                  { id: 'WYBER-013', name: 'Customer Health Monitor', cat: 'Customer Support', desc: 'Churn risk invisible until too late', complexity: 'Growth' },
                  { id: 'WYBER-025', name: 'Invoice Processing Agent', cat: 'Finance', desc: 'Manual invoice entry wastes hours', complexity: 'Growth' },
                  { id: 'WYBER-031', name: 'Content Calendar Manager', cat: 'Marketing', desc: 'Content planning scattered and reactive', complexity: 'Enterprise' },
                  { id: 'WYBER-050', name: 'Employee Onboarding Agent', cat: 'HR & People', desc: 'Inconsistent onboarding wastes new hire time', complexity: 'Growth' },
                ].map(agent => (
                  <div key={agent.id} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🤖</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                        <div style={{ fontSize: 10, color: '#0EA5E9', fontWeight: 600 }}>{agent.id} · {agent.cat}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8b8b9a', marginBottom: 12, lineHeight: 1.5 }}>{agent.desc}</div>
                    <a href={'/agent/' + agent.id} style={{ display: 'block', textAlign: 'center', padding: '6px 0', borderRadius: 6, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.06)', color: '#0EA5E9', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Configure →</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'automations' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>Automations</h2>
                  <div style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>Visual flow builder — triggers, AI steps, actions</div>
                </div>
                <a href="/flows" style={{ padding: '8px 18px', borderRadius: 8, background: '#0EA5E9', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Open Flow Builder →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: '⚡', title: 'Trigger → AI → Action', desc: 'New lead scores high? Claude decides → Slack alert fires automatically' },
                  { icon: '📅', title: 'Scheduled workflows', desc: 'Run every morning at 7AM, weekly on Monday, or any cron schedule' },
                  { icon: '🔗', title: '12+ integrations', desc: 'Slack, Gmail, HubSpot, Airtable, Notion, GitHub and more' },
                ].map(card => (
                  <div key={card.title} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>{card.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', padding: 20, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 12 }}>
                <a href="/flows" style={{ fontSize: 15, fontWeight: 700, color: '#0EA5E9', textDecoration: 'none' }}>→ Open the Visual Flow Builder</a>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Drag nodes, connect steps, run automations with real tools</div>
              </div>
            </div>
          )}

          {activeTab === 'apps' && projects.length > 0 ? <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>My Apps</h2>
              <Link href="/dashboard/projects" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fafafa'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#52525b'}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {/* New project card */}
              <button onClick={() => startProject()} disabled={creating}
                style={{ height: 160, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.08)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', color: '#3f3f46' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; (e.currentTarget as HTMLElement).style.color = '#0EA5E9'; (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#3f3f46'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>New Project</span>
              </button>

              {projects.slice(0, 7).map(p => (
                <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ height: 160, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: '#111113', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    {/* Thumbnail - real screenshot or gradient */}
                    {/* Action buttons */}
                    {p.id && <>
                      <button onClick={e => handleDelete(e, p.id!)} disabled={deletingId === p.id}
                        title='Delete project'
                        style={{ position:'absolute', top:6, right:6, zIndex:10, width:22, height:22, borderRadius:5, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(9,9,11,0.7)', color:'#71717a', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, backdropFilter:'blur(4px)' }}>
                        {deletingId===p.id ? '…' : '×'}
                      </button>
                      <button onClick={e => handleDuplicate(e, p.id!)} disabled={duplicatingId===p.id}
                        title="Duplicate"
                        style={{ position:'absolute', top:6, right:32, zIndex:10, width:22, height:22, borderRadius:5, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(9,9,11,0.7)', color:'#71717a', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, backdropFilter:'blur(4px)' }}>
                        {duplicatingId===p.id ? '…' : '⎘'}
                      </button>
                    </>}
                    <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${['#0EA5E9','#8b5cf6','#10b981','#f59e0b','#ef4444'][Math.abs((p.name?.charCodeAt(0) ?? 0) % 5)]}18, rgba(9,9,11,0.8))` }}>
                      {(p as any).thumbnail_url
                        ? <img src={(p as any).thumbnail_url} alt={p.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${['#0EA5E9','#8b5cf6','#10b981','#f59e0b','#ef4444'][Math.abs((p.name?.charCodeAt(0) ?? 0) % 5)]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                              {p.framework === 'next' ? '▲' : p.framework === 'vue' ? '◆' : p.framework === 'vanilla' ? '⊡' : '⚛'}
                            </div>
                          </div>
                      }
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                      {renamingId === p.id && p.id ? (
                        <input autoFocus defaultValue={p.name||''} onBlur={e=>handleRename(p.id!,e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleRename(p.id!,(e.target as HTMLInputElement).value);if(e.key==='Escape')setRenamingId(null);}} onClick={e=>e.preventDefault()} style={{fontSize:12,fontWeight:600,color:'#fafafa',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(14,165,233,0.5)',borderRadius:4,padding:'1px 5px',width:'100%',outline:'none',fontFamily:'inherit'}} />
                      ) : (
                        <div onDoubleClick={e=>{e.preventDefault();e.stopPropagation();if(p.id)setRenamingId(p.id);}} title="Double-click to rename" style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name || 'Untitled'}</div>
                      )}
                      <div style={{ fontSize: 10, color: '#52525b' }}>{p.framework || 'react'} · {p.updated_at ? new Date(p.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'New'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </> : (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#52525b' }}>
              <div style={{ fontSize: 14 }}>No projects yet — describe your first app above</div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes gradientShift {
          0%,100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
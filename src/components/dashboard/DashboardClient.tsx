'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project, PLAN_LIMITS } from '@/lib/supabase/types';
import Link from 'next/link';

const FRAMEWORKS = [
  { id: 'next', label: 'Next.js', desc: 'SEO-ready, server-side rendering. Best for production SaaS.', tag: 'Recommended', color: '#0EA5E9' },
  { id: 'react-vite', label: 'React', desc: 'Fast single-page apps. Best for dashboards and tools.', tag: null, color: '#61DAFB' },
  { id: 'vue', label: 'Vue 3', desc: 'Component-first. Best for interactive UI-heavy apps.', tag: null, color: '#42B883' },
  { id: 'vanilla', label: 'Vanilla JS', desc: 'No framework. Best for landing pages and prototypes.', tag: null, color: '#F7DF1E' },
];

interface Props { profile: Profile | null; projects: Partial<Project>[]; }

export function DashboardClient({ profile, projects: initialProjects }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingFramework, setPendingFramework] = useState('next');
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const credits = profile?.credits ?? 0;
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;

  const handleFrameworkClick = (fwId: string) => {
    setPendingFramework(fwId);
    setNewName('');
    setCreateError('');
    setShowNameModal(true);
  };

  const createProject = async () => {
    if (!newName.trim() || !profile?.id) {
      setCreateError(!profile?.id ? 'Session expired. Please refresh.' : 'Enter a project name.');
      return;
    }
    setCreating(pendingFramework);
    setCreateError('');
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: newName.trim(), framework: pendingFramework, user_id: profile.id })
        .select('id');
      if (error) throw new Error(error.message + ' (code: ' + error.code + ')');
      if (data && data.length > 0) {
        router.push(`/project/${data[0].id}`);
        return;
      }
      throw new Error('Project created but ID not returned. Check Supabase RLS SELECT policy.');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err));
    }
    setCreating(null);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(p => p.filter(proj => proj.id !== id));
  };

  const importZip = async (file: File) => {
    setImporting(true); setImportStatus('Reading ZIP...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.zip', ''));
    try {
      const res = await fetch('/api/projects/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.project) {
        setImportStatus('Imported');
        setTimeout(() => router.push(`/project/${data.project.id}`), 600);
      } else { setImportStatus(data.error ?? 'Import failed'); }
    } catch { setImportStatus('Import failed'); }
    setImporting(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  const FW_LABELS: Record<string, string> = { 'react-vite': 'React', 'vue': 'Vue', 'vanilla': 'JS', 'next': 'Next.js' };
  const FW_COLORS: Record<string, string> = { 'react-vite': '#61DAFB', 'vue': '#42B883', 'vanilla': '#F7DF1E', 'next': '#0EA5E9' };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? 220 : 52, flexShrink: 0, borderRight: '1px solid var(--ide-border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden' }}>

        {/* Logo + toggle */}
        <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0 }}>
          {sidebarOpen && (
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
                <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Wyber<span style={{ color: '#0EA5E9' }}>AI</span></span>
            </Link>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
            {sidebarOpen ? '◁' : '▷'}
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {[
            { icon: '⌂', label: 'Home', href: '/dashboard', active: true },
            { icon: '⊞', label: 'Templates', href: '/templates', active: false },
            { icon: '⚿', label: 'Connectors', href: '/connectors', active: false },
            { icon: '◎', label: 'API Keys', href: '/api-keys', active: false },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: item.active ? 'var(--accent-glow)' : 'transparent', color: item.active ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontWeight: item.active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          {sidebarOpen && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>Resources</div>}
          {[
            { icon: '📖', label: 'Changelog', href: '/changelog' },
            { icon: '💬', label: 'Community', href: '/community' },
            { icon: '🔒', label: 'Security', href: '/security' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--ide-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {profile?.email?.charAt(0).toUpperCase() ?? 'W'}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{plan} plan</div>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 2, flexShrink: 0 }} title="Sign out">↩</button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ height: 54, borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Dashboard</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) importZip(f); e.target.value = ''; }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn" style={{ fontSize: 12 }}>
              {importing ? importStatus : 'Import ZIP'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: credits > 10 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${credits > 10 ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: credits > 10 ? 'var(--green)' : 'var(--red)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: credits > 10 ? 'var(--green)' : 'var(--red)' }}>{credits} credits</span>
            </div>
            <Link href="/pricing" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, background: '#0EA5E9', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Upgrade</Link>
          </div>
        </div>

        {/* Hero */}
        <div style={{ padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px) 0' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 8, lineHeight: 1.1 }}>
            What will you build today?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36 }}>Pick a framework to start a new project. Your code, your stack.</p>

          {/* Framework cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 48 }}>
            {FRAMEWORKS.map(fw => (
              <button key={fw.id} onClick={() => handleFrameworkClick(fw.id)} disabled={creating !== null}
                style={{ padding: '20px', borderRadius: 12, border: `1px solid var(--ide-border)`, background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative', opacity: creating && creating !== fw.id ? 0.5 : 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fw.color + '66'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                {fw.tag && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', letterSpacing: '0.04em' }}>{fw.tag}</div>}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: fw.color + '15', border: `1px solid ${fw.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {creating === fw.id
                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${fw.color}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    : <span style={{ fontSize: 14, fontWeight: 800, color: fw.color, fontFamily: 'var(--font-mono)' }}>{fw.label.charAt(0)}</span>
                  }
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5, letterSpacing: '-0.02em' }}>{fw.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{fw.desc}</div>
              </button>
            ))}
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent projects</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 48 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border-light)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}>
                    <div style={{ height: 100, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ide-text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{FW_LABELS[p.framework!] ?? 'App'}</span>
                      )}
                      {(p.deployed_url || p.published_url) && <span style={{ position: 'absolute', top: 7, right: 7, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(22,163,74,0.12)', color: 'var(--green)', fontWeight: 700 }}>Live</span>}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{p.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: FW_COLORS[p.framework!] ?? 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{FW_LABELS[p.framework!]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Link href={`/project/${p.id}`} style={{ flex: 1, textAlign: 'center', padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 11, textDecoration: 'none', fontWeight: 500 }}>Open</Link>
                        {(p.deployed_url || p.published_url) && (
                          <a href={p.published_url || p.deployed_url || '#'} target="_blank" rel="noreferrer" style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, textDecoration: 'none' }}>↗</a>
                        )}
                        <button onClick={() => deleteProject(p.id!)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0 60px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 13 }}>No projects yet -- click a framework above to start</p>
            </div>
          )}
        </div>
      </div>

      {/* NAME MODAL */}
      {showNameModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowNameModal(false)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
              New {FRAMEWORKS.find(f => f.id === pendingFramework)?.label} project
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{FRAMEWORKS.find(f => f.id === pendingFramework)?.desc}</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createProject()}
              placeholder="Give your project a name..."
              autoFocus
              style={{ width: '100%', padding: '10px 13px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 12 }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#0EA5E9'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}
            />
            {createError && <div style={{ padding: '8px 12px', borderRadius: 7, background: 'var(--red2)', color: 'var(--red)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{createError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createProject} disabled={creating !== null || !newName.trim()} className="btn btn-primary" style={{ flex: 1, fontSize: 13, justifyContent: 'center' }}>
                {creating ? 'Creating...' : 'Create project'}
              </button>
              <button onClick={() => { setShowNameModal(false); setCreateError(''); }} className="btn btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

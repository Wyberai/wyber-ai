'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project, PLAN_LIMITS } from '@/lib/supabase/types';
import Link from 'next/link';

const FW_LABELS: Record<string, string> = { 'react-vite': 'React', 'vue': 'Vue', 'vanilla': 'JS', 'next': 'Next.js' };
const FW_COLORS: Record<string, string> = { 'react-vite': '#61dafb', 'vue': '#42b883', 'vanilla': '#f0db4f', 'next': '#0EA5E9' };
const FW_SSR: Record<string, boolean> = { 'react-vite': false, 'vue': false, 'vanilla': false, 'next': true };

interface Props { profile: Profile | null; projects: Partial<Project>[]; }

export function DashboardClient({ profile, projects: initialProjects }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newName, setNewName] = useState('');
  const [framework, setFramework] = useState('next');
  const [showNew, setShowNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const credits = profile?.credits ?? 0;
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;

  const createProject = async () => {
    if (!newName.trim()) return;
    if (!profile?.id) { setCreateError('Not logged in. Please refresh and try again.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: newName.trim(), framework, user_id: profile.id })
        .select('id');
      if (error) {
        setCreateError(`Database error: ${error.message} (code: ${error.code})`);
        setCreating(false);
        return;
      }
      if (!data || data.length === 0) {
        setCreateError('Project was created but could not be retrieved. Check Supabase RLS policies.');
        setCreating(false);
        return;
      }
      router.push(`/project/${data[0].id}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  };

  const duplicateProject = async (id: string) => {
    const res = await fetch('/api/projects/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, userId: profile?.id }),
    });
    const { project } = await res.json();
    if (project) router.push(`/project/${project.id}`);
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
        setImportStatus(`Imported ${data.fileCount} files`);
        setTimeout(() => router.push(`/project/${data.project.id}`), 800);
      } else {
        setImportStatus(data.error ?? 'Import failed');
      }
    } catch { setImportStatus('Import failed'); }
    setImporting(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-surface)', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            Wyber<span style={{ color: '#0EA5E9' }}>AI</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/templates" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Templates</Link>
          <div style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: credits > 20 ? 'var(--green-dim)' : 'var(--red2)', color: credits > 20 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {credits} credits
          </div>
          <div style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>
            {plan}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{profile?.email}</span>
          <button onClick={signOut} className="btn btn-ghost" style={{ fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Projects</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) importZip(f); e.target.value = ''; }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn" style={{ fontSize: 12 }}>
              {importing ? importStatus : 'Import ZIP'}
            </button>
            <button onClick={() => { setShowNew(true); setCreateError(''); }} className="btn btn-primary" style={{ fontSize: 13 }}>
              + New project
            </button>
          </div>
        </div>

        {/* New project form */}
        {showNew && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 12, padding: 22, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>New project</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Give your app a name..."
                onKeyDown={e => e.key === 'Enter' && createProject()}
                autoFocus
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}
              />
              <select
                value={framework}
                onChange={e => setFramework(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <option value="next">Next.js -- SEO-ready, SSR (Recommended)</option>
                <option value="react-vite">React + Vite -- Fast SPA</option>
                <option value="vue">Vue 3 -- Component framework</option>
                <option value="vanilla">Vanilla JS -- No framework</option>
              </select>
            </div>
            {FW_SSR[framework] && (
              <div style={{ padding: '7px 10px', borderRadius: 7, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', marginBottom: 10, fontSize: 11, color: 'var(--green)' }}>
                Server-side rendering -- your app ranks on Google from day one
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={createProject} disabled={creating || !newName.trim()} className="btn btn-primary" style={{ fontSize: 13 }}>
                {creating ? 'Creating...' : 'Create project'}
              </button>
              <button onClick={() => { setShowNew(false); setCreateError(''); setNewName(''); }} className="btn btn-ghost" style={{ fontSize: 13 }}>
                Cancel
              </button>
            </div>
            {createError && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--red2)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
                {createError}
              </div>
            )}
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20 }}>+</div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 6px' }}>No projects yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create a project to start building</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projects.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border-light)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}>
                <div style={{ height: 130, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ide-text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{FW_LABELS[p.framework!] ?? 'App'}</div>
                  }
                  {FW_SSR[p.framework!] && (
                    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 5, background: 'rgba(22,163,74,0.12)', color: 'var(--green)', fontWeight: 700 }}>SSR</span>
                  )}
                  {(p.deployed_url || p.published_url) && (
                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 5, background: 'var(--green-dim)', color: 'var(--green)', fontWeight: 700 }}>Live</span>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: FW_COLORS[p.framework!] ?? 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0, marginLeft: 8 }}>
                      {FW_LABELS[p.framework!] ?? '?'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={`/project/${p.id}`} style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
                      Open
                    </Link>
                    <button onClick={() => duplicateProject(p.id!)} title="Duplicate"
                      style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                      Copy
                    </button>
                    {(p.deployed_url || p.published_url) && (
                      <a href={p.published_url || p.deployed_url || '#'} target="_blank" rel="noreferrer"
                        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none' }}>
                        View
                      </a>
                    )}
                    <button onClick={() => deleteProject(p.id!)} title="Delete"
                      style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid transparent', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upgrade banner */}
        {plan === 'free' && (
          <div style={{ marginTop: 40, background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: 15 }}>Upgrade to Pro</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
                1,200 credits/month -- Private projects -- Custom domains -- $39/month
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary" style={{ fontSize: 13, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              Upgrade
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project, PLAN_LIMITS } from '@/lib/supabase/types';
import Link from 'next/link';

const FW_LABELS: Record<string, string> = { 'react-vite': 'React', 'vue': 'Vue', 'vanilla': 'JS', 'next': 'Next.js' };
const FW_COLORS: Record<string, string> = { 'react-vite': '#61dafb', 'vue': '#42b883', 'vanilla': '#f0db4f', 'next': '#ffffff' };
const FW_SSR: Record<string, boolean> = { 'react-vite': false, 'vue': false, 'vanilla': false, 'next': true };

interface Props { profile: Profile | null; projects: Partial<Project>[]; }

export function DashboardClient({ profile, projects: initialProjects }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [framework, setFramework] = useState('next');
  const [showNew, setShowNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const credits = profile?.credits ?? 0;
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan];

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await supabase
        .from('projects')
        .insert({ name: newName.trim(), framework, user_id: profile?.id ?? '00000000-0000-0000-0000-000000000000' })
        .select('id')
        .single();
      if (data) router.push(`/project/${data.id}`);
      else throw new Error('No data returned');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Could not create project: ' + msg);
    }
    setCreating(false);
  };

  const duplicateProject = async (id: string, name: string) => {
    const res = await fetch('/api/projects/duplicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: id, userId: profile!.id }) });
    const { project } = await res.json();
    if (project) router.push(`/project/${project.id}`);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? Cannot be undone.')) return;
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
      if (data.project) { setImportStatus(`Imported ${data.fileCount} files`); setTimeout(() => router.push(`/project/${data.project.id}`), 800); }
      else setImportStatus(data.error ?? 'Import failed');
    } catch { setImportStatus('Import failed'); }
    setImporting(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icon.svg" alt="Wyber AI" style={{ width: 26, height: 26 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Wyber <span style={{ color: '#7C3AED' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/templates" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Templates</Link>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: credits > 20 ? 'var(--green-dim)' : 'rgba(240,82,82,0.15)', color: credits > 20 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{credits} credits</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 500, textTransform: 'capitalize' }}>{plan}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile?.email}</span>
          <button onClick={signOut} className="btn btn-ghost" style={{ fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Projects</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) importZip(f); e.target.value = ''; }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn" style={{ fontSize: 12 }}>
              {importing ? importStatus : '↥ Import ZIP'}
            </button>
            <button onClick={() => setShowNew(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ New project</button>
          </div>
        </div>

        {/* New project form */}
        {showNew && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 22, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>New project</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="App name" onKeyDown={e => e.key === 'Enter' && createProject()}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
              <select value={framework} onChange={e => setFramework(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                <option value="next">Next.js (SSR) ★ Recommended</option>
                <option value="react-vite">React + Vite</option>
                <option value="vue">Vue 3</option>
                <option value="vanilla">Vanilla JS</option>
              </select>
            </div>
            {FW_SSR[framework] && (
              <div style={{ padding: '7px 10px', borderRadius: 7, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', marginBottom: 10, fontSize: 11, color: '#34D399' }}>
                ✓ Server-side rendering — your app will rank on Google and AI search engines
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createProject} disabled={creating || !newName.trim()} className="btn btn-primary" style={{ fontSize: 13 }}>{creating ? 'Creating...' : 'Create'}</button>
              <button onClick={() => setShowNew(false)} className="btn btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 14 }}>⚡</div>
            <p style={{ fontSize: 15 }}>No projects yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Create a project or import a ZIP to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projects.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }} className="project-card">
                <div style={{ height: 130, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 28, opacity: 0.15 }}>⚡</div>
                  )}
                  {FW_SSR[p.framework!] && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(52,211,153,0.15)', color: '#34D399', fontWeight: 700 }}>SSR</span>}
                  {(p.deployed_url || p.published_url) && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'var(--green-dim)', color: 'var(--green)', fontWeight: 500 }}>Live</span>}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>{new Date(p.updated_at!).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: FW_COLORS[p.framework!], fontFamily: 'monospace' }}>{FW_LABELS[p.framework!]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={`/project/${p.id}`} style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
                      Open
                    </Link>
                    <button onClick={() => duplicateProject(p.id!, p.name!)} title="Duplicate" style={{ padding: '6px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>⊕</button>
                    {(p.deployed_url || p.published_url) && (
                      <a href={p.published_url || p.deployed_url || '#'} target="_blank" rel="noreferrer" style={{ padding: '6px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none' }}>↗</a>
                    )}
                    <button onClick={() => deleteProject(p.id!)} title="Delete" style={{ padding: '6px 9px', borderRadius: 7, border: '1px solid transparent', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {plan === 'free' && (
          <div style={{ marginTop: 40, background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: 15 }}>Upgrade to Pro</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>1,200 credits · Private projects · Custom domains · $39/month</p>
            </div>
            <Link href="/pricing" className="btn btn-primary" style={{ fontSize: 13, whiteSpace: 'nowrap', textDecoration: 'none' }}>Upgrade ↗</Link>
          </div>
        )}
      </div>
      <style>{`.project-card:hover { border-color: var(--border-light) !important; }`}</style>
    </div>
  );
}
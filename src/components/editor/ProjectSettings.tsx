'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProjectSettings({ projectId }: { projectId?: string }) {
  const { project, setProject } = useEditorStore();
  const [name, setName] = useState(project?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [isPublic, setIsPublic] = useState(project?.is_public ?? false);
  const supabase = createClient();
  const router = useRouter();
  const shareUrl = projectId ? `https://wyberai.com/p/${projectId}` : null;

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    await supabase.from('projects').update({ name: name.trim(), is_public: isPublic }).eq('id', projectId);
    if (project) setProject({ ...project, name: name.trim(), is_public: isPublic });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!projectId || confirmDelete !== project?.name) return;
    setDeleting(true);
    await supabase.from('projects').delete().eq('id', projectId);
    router.push('/dashboard');
  };

  const S = {
    wrap: { height: '100%', overflow: 'auto' as const, padding: 20, background: 'var(--bg-surface)', fontFamily: 'var(--font-sans)' },
    section: { background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 12, padding: 20, marginBottom: 14 },
    title: { fontSize: 13, fontWeight: 600, color: 'var(--ide-text)', marginBottom: 12, letterSpacing: '-0.02em' },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-overlay)', color: 'var(--ide-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' },
    btn: { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' },
  };

  return (
    <div style={S.wrap}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Project Settings</div>

      <div style={S.section}>
        <div style={S.title}>Project name</div>
        <input style={S.input} value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div style={S.section}>
        <div style={S.title}>Visibility</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[{ v: false, l: '🔒 Private' }, { v: true, l: '🌐 Public' }].map(opt => (
            <button key={String(opt.v)} onClick={() => setIsPublic(opt.v)}
              style={{ ...S.btn, flex: 1, background: isPublic === opt.v ? 'var(--accent-glow)' : 'var(--bg-overlay)', color: isPublic === opt.v ? 'var(--accent)' : 'var(--ide-text2)', border: `1px solid ${isPublic === opt.v ? 'var(--accent-dim)' : 'var(--ide-border)'}` }}>
              {opt.l}
            </button>
          ))}
        </div>
        {shareUrl && isPublic && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input style={{ ...S.input, flex: 1, fontSize: 11, color: 'var(--ide-text2)' }} value={shareUrl} readOnly />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}
              style={{ ...S.btn, background: 'var(--bg-overlay)', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', padding: '8px 12px' }}>
              Copy
            </button>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving || !projectId}
        style={{ ...S.btn, width: '100%', background: 'var(--accent)', color: '#fff', padding: '10px', marginBottom: 14, fontSize: 13 }}>
        {saving ? '⟳ Saving...' : saved ? '✓ Saved!' : 'Save changes'}
      </button>

      <div style={{ ...S.section, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
        <div style={{ ...S.title, color: 'var(--ide-red)' }}>Danger zone</div>
        <p style={{ fontSize: 12, color: 'var(--ide-text2)', marginBottom: 10, lineHeight: 1.6 }}>
          Type <strong style={{ color: 'var(--ide-text)' }}>{project?.name}</strong> to confirm deletion.
        </p>
        <input style={{ ...S.input, marginBottom: 10 }}
          placeholder={`Type "${project?.name}" to confirm`}
          value={confirmDelete}
          onChange={e => setConfirmDelete(e.target.value)} />
        <button onClick={handleDelete} disabled={deleting || confirmDelete !== project?.name}
          style={{ ...S.btn, width: '100%', background: confirmDelete === project?.name ? 'var(--ide-red)' : 'transparent', color: confirmDelete === project?.name ? '#fff' : 'var(--ide-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '9px', opacity: confirmDelete === project?.name ? 1 : 0.5 }}>
          {deleting ? '⟳ Deleting...' : 'Delete project permanently'}
        </button>
      </div>
    </div>
  );
}
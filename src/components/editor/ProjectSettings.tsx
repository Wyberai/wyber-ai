'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';

const BUILDER_TYPES = [
  { type: 'app',     label: 'Web App',  color: '#0EA5E9', desc: 'Dashboards, tools, CRMs' },
  { type: 'mobile',  label: 'Mobile',   color: '#f97316', desc: 'React Native iOS & Android' },
  { type: 'website', label: 'Website',  color: '#6366f1', desc: 'Landing pages, marketing sites' },
  { type: 'saas',    label: 'SaaS',     color: '#ec4899', desc: 'Auth, billing, teams, dashboard' },
] as const;

export function ProjectSettings({ projectId, userId }: { projectId?: string; userId?: string }) {
  const t = useT(EDITOR_CONNECTORS_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const { project, setProject } = useEditorStore();
  const [name, setName] = useState(project?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [isPublic, setIsPublic] = useState(project?.is_public ?? false);
  const [projectType, setProjectType] = useState(project?.project_type ?? 'app');
  const supabase = createClient();
  const router = useRouter();

  const shareUrl = projectId ? `https://wyberai.com/p/${projectId}` : null;

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    // Keep `framework` in lockstep with `project_type` — a project switched
    // to 'mobile' here without this stayed on whatever framework it was
    // scaffolded with (almost always 'react-vite'), so the editor kept
    // seeding/generating web code for a project billed and prompted as
    // mobile. This won't retroactively convert existing files, but it
    // stops a second creation path from reintroducing that same mismatch.
    const framework = projectType === 'mobile' ? 'react-native' : 'react-vite';
    await supabase.from('projects').update({ name: name.trim(), is_public: isPublic, project_type: projectType, framework }).eq('id', projectId);
    if (project) setProject({ ...project, name: name.trim(), is_public: isPublic, project_type: projectType });
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

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const S = {
    wrap: { height: '100%', overflow: 'auto', padding: 20, background: 'var(--bg-surface)', fontFamily: 'var(--font-sans)' },
    section: { background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 12, padding: 20, marginBottom: 14 },
    label: { fontSize: 11, fontWeight: 600, color: 'var(--ide-text2)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, display: 'block' },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-overlay)', color: 'var(--ide-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' },
    btn: { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' },
    title: { fontSize: 13, fontWeight: 600, color: 'var(--ide-text)', marginBottom: 14, letterSpacing: '-0.02em' },
  };

  return (
    <div style={S.wrap}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{t('projectSettingsTitle')}</div>

      {/* Name */}
      <div style={S.section}>
        <div style={S.title}>{t('projectNameSectionTitle')}</div>
        <input style={S.input} value={name} onChange={e => setName(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--ide-border)'}
        />
      </div>

      {/* Visibility */}
      <div style={S.section}>
        <div style={S.title}>{t('visibilitySectionTitle')}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[{ v: false, l: `🔒 ${t('privateOptionLabel')}`, d: t('privateOptionDesc') }, { v: true, l: `🌐 ${t('publicOptionLabel')}`, d: t('publicOptionDesc') }].map(opt => (
            <button key={String(opt.v)} onClick={() => setIsPublic(opt.v)}
              style={{ ...S.btn, flex: 1, background: isPublic === opt.v ? 'var(--accent-glow)' : 'var(--bg-overlay)', color: isPublic === opt.v ? 'var(--accent)' : 'var(--ide-text2)', border: `1px solid ${isPublic === opt.v ? 'var(--accent-dim)' : 'var(--ide-border)'}` }}>
              {opt.l}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--ide-text3)', margin: 0 }}>
          {isPublic ? t('visibilityPublicNote') : t('visibilityPrivateNote')}
        </p>
      </div>

      {/* Builder type */}
      <div style={S.section}>
        <div style={S.title}>Builder type</div>
        <p style={{ fontSize: 11, color: 'var(--ide-text3)', marginBottom: 12, marginTop: -6, lineHeight: 1.5 }}>
          Changing the type switches the AI system prompt for all future builds in this project.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {BUILDER_TYPES.map(({ type, label, color, desc }) => {
            const active = projectType === type;
            return (
              <button key={type} onClick={() => setProjectType(type)}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: active ? `1px solid ${color}55` : '1px solid var(--ide-border)', background: active ? `${color}18` : 'var(--bg-overlay)', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : 'var(--ide-text)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ide-text3)', lineHeight: 1.4 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Share URL */}
      {shareUrl && isPublic && (
        <div style={S.section}>
          <div style={S.title}>{t('shareUrlSectionTitle')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.input, flex: 1, fontSize: 11, color: 'var(--ide-text2)' }} value={shareUrl} readOnly />
            <button onClick={copyShareUrl} style={{ ...S.btn, background: 'var(--bg-overlay)', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', padding: '8px 12px' }}>
              {tc('copy')}
            </button>
          </div>
        </div>
      )}

      {/* Save */}
      <button onClick={handleSave} disabled={saving || !projectId}
        style={{ ...S.btn, width: '100%', background: 'var(--accent)', color: '#fff', padding: '10px', marginBottom: 14, fontSize: 13 }}>
        {saving ? `⟳ ${tc('saving')}` : saved ? `✓ ${tc('saved')}` : tc('saveChanges')}
      </button>

      {/* Danger zone */}
      <div style={{ ...S.section, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
        <div style={{ ...S.title, color: 'var(--ide-red)' }}>{t('dangerZoneTitle')}</div>
        <p style={{ fontSize: 12, color: 'var(--ide-text2)', marginBottom: 12, lineHeight: 1.6 }}>
          {t('dangerZoneConfirmPrefix')} <strong style={{ color: 'var(--ide-text)' }}>{project?.name}</strong> {t('dangerZoneConfirmSuffix')}
        </p>
        <input style={{ ...S.input, marginBottom: 10 }} placeholder={t('confirmDeletePlaceholderTemplate').replace('{name}', project?.name ?? '')}
          value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--ide-red)'}
          onBlur={e => e.target.style.borderColor = 'var(--ide-border)'}
        />
        <button onClick={handleDelete} disabled={deleting || confirmDelete !== project?.name}
          style={{ ...S.btn, width: '100%', background: confirmDelete === project?.name ? 'var(--ide-red)' : 'transparent', color: confirmDelete === project?.name ? '#fff' : 'var(--ide-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '9px', opacity: confirmDelete === project?.name ? 1 : 0.5 }}>
          {deleting ? `⟳ ${tc('deleting')}` : t('deletePermanentlyBtn')}
        </button>
      </div>
    </div>
  );
}

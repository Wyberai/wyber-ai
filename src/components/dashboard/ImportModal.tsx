'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/useT';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';
import { DASHBOARD_STRINGS } from '@/lib/i18n/dict/dashboard';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = 'web' | 'mobile' | 'website' | 'saas' | 'workflow';
type InputMode = 'zip' | 'github' | 'json';

const TAB_META: { id: Tab; labelKey: keyof typeof DASHBOARD_STRINGS['en']; color: string; icon: React.ReactNode }[] = [
  {
    id: 'web', labelKey: 'tabWebApp', color: '#0EA5E9',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: 'mobile', labelKey: 'tabMobileApp', color: '#f97316',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  },
  {
    id: 'website', labelKey: 'tabWebsite', color: '#6366f1',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    id: 'saas', labelKey: 'tabSaaS', color: '#ec4899',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
  {
    id: 'workflow', labelKey: 'tabN8nWorkflow', color: '#f59e0b',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>,
  },
];

const CARD = 'var(--bg-elevated)';
const BORDER = 'var(--ide-border)';
const TEXT = 'var(--ide-text)';
const MUTED = 'var(--ide-text2)';
const DIM = 'var(--ide-text3)';

export function ImportModal({ open, onClose }: Props) {
  const t = useT(DASHBOARD_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const router = useRouter();

  // Code-import state
  const [tab, setTab] = useState<Tab>('web');
  const [mode, setMode] = useState<InputMode>('zip');
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Website Copier state
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  const activeColor = TAB_META.find(m => m.id === tab)?.color ?? '#0EA5E9';
  const isWorkflow = tab === 'workflow';
  const accept = isWorkflow ? '.json,application/json' : '.zip,application/zip';

  const reset = () => { setFile(null); setGithubUrl(''); setProjectName(''); setError(null); setLoading(false); };
  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    reset();
    setMode(newTab === 'workflow' ? 'json' : 'zip');
  };

  const handleFile = (f: File) => {
    setError(null);
    if (isWorkflow && !f.name.endsWith('.json')) { setError(t('pleaseUploadJson')); return; }
    if (!isWorkflow && !f.name.endsWith('.zip')) { setError(t('pleaseUploadZip')); return; }
    setFile(f);
    if (!projectName) setProjectName(f.name.replace(/\.(zip|json)$/i, ''));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  const submitClone = async () => {
    if (!cloneUrl.trim()) { setCloneError('Enter a website URL to clone'); return; }
    setCloneError(null);
    setCloning(true);
    try {
      const res = await fetch('/api/projects/clone-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cloneUrl.trim(), name: cloneName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setCloneError(data.error || 'Clone failed. Try again.'); setCloning(false); return; }
      if (data.initialPrompt) sessionStorage.setItem(`wyber_prompt_${data.project.id}`, data.initialPrompt);
      onClose();
      router.push(`/project/${data.project.id}?type=website`);
    } catch (err) {
      setCloneError(String(err));
      setCloning(false);
    }
  };

  const projectType = tab === 'mobile' ? 'mobile' : tab === 'website' ? 'website' : tab === 'saas' ? 'saas' : 'app';

  const submit = async () => {
    setError(null);
    if (!projectName.trim() && !isWorkflow) { setError(t('enterProjectName')); return; }
    setLoading(true);
    try {
      if (isWorkflow) {
        if (!file) { setError(t('uploadWorkflowJson')); setLoading(false); return; }
        const text = await file.text();
        let workflow: unknown;
        try { workflow = JSON.parse(text); } catch { setError(t('invalidJsonFile')); setLoading(false); return; }
        const res = await fetch('/api/flows/import-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow, name: projectName || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('importFailed')); setLoading(false); return; }
        onClose();
        router.push(`/flows/${data.flow.id}`);
        return;
      }

      if (mode === 'zip') {
        if (!file) { setError(t('uploadZipFile')); setLoading(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', projectName.trim() || file.name.replace('.zip', ''));
        fd.append('type', projectType);
        const res = await fetch('/api/projects/import', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('importFailed')); setLoading(false); return; }
        onClose();
        router.push(`/project/${data.project.id}?type=${data.project_type}`);
      } else {
        if (!githubUrl.trim()) { setError(t('enterGithubUrl')); setLoading(false); return; }
        const res = await fetch('/api/projects/import-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: githubUrl.trim(), name: projectName.trim() || undefined, type: projectType }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('importFailed')); setLoading(false); return; }
        onClose();
        router.push(`/project/${data.project.id}?type=${data.project_type}`);
      }
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  const getImportBtn = () => {
    if (loading) return t('importingEllipsis');
    if (tab === 'mobile') return t('importMobileProjectBtn');
    if (tab === 'website') return t('importWebsiteProjectBtn');
    if (tab === 'saas') return t('importSaaSProjectBtn');
    if (tab === 'workflow') return t('importWorkflowBtn');
    return t('importWebProjectBtn');
  };

  const getNamePlaceholder = () => {
    if (tab === 'mobile') return t('myMobileAppPlaceholder');
    if (tab === 'website') return t('myWebsitePlaceholder');
    if (tab === 'saas') return t('mySaaSPlaceholder');
    return t('myWebAppPlaceholder');
  };

  const getZipLabel = () => {
    if (tab === 'mobile') return `${t('importZipLabelPrefix')} (React Native / Expo)`;
    if (tab === 'website') return `${t('importZipLabelPrefix')} (React / Astro / Next.js)`;
    if (tab === 'saas') return `${t('importZipLabelPrefix')} (Next.js / React with auth)`;
    return `${t('importZipLabelPrefix')} (React / Vite / Next.js)`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }} maxWidth={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: 0 }}>{t('importModalTitle')}</h2>
            <p style={{ fontSize: 12.5, color: MUTED, margin: '4px 0 0', lineHeight: 1.5 }}>{t('importModalDesc')}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DIM, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4, flexShrink: 0 }}>&times;</button>
        </div>

        {/* ══════════════ WEBSITE COPIER HERO ══════════════ */}
        <div style={{
          borderRadius: 14,
          padding: '18px 18px 16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.13) 0%, rgba(139,92,246,0.09) 50%, rgba(236,72,153,0.07) 100%)',
          border: '1px solid rgba(99,102,241,0.32)',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Soft glow blob */}
          <div style={{
            position: 'absolute', top: -30, right: -20, width: 140, height: 140,
            borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
            <span style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em',
              padding: '2px 7px', borderRadius: 4,
              background: 'rgba(99,102,241,0.22)', color: '#a5b4fc',
              textTransform: 'uppercase' as const, flexShrink: 0,
            }}>FEATURED</span>
            <span style={{ fontSize: 16 }}>🌐</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Website Copier</span>
          </div>

          <p style={{ fontSize: 12.5, color: MUTED, margin: '0 0 14px', lineHeight: 1.55, position: 'relative' }}>
            Paste any public URL — WyberAi recreates it as a polished, fully editable website project. Perfect for redesigns, competitive analysis, or inspiration.
          </p>

          {/* URL + Clone button row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 9, position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: DIM, fontSize: 13, pointerEvents: 'none', lineHeight: 1,
              }}>🔗</span>
              <input
                value={cloneUrl}
                onChange={e => { setCloneUrl(e.target.value); setCloneError(null); }}
                onKeyDown={e => e.key === 'Enter' && submitClone()}
                placeholder="https://yourwebsite.com"
                style={{
                  width: '100%', padding: '9px 12px 9px 30px', borderRadius: 8,
                  border: `1px solid ${cloneError ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.38)'}`,
                  background: 'rgba(0,0,0,0.18)',
                  color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
                  fontFamily: 'monospace',
                  transition: 'border-color 0.15s',
                }}
              />
            </div>
            <button
              onClick={submitClone}
              disabled={cloning}
              style={{
                padding: '9px 16px', borderRadius: 8, border: 'none',
                cursor: cloning ? 'not-allowed' : 'pointer',
                background: cloning
                  ? 'rgba(99,102,241,0.35)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const,
                transition: 'all 0.2s', opacity: cloning ? 0.7 : 1,
                boxShadow: cloning ? 'none' : '0 2px 12px rgba(99,102,241,0.4)',
              }}
            >
              {cloning ? '⟳ Cloning…' : 'Clone Site →'}
            </button>
          </div>

          {/* Optional project name */}
          <div style={{ position: 'relative' }}>
            <input
              value={cloneName}
              onChange={e => setCloneName(e.target.value)}
              placeholder="Project name (optional — auto-set from URL)"
              style={{
                width: '100%', padding: '7px 11px', borderRadius: 7,
                border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(0,0,0,0.12)',
                color: TEXT, fontSize: 12, outline: 'none', boxSizing: 'border-box' as const,
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {cloneError && (
            <div style={{
              marginTop: 9, fontSize: 12, color: '#f87171',
              padding: '7px 10px', borderRadius: 6,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            }}>
              {cloneError}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 10.5, color: DIM, whiteSpace: 'nowrap' as const, fontWeight: 700, letterSpacing: '0.08em' }}>
            OR IMPORT EXISTING CODE
          </span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 3, padding: 3,
          background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`,
          marginBottom: 14,
        }}>
          {TAB_META.map(m => (
            <button
              key={m.id}
              onClick={() => switchTab(m.id)}
              style={{
                flex: 1, minWidth: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '7px 2px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: 600, transition: 'all 0.15s',
                background: tab === m.id ? `${m.color}18` : 'transparent',
                color: tab === m.id ? m.color : MUTED,
                outline: tab === m.id ? `1px solid ${m.color}40` : 'none',
              }}
            >
              {m.icon}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {t(m.labelKey)}
              </span>
            </button>
          ))}
        </div>

        {/* ── Mode toggle (zip / github) — not for workflow ── */}
        {!isWorkflow && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 13 }}>
            {(['zip', 'github'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setFile(null); setGithubUrl(''); setError(null); }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  border: `1px solid ${mode === m ? activeColor + '60' : BORDER}`,
                  background: mode === m ? `${activeColor}10` : 'transparent',
                  color: mode === m ? activeColor : MUTED,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {m === 'zip' ? `⬆ ${t('importUploadZip')}` : t('importGithubUrlBtn')}
              </button>
            ))}
          </div>
        )}

        {/* ── Project / workflow name ── */}
        <div style={{ marginBottom: 13 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 5 }}>
            {isWorkflow ? t('workflowNameOptional') : t('projectNameLabel')}
          </label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder={isWorkflow ? t('workflowNamePlaceholder') : getNamePlaceholder()}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: `1px solid ${BORDER}`, background: CARD, color: TEXT,
              fontSize: 13.5, outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>

        {/* ── File drop / GitHub URL ── */}
        {(mode === 'zip' || mode === 'json') ? (
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 5 }}>
              {isWorkflow ? t('n8nWorkflowJsonLabel') : getZipLabel()}
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? activeColor : file ? activeColor + '80' : BORDER}`,
                borderRadius: 10, padding: '22px 20px', textAlign: 'center' as const, cursor: 'pointer',
                background: dragging ? `${activeColor}08` : file ? `${activeColor}06` : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>✓</div>
                  <div style={{ fontSize: 13.5, color: activeColor, fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 11.5, color: DIM, marginTop: 3 }}>{(file.size / 1024).toFixed(0)} KB — {t('clickToReplace')}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 26, marginBottom: 7 }}>{isWorkflow ? '📋' : '📦'}</div>
                  <div style={{ fontSize: 13.5, color: MUTED }}>{isWorkflow ? t('dropWorkflowLabel') : t('dropZipLabel')}</div>
                  <div style={{ fontSize: 11.5, color: DIM, marginTop: 3 }}>{t('orClickToBrowse')}</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept={accept} style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 5 }}>
              {t('githubRepoUrlLabel')}
            </label>
            <input
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              placeholder={tab === 'mobile' ? 'https://github.com/you/my-expo-app' : 'https://github.com/you/my-react-app'}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: `1px solid ${BORDER}`, background: CARD, color: TEXT,
                fontSize: 13.5, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace',
              }}
            />
            <p style={{ fontSize: 11, color: DIM, margin: '5px 0 0' }}>
              {t('publicReposNote')}{' '}
              <a href="/settings" style={{ color: activeColor }}>{t('settingsIntegrationsLink')}</a>.
            </p>
          </div>
        )}

        {/* n8n info strip */}
        {isWorkflow && (
          <div style={{
            padding: '9px 13px', borderRadius: 8, marginBottom: 13,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: 11.5, color: '#d97706', lineHeight: 1.6,
          }}>
            {t('n8nExportNotePrefix')} <strong>File → Download</strong> {t('n8nExportNoteSuffix')}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '9px 13px', borderRadius: 8, marginBottom: 13,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 12.5, color: '#f87171',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 0, padding: '10px 18px', borderRadius: 9,
              border: `1px solid ${BORDER}`, background: 'transparent',
              color: MUTED, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {tc('cancel')}
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 18px', borderRadius: 9, border: 'none',
              background: loading ? DIM : activeColor,
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {getImportBtn()}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

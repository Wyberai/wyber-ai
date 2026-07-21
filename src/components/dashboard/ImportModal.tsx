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

type Tab = 'web' | 'mobile' | 'workflow';
type InputMode = 'zip' | 'github' | 'json';

const TAB_META: { id: Tab; labelKey: keyof typeof DASHBOARD_STRINGS['en']; color: string; icon: React.ReactNode }[] = [
  {
    id: 'web', labelKey: 'tabWebApp', color: '#0EA5E9',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: 'mobile', labelKey: 'tabMobileApp', color: '#8b5cf6',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  },
  {
    id: 'workflow', labelKey: 'tabN8nWorkflow', color: '#f59e0b',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>,
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
  const [tab, setTab] = useState<Tab>('web');
  const [mode, setMode] = useState<InputMode>('zip');
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeColor = TAB_META.find(m => m.id === tab)?.color ?? '#0EA5E9';
  const isWorkflow = tab === 'workflow';
  const accept = isWorkflow ? '.json,application/json' : '.zip,application/zip';
  const dropLabel = isWorkflow ? t('dropWorkflowLabel') : t('dropZipLabel');

  const reset = () => {
    setFile(null); setGithubUrl(''); setProjectName(''); setError(null); setLoading(false);
  };
  const switchTab = (t: Tab) => { setTab(t); reset(); setMode(t === 'workflow' ? 'json' : 'zip'); };

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

      // Web / Mobile — ZIP or GitHub
      if (mode === 'zip') {
        if (!file) { setError(t('uploadZipFile')); setLoading(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', projectName.trim() || file.name.replace('.zip', ''));
        fd.append('type', tab); // 'app' or 'mobile'
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
          body: JSON.stringify({ url: githubUrl.trim(), name: projectName.trim() || undefined, type: tab }),
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }} maxWidth={540}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>{t('importModalTitle')}</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>{t('importModalDesc')}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DIM, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>&times;</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: CARD, borderRadius: 10, border: `1px solid ${BORDER}` }}>
          {TAB_META.map(m => (
            <button
              key={m.id}
              onClick={() => switchTab(m.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: tab === m.id ? `${m.color}18` : 'transparent',
                color: tab === m.id ? m.color : MUTED,
                outline: tab === m.id ? `1px solid ${m.color}40` : 'none',
              }}
            >
              {m.icon}{t(m.labelKey)}
            </button>
          ))}
        </div>

        {/* Mode toggle (zip vs github) — only for web/mobile */}
        {!isWorkflow && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['zip', 'github'] as InputMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setFile(null); setGithubUrl(''); setError(null); }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${mode === m ? activeColor + '60' : BORDER}`,
                  background: mode === m ? `${activeColor}10` : 'transparent', color: mode === m ? activeColor : MUTED,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {m === 'zip' ? `⬆ ${t('importUploadZip')}` : t('importGithubUrlBtn')}
              </button>
            ))}
          </div>
        )}

        {/* Project name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
            {isWorkflow ? t('workflowNameOptional') : t('projectNameLabel')}
          </label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder={isWorkflow ? t('workflowNamePlaceholder') : tab === 'mobile' ? t('myMobileAppPlaceholder') : t('myWebAppPlaceholder')}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Input area */}
        {(mode === 'zip' || isWorkflow) ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
              {isWorkflow ? t('n8nWorkflowJsonLabel') : `${t('importZipLabelPrefix')} ${tab === 'mobile' ? '(React Native / Expo)' : '(React / Vite / Next.js)'}`}
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? activeColor : file ? activeColor + '80' : BORDER}`,
                borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? `${activeColor}08` : file ? `${activeColor}06` : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
                  <div style={{ fontSize: 14, color: activeColor, fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB — {t('clickToReplace')}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{isWorkflow ? '📋' : '📦'}</div>
                  <div style={{ fontSize: 14, color: MUTED }}>{dropLabel}</div>
                  <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>{t('orClickToBrowse')}</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>{t('githubRepoUrlLabel')}</label>
            <input
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              placeholder={tab === 'mobile' ? 'https://github.com/you/my-expo-app' : 'https://github.com/you/my-react-app'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: DIM, margin: '6px 0 0' }}>
              {t('publicReposNote')}{' '}
              <a href="/settings" style={{ color: activeColor }}>{t('settingsIntegrationsLink')}</a>.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Info strips */}
        {isWorkflow && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#d97706', lineHeight: 1.6 }}>
            {t('n8nExportNotePrefix')} <strong>File → Download</strong> {t('n8nExportNoteSuffix')}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 0, padding: '10px 20px', borderRadius: 9, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {tc('cancel')}
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{ flex: 1, padding: '10px 20px', borderRadius: 9, border: 'none', background: loading ? DIM : activeColor, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {loading ? t('importingEllipsis') : isWorkflow ? t('importWorkflowBtn') : (tab === 'mobile' ? t('importMobileProjectBtn') : t('importWebProjectBtn'))}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = 'web' | 'mobile' | 'workflow';
type InputMode = 'zip' | 'github' | 'json';

const TABS: { id: Tab; label: string; color: string; icon: React.ReactNode }[] = [
  {
    id: 'web', label: 'Web App', color: '#0EA5E9',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: 'mobile', label: 'Mobile App', color: '#8b5cf6',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  },
  {
    id: 'workflow', label: 'n8n Workflow', color: '#f59e0b',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>,
  },
];

const CARD = 'var(--bg-elevated)';
const BORDER = 'var(--ide-border)';
const TEXT = 'var(--ide-text)';
const MUTED = 'var(--ide-text2)';
const DIM = 'var(--ide-text3)';

export function ImportModal({ open, onClose }: Props) {
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

  const activeColor = TABS.find(t => t.id === tab)?.color ?? '#0EA5E9';
  const isWorkflow = tab === 'workflow';
  const accept = isWorkflow ? '.json,application/json' : '.zip,application/zip';
  const dropLabel = isWorkflow ? 'Drop your n8n workflow JSON here' : 'Drop your project ZIP here';

  const reset = () => {
    setFile(null); setGithubUrl(''); setProjectName(''); setError(null); setLoading(false);
  };
  const switchTab = (t: Tab) => { setTab(t); reset(); setMode(t === 'workflow' ? 'json' : 'zip'); };

  const handleFile = (f: File) => {
    setError(null);
    if (isWorkflow && !f.name.endsWith('.json')) { setError('Please upload a .json file exported from n8n.'); return; }
    if (!isWorkflow && !f.name.endsWith('.zip')) { setError('Please upload a .zip file of your project.'); return; }
    setFile(f);
    if (!projectName) setProjectName(f.name.replace(/\.(zip|json)$/i, ''));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  const submit = async () => {
    setError(null);
    if (!projectName.trim() && !isWorkflow) { setError('Enter a project name.'); return; }
    setLoading(true);
    try {
      if (isWorkflow) {
        if (!file) { setError('Upload an n8n workflow JSON file.'); setLoading(false); return; }
        const text = await file.text();
        let workflow: unknown;
        try { workflow = JSON.parse(text); } catch { setError('Invalid JSON file.'); setLoading(false); return; }
        const res = await fetch('/api/flows/import-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow, name: projectName || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Import failed.'); setLoading(false); return; }
        onClose();
        router.push(`/flows/${data.flow.id}`);
        return;
      }

      // Web / Mobile — ZIP or GitHub
      if (mode === 'zip') {
        if (!file) { setError('Upload a ZIP file.'); setLoading(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', projectName.trim() || file.name.replace('.zip', ''));
        fd.append('type', tab); // 'app' or 'mobile'
        const res = await fetch('/api/projects/import', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Import failed.'); setLoading(false); return; }
        onClose();
        router.push(`/project/${data.project.id}?type=${data.project_type}`);
      } else {
        if (!githubUrl.trim()) { setError('Enter a GitHub repository URL.'); setLoading(false); return; }
        const res = await fetch('/api/projects/import-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: githubUrl.trim(), name: projectName.trim() || undefined, type: tab }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Import failed.'); setLoading(false); return; }
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Import existing project</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>Bring your code into Wyber and keep building.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DIM, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>&times;</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: CARD, borderRadius: 10, border: `1px solid ${BORDER}` }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: tab === t.id ? `${t.color}18` : 'transparent',
                color: tab === t.id ? t.color : MUTED,
                outline: tab === t.id ? `1px solid ${t.color}40` : 'none',
              }}
            >
              {t.icon}{t.label}
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
                {m === 'zip' ? '⬆ Upload ZIP' : '  GitHub URL'}
              </button>
            ))}
          </div>
        )}

        {/* Project name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
            {isWorkflow ? 'Workflow name (optional)' : 'Project name'}
          </label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder={isWorkflow ? 'My n8n workflow' : tab === 'mobile' ? 'My Mobile App' : 'My Web App'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Input area */}
        {(mode === 'zip' || isWorkflow) ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
              {isWorkflow ? 'n8n workflow JSON' : `Project ZIP ${tab === 'mobile' ? '(React Native / Expo)' : '(React / Vite / Next.js)'}`}
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
                  <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB — click to replace</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{isWorkflow ? '📋' : '📦'}</div>
                  <div style={{ fontSize: 14, color: MUTED }}>{dropLabel}</div>
                  <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>or click to browse</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>GitHub repository URL</label>
            <input
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              placeholder={tab === 'mobile' ? 'https://github.com/you/my-expo-app' : 'https://github.com/you/my-react-app'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: DIM, margin: '6px 0 0' }}>
              Public repos work without auth. Private repos require a GitHub token in{' '}
              <a href="/settings" style={{ color: activeColor }}>Settings → Integrations</a>.
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
            Export from n8n: <strong>File → Download</strong> → saves as <code>.json</code>. Wyber maps 80+ node types and reconstructs the canvas automatically.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 0, padding: '10px 20px', borderRadius: 9, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{ flex: 1, padding: '10px 20px', borderRadius: 9, border: 'none', background: loading ? DIM : activeColor, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {loading ? 'Importing…' : isWorkflow ? 'Import workflow' : `Import ${tab === 'mobile' ? 'mobile' : 'web'} project`}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

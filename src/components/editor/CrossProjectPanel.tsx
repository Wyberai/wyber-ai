'use client';
import { useState, useEffect } from 'react';

interface OtherProject { id: string; name: string; framework: string; files: Record<string, { path: string; content: string }>; updated_at: string; }
interface Props { projectId: string; }

const FW_LABELS: Record<string, string> = { 'react-vite': 'React', 'vue': 'Vue', 'vanilla': 'JS', 'next': 'Next.js' };

export function CrossProjectPanel({ projectId }: Props) {
  const [projects, setProjects] = useState<OtherProject[]>([]);
  const [selected, setSelected] = useState<OtherProject | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/cross-project').then(r => r.json()).then(d => setProjects((d.projects || []).filter((p: OtherProject) => p.id !== projectId)));
  }, [projectId]);

  const toggleFile = (path: string) => {
    setSelectedFiles(prev => { const s = new Set(prev); s.has(path) ? s.delete(path) : s.add(path); return s; });
  };

  const copyFiles = async () => {
    if (!selected || selectedFiles.size === 0) return;
    setCopying(true); setMsg('');
    const res = await fetch('/api/cross-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceProjectId: selected.id, targetProjectId: projectId, filePaths: [...selectedFiles] }),
    });
    const data = await res.json();
    if (data.copied > 0) setMsg(`✓ Copied ${data.copied} file${data.copied > 1 ? 's' : ''} into this project`);
    else setMsg('Nothing was copied');
    setCopying(false); setSelectedFiles(new Set());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cross-Project</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Reuse components and files from your other projects.</div>

      {projects.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 12, background: 'var(--bg2)', borderRadius: 9, border: '1px solid var(--border)' }}>
          No other projects yet. Create another project to use cross-project referencing.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projects.map(p => (
              <div key={p.id} onClick={() => { setSelected(selected?.id === p.id ? null : p); setSelectedFiles(new Set()); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, border: `1px solid ${selected?.id === p.id ? 'var(--sky)' : 'var(--border)'}`, background: selected?.id === p.id ? 'rgba(14,165,233,0.06)' : 'var(--bg2)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{FW_LABELS[p.framework]} · {Object.keys(p.files || {}).length} files</div>
                </div>
                <span style={{ fontSize: 10, color: selected?.id === p.id ? 'var(--sky)' : 'var(--text3)', fontWeight: 500 }}>{selected?.id === p.id ? '▲ Hide' : '▼ Browse'}</span>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ border: '1px solid var(--sky)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 10px', background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--sky)' }}>
                Files from "{selected.name}" — select to copy
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {Object.keys(selected.files || {}).map(path => (
                  <label key={path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)', background: selectedFiles.has(path) ? 'rgba(14,165,233,0.04)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedFiles.has(path)} onChange={() => toggleFile(path)} style={{ accentColor: '#0EA5E9', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedFiles.size > 0 && (
            <button onClick={copyFiles} disabled={copying} style={{ padding: '9px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {copying ? 'Copying...' : `Copy ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''} into this project`}
            </button>
          )}

          {msg && <div style={{ padding: '8px 10px', borderRadius: 8, background: msg.startsWith('✓') ? 'rgba(52,211,153,0.08)' : 'var(--bg2)', border: '1px solid var(--border)', fontSize: 12, color: msg.startsWith('✓') ? '#34D399' : 'var(--text2)' }}>{msg}</div>}
        </>
      )}
    </div>
  );
}
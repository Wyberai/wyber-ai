'use client';
import { useEditorStore } from '@/store/editor';
import { useState } from 'react';
import { VisualEditor } from '@/components/visual-editor/VisualEditor';

type PreviewMode = 'preview' | 'visual' | 'console';
type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: Record<ViewportSize, { width: number | string; label: string; icon: string }> = {
  desktop: { width: '100%', label: 'Desktop', icon: '🖥' },
  tablet:  { width: 768, label: 'Tablet', icon: '📱' },
  mobile:  { width: 375, label: 'Mobile', icon: '📱' },
};

export function PreviewPanel() {
  const { previewUrl, isGenerating, files, framework, setPreviewUrl } = useEditorStore();
  const [mode, setMode] = useState<PreviewMode>('preview');
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [consoleLines, setConsoleLines] = useState<{ text: string; type: 'log' | 'error' | 'warn' }[]>([
    { text: 'Waiting for sandbox...', type: 'log' },
  ]);

  const refreshSandbox = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'local', files, framework }),
      });
      const data = await res.json();
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        setConsoleLines(prev => [...prev, { text: `Sandbox ready: ${data.previewUrl}`, type: 'log' }]);
      }
      if (data.error) setConsoleLines(prev => [...prev, { text: data.error, type: 'error' }]);
    } catch (e) {
      setConsoleLines(prev => [...prev, { text: `Error: ${e}`, type: 'error' }]);
    }
    setIsRefreshing(false);
  };

  const vp = VIEWPORTS[viewport];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 40, flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6 }}>
          {(['preview', 'visual', 'console'] as PreviewMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: mode === m ? 'var(--bg-elevated)' : 'transparent', color: mode === m ? (m === 'visual' ? 'var(--accent)' : 'var(--text-primary)') : 'var(--text-muted)' }}>
              {m === 'visual' ? '◎ Visual' : m === 'console' ? '⌘ Console' : '⬡ Preview'}
            </button>
          ))}
        </div>

        {/* Viewport size */}
        {mode === 'preview' && (
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6 }}>
            {(Object.keys(VIEWPORTS) as ViewportSize[]).map(v => (
              <button key={v} onClick={() => setViewport(v)} title={VIEWPORTS[v].label}
                style={{ padding: '3px 7px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, background: viewport === v ? 'var(--bg-elevated)' : 'transparent', color: viewport === v ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {VIEWPORTS[v].icon} {v === 'desktop' ? '' : VIEWPORTS[v].width + 'px'}
              </button>
            ))}
          </div>
        )}

        {/* URL bar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-base)', borderRadius: 6, padding: '0 8px', border: '1px solid var(--border)', height: 24 }}>
          <span style={{ fontSize: 9, color: previewUrl ? 'var(--green)' : 'var(--text-muted)' }}>●</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {previewUrl ?? 'no sandbox'}
          </span>
        </div>

        <button onClick={refreshSandbox} disabled={isRefreshing} title="Start/refresh sandbox"
          style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
          {isRefreshing ? '⟳' : '↺'}
        </button>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer"
            style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none' }}>↗</a>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', background: mode === 'preview' && viewport !== 'desktop' ? '#666' : 'var(--bg-base)' }}>
        {isGenerating && !previewUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg-surface)', zIndex: 10 }}>
            <div style={{ fontSize: 28 }}>⚡</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Generating code...</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {mode === 'visual' ? (
          <VisualEditor previewUrl={previewUrl} />
        ) : mode === 'console' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12, background: '#0A0A12', color: '#ccc' }}>
            {consoleLines.map((line, i) => (
              <div key={i} style={{ color: line.type === 'error' ? 'var(--red)' : line.type === 'warn' ? 'var(--amber)' : '#8FBCBB', marginBottom: 3, display: 'flex', gap: 8 }}>
                <span style={{ opacity: 0.4, minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        ) : !previewUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', height: '100%' }}>
            <div style={{ fontSize: 36, opacity: 0.2 }}>⬡</div>
            <div style={{ fontSize: 13 }}>No preview running</div>
            <button onClick={refreshSandbox} disabled={isRefreshing} className="btn" style={{ fontSize: 12 }}>
              {isRefreshing ? '⟳ Starting...' : '▶ Start sandbox'}
            </button>
            <div style={{ fontSize: 11, opacity: 0.5, maxWidth: 200, textAlign: 'center' }}>Requires E2B_API_KEY in .env.local</div>
          </div>
        ) : (
          /* Viewport frame */
          <div style={{
            width: viewport === 'desktop' ? '100%' : vp.width as number,
            height: '100%',
            transition: 'width 0.3s ease',
            boxShadow: viewport !== 'desktop' ? '0 0 0 1px #333, 0 4px 24px rgba(0,0,0,0.5)' : 'none',
            borderRadius: viewport !== 'desktop' ? 12 : 0,
            overflow: 'hidden',
          }}>
            <iframe
              src={previewUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="App Preview"
            />
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

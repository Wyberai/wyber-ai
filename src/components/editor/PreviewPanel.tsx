'use client';
import { useEditorStore } from '@/store/editor';
import { useState, useRef, useEffect, useCallback } from 'react';

type PreviewMode = 'preview' | 'console';
type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: Record<ViewportSize, { width: number | string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet:  { width: 768, label: 'Tablet' },
  mobile:  { width: 375, label: 'Mobile' },
};

export function PreviewPanel() {
  const { files, framework, isGenerating } = useEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<PreviewMode>('preview');
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [frameReady, setFrameReady] = useState(false);
  const hasFiles = Object.keys(files).length > 1;
  const lastFileCount = useRef(0);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-100), msg]);

  // Listen for messages from the preview frame
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === 'frame-ready') {
        setFrameReady(true);
        addLog('WebContainer frame ready');
      }
      if (e.data.type === 'server-ready') {
        setStatus('ready');
        setPreviewUrl(e.data.url);
        addLog(`Server running at ${e.data.url}`);
      }
      if (e.data.type === 'error') {
        setStatus('error');
        addLog(`Error: ${e.data.message}`);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Send files to frame when they change after generation
  const sendFilesToFrame = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    if (Object.keys(files).length <= 1) return;
    iframeRef.current.contentWindow.postMessage({
      type: status === 'idle' ? 'init' : 'update-files',
      files,
      framework,
    }, '*');
    if (status === 'idle') setStatus('loading');
    addLog(`Sent ${Object.keys(files).length} files to WebContainer`);
  }, [files, framework, status]);

  // Trigger when files change meaningfully (after generation)
  useEffect(() => {
    const count = Object.keys(files).length;
    if (count > 1 && count !== lastFileCount.current && frameReady && !isGenerating) {
      lastFileCount.current = count;
      const action = status === 'idle' ? 'init' : 'update-files';
      iframeRef.current?.contentWindow?.postMessage({ type: action, files, framework }, '*');
      if (status === 'idle') setStatus('loading');
      addLog(`Triggered ${action} with ${count} files`);
    }
  }, [files, framework, isGenerating, frameReady, status]);

  const vp = VIEWPORTS[viewport];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: 40, flexShrink: 0, borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
          {(['preview', 'console'] as PreviewMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)', background: mode === m ? 'var(--bg-elevated)' : 'transparent', color: mode === m ? 'var(--ide-text)' : 'var(--ide-text3)', transition: 'all 0.15s' }}>
              {m === 'console' ? '⌘ Console' : '⬡ Preview'}
            </button>
          ))}
        </div>

        {mode === 'preview' && (
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
            {(Object.keys(VIEWPORTS) as ViewportSize[]).map(v => (
              <button key={v} onClick={() => setViewport(v)} title={VIEWPORTS[v].label}
                style={{ padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-sans)', background: viewport === v ? 'var(--bg-elevated)' : 'transparent', color: viewport === v ? 'var(--ide-text)' : 'var(--ide-text3)', transition: 'all 0.15s' }}>
                {v === 'desktop' ? '🖥' : v === 'tablet' ? '⬜' : '📱'}
              </button>
            ))}
          </div>
        )}

        {/* Status indicator */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-base)', borderRadius: 7, padding: '0 10px', border: '1px solid var(--ide-border)', height: 26, overflow: 'hidden' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: status === 'ready' ? '#22C55E' : status === 'loading' ? '#F59E0B' : status === 'error' ? '#EF4444' : 'var(--ide-text3)', boxShadow: status === 'ready' ? '0 0 5px rgba(34,197,94,0.5)' : status === 'loading' ? '0 0 5px rgba(245,158,11,0.5)' : 'none', animation: status === 'loading' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {status === 'idle' ? 'Generate something to see a preview' : status === 'loading' ? 'Starting WebContainer...' : status === 'ready' ? (previewUrl ?? 'Running') : 'Error — check console'}
          </span>
        </div>

        {status === 'idle' && hasFiles && (
          <button onClick={sendFilesToFrame}
            style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)', color: 'var(--ide-text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            ▶ Start
          </button>
        )}
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer"
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 12, textDecoration: 'none' }}>↗</a>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'stretch', background: viewport !== 'desktop' && mode === 'preview' ? '#111113' : 'var(--bg-base)' }}>

        {/* Generation overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(10,10,10,0.9)', zIndex: 10, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
            </div>
            <span style={{ fontSize: 13, color: '#F5F5F5', fontWeight: 600 }}>Generating your app...</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `dot-pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}

        {mode === 'console' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, background: '#070710', color: '#ccc', lineHeight: 1.6 }}>
            {logs.length === 0
              ? <div style={{ color: 'var(--ide-text3)', paddingTop: 24, textAlign: 'center' }}>No output yet</div>
              : logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('Error') || log.includes('error') ? '#f87171' : '#8FBCBB', marginBottom: 2, display: 'flex', gap: 10 }}>
                  <span style={{ opacity: 0.3, minWidth: 24, userSelect: 'none', textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ wordBreak: 'break-all' }}>{log}</span>
                </div>
              ))
            }
          </div>
        ) : (
          <>
            {/* WebContainer iframe - always mounted, hidden when not ready */}
            <div style={{ width: viewport === 'desktop' ? '100%' : vp.width as number, height: '100%', transition: 'width 0.3s ease', overflow: 'hidden', position: 'relative', borderRadius: viewport !== 'desktop' ? 14 : 0, boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)' : 'none' }}>
              <iframe
                ref={iframeRef}
                src="/preview-frame"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="cross-origin-isolated; clipboard-read; clipboard-write"
                title="WebContainer Preview"
              />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

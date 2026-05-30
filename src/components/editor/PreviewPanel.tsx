'use client';
import { useEditorStore } from '@/store/editor';
import { useState, useRef, useEffect, useCallback } from 'react';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type Mode = 'preview' | 'console';

const VIEWPORTS: Record<ViewportSize, { w: number | string; icon: string }> = {
  desktop: { w: '100%', icon: '🖥' },
  tablet:  { w: 768, icon: '⬜' },
  mobile:  { w: 375, icon: '📱' },
};

let previewWindow: Window | null = null;
let broadcastChannel: BroadcastChannel | null = null;

export function PreviewPanel() {
  const { files, framework, isGenerating } = useEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<Mode>('preview');
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const prevFileCount = useRef(0);

  const addLog = (msg: string) => setLogs(p => [...p.slice(-100), msg]);

  // Listen for messages from preview frame
  useEffect(() => {
    const bc = broadcastChannel ?? (broadcastChannel = new BroadcastChannel('wyber-preview'));
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'frame-ready') { setFrameReady(true); addLog('Preview frame ready'); }
      if (e.data?.type === 'server-ready') { setStatus('ready'); setPreviewUrl(e.data.url); addLog(`Server: ${e.data.url}`); }
      if (e.data?.type === 'error') { setStatus('error'); addLog(`Error: ${e.data.message}`); }
    };
    bc.addEventListener('message', handler);

    // Also listen via postMessage for iframe
    const msgHandler = (e: MessageEvent) => {
      if (e.data?.type === 'frame-ready') { setFrameReady(true); }
      if (e.data?.type === 'server-ready') { setStatus('ready'); setPreviewUrl(e.data.url); }
    };
    window.addEventListener('message', msgHandler);
    return () => { bc.removeEventListener('message', handler); window.removeEventListener('message', msgHandler); };
  }, []);

  const sendFiles = useCallback((fileMap: typeof files, action: 'init' | 'files') => {
    const payload = { type: action === 'init' ? 'files' : 'files', files: fileMap, framework };
    // Send to iframe
    iframeRef.current?.contentWindow?.postMessage(payload, '*');
    // Send to popup if open
    if (previewWindow && !previewWindow.closed) previewWindow.postMessage(payload, '*');
    // Send via BroadcastChannel
    broadcastChannel?.postMessage(payload);
    addLog(`Sent ${Object.keys(fileMap).length} files (${action})`);
    if (action === 'init') setStatus('loading');
  }, [files, framework]);

  // Auto-trigger when files change after generation completes
  useEffect(() => {
    const count = Object.keys(files).length;
    if (count > 1 && count !== prevFileCount.current && !isGenerating) {
      prevFileCount.current = count;
      if (frameReady || status !== 'idle') {
        sendFiles(files, status === 'idle' ? 'init' : 'files');
      }
    }
  }, [files, isGenerating, frameReady, status, sendFiles]);

  const openInNewTab = () => {
    // Store files in sessionStorage for the new tab to pick up
    try {
      sessionStorage.setItem('wyber-preview-files', JSON.stringify({ files, framework }));
    } catch {}
    const w = window.open('/preview-frame', '_blank', 'width=1200,height=800');
    if (w) previewWindow = w;
    setStatus('loading');
    addLog('Opened preview in new window');
  };

  const vp = VIEWPORTS[viewport];
  const hasFiles = Object.keys(files).length > 1;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
          {(['preview', 'console'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)', background: mode === m ? 'var(--bg-elevated)' : 'transparent', color: mode === m ? 'var(--ide-text)' : 'var(--ide-text3)', transition: 'all 0.15s' }}>
              {m === 'preview' ? '⬡ Preview' : '⌘ Console'}
            </button>
          ))}
        </div>

        {/* Viewport toggle */}
        {mode === 'preview' && (
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
            {(Object.keys(VIEWPORTS) as ViewportSize[]).map(v => (
              <button key={v} onClick={() => setViewport(v)} style={{ padding: '3px 7px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)', background: viewport === v ? 'var(--bg-elevated)' : 'transparent', color: viewport === v ? 'var(--ide-text)' : 'var(--ide-text3)' }}>
                {VIEWPORTS[v].icon}
              </button>
            ))}
          </div>
        )}

        {/* Status indicator */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-base)', borderRadius: 7, padding: '0 10px', border: '1px solid var(--ide-border)', height: 26, minWidth: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: status === 'ready' ? '#22C55E' : status === 'loading' ? '#F59E0B' : status === 'error' ? '#EF4444' : 'var(--ide-text3)', animation: status === 'loading' ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {status === 'idle' ? 'Generate an app to preview' : status === 'loading' ? 'Installing dependencies...' : status === 'ready' ? (previewUrl ?? 'Running') : 'Error — see console'}
          </span>
        </div>

        {/* Action buttons */}
        {hasFiles && status === 'idle' && (
          <button onClick={() => sendFiles(files, 'init')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--accent)', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            ▶ Run
          </button>
        )}
        <button onClick={openInNewTab} title="Open in new tab" style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>↗</button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch', justifyContent: 'center', background: viewport !== 'desktop' && mode === 'preview' ? '#0A0A10' : 'var(--bg-base)' }}>

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(14,165,233,0.4)' }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5' }}>Generating your app...</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i*0.15}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}

        {mode === 'console' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, background: '#070710', lineHeight: 1.65 }}>
            {logs.length === 0
              ? <div style={{ color: 'rgba(255,255,255,0.2)', padding: '24px 0', textAlign: 'center' }}>No output yet. Generate and run an app.</div>
              : logs.map((l, i) => (
                <div key={i} style={{ color: l.includes('error') || l.includes('Error') ? '#F87171' : l.includes('ready') || l.includes('complete') || l.includes('Server') ? '#4ADE80' : 'rgba(255,255,255,0.4)', marginBottom: 2, display: 'flex', gap: 10 }}>
                  <span style={{ opacity: 0.2, minWidth: 20, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ wordBreak: 'break-all' }}>{l}</span>
                </div>
              ))
            }
          </div>
        ) : (
          <div style={{ width: vp.w as any, height: '100%', transition: 'width 0.3s ease', position: 'relative', borderRadius: viewport !== 'desktop' ? 14 : 0, overflow: 'hidden', boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)' : 'none' }}>
            <iframe
              ref={iframeRef}
              src="/preview-frame"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="cross-origin-isolated"
              title="WebContainer Preview"
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}

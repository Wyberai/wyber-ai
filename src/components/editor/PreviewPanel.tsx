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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: 40, flexShrink: 0, borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
          {(['preview', 'visual', 'console'] as PreviewMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em', transition: 'var(--t)', background: mode === m ? 'var(--bg-elevated)' : 'transparent', color: mode === m ? (m === 'visual' ? 'var(--accent)' : 'var(--ide-text)') : 'var(--ide-text3)' }}>
              {m === 'visual' ? '◎ Visual' : m === 'console' ? '⌘ Console' : '⬡ Preview'}
            </button>
          ))}
        </div>

        {/* Viewport toggles */}
        {mode === 'preview' && (
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
            {(Object.keys(VIEWPORTS) as ViewportSize[]).map(v => (
              <button key={v} onClick={() => setViewport(v)} title={VIEWPORTS[v].label}
                style={{ padding: '3px 7px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-sans)', transition: 'var(--t)', background: viewport === v ? 'var(--bg-elevated)' : 'transparent', color: viewport === v ? 'var(--ide-text)' : 'var(--ide-text3)' }}>
                {VIEWPORTS[v].icon}
              </button>
            ))}
          </div>
        )}

        {/* URL bar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-base)', borderRadius: 7, padding: '0 10px', border: '1px solid var(--ide-border)', height: 26 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: previewUrl ? 'var(--ide-green)' : 'var(--ide-text3)', flexShrink: 0, boxShadow: previewUrl ? '0 0 5px rgba(34,197,94,0.4)' : 'none' }} />
          <span style={{ fontSize: 11, color: previewUrl ? 'var(--ide-text2)' : 'var(--ide-text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>
            {previewUrl ?? 'No sandbox running'}
          </span>
        </div>

        <button onClick={refreshSandbox} disabled={isRefreshing} title="Refresh sandbox"
          style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 13, cursor: isRefreshing ? 'wait' : 'pointer', transition: 'var(--t)', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text3)'}>
          <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
        </button>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer"
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 12, textDecoration: 'none', transition: 'var(--t)', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ide-text3)'}>↗</a>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: mode === 'preview' && viewport !== 'desktop' ? '#1a1a20' : 'var(--bg-base)' }}>
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'rgba(13,13,15,0.85)', zIndex: 10, backdropFilter: 'blur(4px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--ide-text)', fontWeight: 600, letterSpacing: '-0.02em' }}>Building your app...</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `dot-pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'visual' ? (
          <VisualEditor previewUrl={previewUrl} />
        ) : mode === 'console' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, background: '#070710', color: '#ccc', lineHeight: 1.6 }}>
            {consoleLines.length === 0 ? (
              <div style={{ color: 'var(--ide-text3)', paddingTop: 24, textAlign: 'center', fontSize: 12 }}>No console output yet</div>
            ) : consoleLines.map((line, i) => (
              <div key={i} style={{ color: line.type === 'error' ? '#f87171' : line.type === 'warn' ? '#fbbf24' : '#8FBCBB', marginBottom: 2, display: 'flex', gap: 10 }}>
                <span style={{ opacity: 0.3, minWidth: 24, textAlign: 'right', userSelect: 'none' }}>{i + 1}</span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        ) : !previewUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: '100%' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ide-text3)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--ide-text2)', fontWeight: 500, marginBottom: 4 }}>No preview running</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', maxWidth: 180 }}>Start a sandbox to see your app live</div>
            </div>
            <button onClick={refreshSandbox} disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated)', color: 'var(--ide-text2)', fontSize: 12, cursor: isRefreshing ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'var(--t)' }}>
              {isRefreshing ? (
                <><div style={{ width: 12, height: 12, border: '1.5px solid var(--ide-text3)', borderTopColor: 'var(--ide-text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Starting...</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm1 8.5L6 8.5V5.5l3 1.5v3.5z"/></svg>Start sandbox</>
              )}
            </button>
          </div>
        ) : (
          <div style={{ width: viewport === 'desktop' ? '100%' : vp.width as number, height: '100%', transition: 'width 0.3s var(--ease)', boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)' : 'none', borderRadius: viewport !== 'desktop' ? 14 : 0, overflow: 'hidden' }}>
            <iframe
              src={previewUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              allow="cross-origin-isolated"
              title="App Preview"
              onError={() => window.open(previewUrl ?? '', '_blank')}
            />
            {/* Overlay shown when iframe is blocked */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg-base)', pointerEvents: 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--ide-text2)', fontWeight: 500 }}>Preview ready</div>
              <a href={previewUrl ?? ''} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', pointerEvents: 'all' }}>
                Open preview ↗
              </a>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)' }}>Opens in a new tab</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useEditorStore } from '@/store/editor';
import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Sandpack to avoid SSR issues
const SandpackProvider = dynamic(() => import('@codesandbox/sandpack-react').then(m => m.SandpackProvider), { ssr: false });
const SandpackPreview = dynamic(() => import('@codesandbox/sandpack-react').then(m => m.SandpackPreview), { ssr: false });

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type Mode = 'preview' | 'console';

const VIEWPORTS: Record<ViewportSize, { w: string | number; icon: string }> = {
  desktop: { w: '100%', icon: '🖥' },
  tablet:  { w: 768, icon: '⬜' },
  mobile:  { w: 375, icon: '📱' },
};

function getTemplate(framework: string) {
  if (framework === 'vue') return 'vue' as const;
  if (framework === 'vanilla') return 'static' as const;
  return 'react' as const; // react-vite and next both use react template for preview
}

function getSandpackFiles(files: Record<string, { content: string }>, framework: string) {
  const result: Record<string, string> = {};

  // Skip config files Sandpack handles internally
  const SKIP = new Set(['package.json', 'vite.config.ts', 'vite.config.js', 'next.config.ts', 'next.config.js', 'tsconfig.json', 'tsconfig.node.json', '.gitignore']);

  for (const [path, file] of Object.entries(files)) {
    const clean = path.replace(/^\//, ''); // remove leading slash
    if (SKIP.has(clean)) continue;
    if (!file.content || !file.content.trim()) continue;
    // Sandpack needs leading slash
    const p = '/' + clean;
    result[p] = file.content;
  }

  if (framework === 'vanilla') return result;

  // Check what we have
  const hasApp = result['/App.tsx'] || result['/App.jsx'] || result['/src/App.tsx'] || result['/src/App.jsx'];
  const hasIndex = result['/index.tsx'] || result['/index.jsx'] || result['/src/main.tsx'] || result['/src/main.jsx'];
  const hasCss = result['/index.css'] || result['/src/index.css'] || result['/styles.css'] || result['/App.css'];

  // If no App, pick the first tsx/jsx component file as App
  if (!hasApp) {
    const firstComponent = Object.entries(result).find(([p, content]) =>
      (p.endsWith('.tsx') || p.endsWith('.jsx')) &&
      !p.includes('main') && !p.includes('index') &&
      (content.includes('export default') || content.includes('export function'))
    );
    if (firstComponent) {
      result['/App.tsx'] = firstComponent[1];
    }
  }

  // Ensure index entry point exists
  if (!hasIndex) {
    result['/index.tsx'] = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${hasCss ? "import './index.css';" : ''}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);`;
  }

  // Ensure base CSS exists
  if (!hasCss) {
    result['/index.css'] = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }`;
  }

  return result;
}

export function PreviewPanel() {
  const { files, framework, isGenerating, hasGeneratedFiles } = useEditorStore();
  const [mode, setMode] = useState<Mode>('preview');
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [sandpackKey, setSandpackKey] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const prevGenerated = useRef(false);

  // Refresh Sandpack key when new generation completes
  useEffect(() => {
    if (hasGeneratedFiles && !prevGenerated.current) {
      prevGenerated.current = true;
      setSandpackKey(k => k + 1);
      setLogs(l => [...l, 'Preview loaded with generated files']);
    } else if (hasGeneratedFiles && !isGenerating) {
      setSandpackKey(k => k + 1);
    }
  }, [hasGeneratedFiles, isGenerating]);

  const hasFiles = hasGeneratedFiles && Object.keys(files).length > 1;

  const vp = VIEWPORTS[viewport];
  const sandpackFiles = hasFiles ? getSandpackFiles(files, framework ?? 'react-vite') : {};
  const template = getTemplate(framework ?? 'react-vite');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* Toolbar */}
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
          {(['preview', 'console'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)', background: mode === m ? 'var(--bg-elevated)' : 'transparent', color: mode === m ? 'var(--ide-text)' : 'var(--ide-text3)', transition: 'all 0.15s' }}>
              {m === 'preview' ? '⬡ Preview' : '⌘ Console'}
            </button>
          ))}
        </div>

        {mode === 'preview' && (
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-base)', padding: 2, borderRadius: 6, border: '1px solid var(--ide-border)' }}>
            {(Object.keys(VIEWPORTS) as ViewportSize[]).map(v => (
              <button key={v} onClick={() => setViewport(v)}
                style={{ padding: '3px 7px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, background: viewport === v ? 'var(--bg-elevated)' : 'transparent', color: viewport === v ? 'var(--ide-text)' : 'var(--ide-text3)' }}>
                {VIEWPORTS[v].icon}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-base)', borderRadius: 7, padding: '0 10px', border: '1px solid var(--ide-border)', height: 26, minWidth: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: hasFiles ? '#22C55E' : 'var(--ide-text3)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasFiles ? `${Object.keys(files).length} files · ${template} · Sandpack` : 'Generate an app to preview'}
          </span>
        </div>

        {hasFiles && (
          <button onClick={() => setSandpackKey(k => k + 1)}
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 11, cursor: 'pointer' }}>
            ↺
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch', justifyContent: 'center', background: viewport !== 'desktop' && mode === 'preview' ? '#0A0A10' : 'var(--bg-base)' }}>

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(14,165,233,0.4)' }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
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
              ? <div style={{ color: 'rgba(255,255,255,0.2)', padding: '24px 0', textAlign: 'center' }}>No output yet</div>
              : logs.map((l, i) => (
                <div key={i} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2, display: 'flex', gap: 10 }}>
                  <span style={{ opacity: 0.2, minWidth: 20 }}>{i + 1}</span>
                  <span>{l}</span>
                </div>
              ))
            }
          </div>
        ) : !hasFiles ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⬡</div>
            <div style={{ fontSize: 13, color: 'var(--ide-text3)', textAlign: 'center', lineHeight: 1.6 }}>
              Type a prompt and generate<br />your app to see it live here
            </div>
          </div>
        ) : (
          <div style={{ width: vp.w as any, height: '100%', transition: 'width 0.3s ease', overflow: 'hidden', borderRadius: viewport !== 'desktop' ? 14 : 0, boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)' : 'none' }}>
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ide-text3)', fontSize: 12 }}>Loading preview...</div>}>
              <SandpackProvider
                key={sandpackKey}
                template={template}
                files={sandpackFiles}
                theme="dark"
                options={{ externalResources: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'] }}
              >
                <SandpackPreview
                  style={{ height: '100%', width: '100%' }}
                  showOpenInCodeSandbox={false}
                  showRefreshButton={true}
                />
              </SandpackProvider>
            </Suspense>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .sp-preview-container { height: 100% !important; }
        .sp-preview-iframe { height: 100% !important; }
      `}</style>
    </div>
  );
}

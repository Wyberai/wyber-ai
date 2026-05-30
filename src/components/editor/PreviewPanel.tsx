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

function resolveAliases(code: string, filePath: string): string {
  // Calculate depth of file to know how many ../ to use
  // filePath like /App.tsx = depth 0, /components/Header.tsx = depth 1
  const parts = filePath.split('/').filter(Boolean);
  const depth = parts.length - 1; // subtract 1 for the filename
  const prefix = depth === 0 ? './' : '../'.repeat(depth);

  // Replace @/ with relative path
  return code
    .replace(/from ['"]@\/([^'"]+)['"]/g, (_, p) => `from '${prefix}${p}'`)
    .replace(/import ['"]@\/([^'"]+)['"]/g, (_, p) => `import '${prefix}${p}'`);
}

function stripNextImports(code: string): string {
  return code
    .replace(/'use client';?\n?/g, '')
    .replace(/"use client";?\n?/g, '')
    .replace(/import[^;]+from ['"]next\/link['"];?\n?/g, '')
    .replace(/import[^;]+from ['"]next\/image['"];?\n?/g, '')
    .replace(/import[^;]+from ['"]next\/navigation['"];?\n?/g, '')
    .replace(/import[^;]+from ['"]next\/router['"];?\n?/g, '')
    .replace(/<Link href=([^>]+)>/g, '<a href=$1>')
    .replace(/<\/Link>/g, '</a>')
    .replace(/<Image([^/]+)\/>/g, '<img$1/>')
    .replace(/useRouter\(\)/g, '{ push: (p: string) => {}, back: () => {} }')
    .replace(/usePathname\(\)/g, "''")
    .replace(/useSearchParams\(\)/g, 'new URLSearchParams()');
}

function getSandpackFiles(files: Record<string, { content: string }>, framework: string) {
  const result: Record<string, string> = {};

  const SKIP = new Set(['package.json', 'vite.config.ts', 'vite.config.js', 'next.config.ts', 'next.config.js', 'tsconfig.json', 'tsconfig.node.json', '.gitignore', 'tailwind.config.ts', 'tailwind.config.js', 'postcss.config.js']);

  for (const [path, file] of Object.entries(files)) {
    const clean = path.replace(/^\//, '');
    if (SKIP.has(clean)) continue;
    if (!file.content || !file.content.trim()) continue;
    let fileContent = file.content;
    // Strip Next.js-specific syntax for preview
    if (framework === 'next') fileContent = stripNextImports(fileContent);
    // Resolve @/ path aliases to relative paths
    const normalizedPath = '/' + clean;
    fileContent = resolveAliases(fileContent, normalizedPath);
    result[normalizedPath] = fileContent;
  }

  // Detect actual content type regardless of framework setting
  const hasHtml = !!result['/index.html'];
  const hasTsx = Object.keys(result).some(p => p.endsWith('.tsx') || p.endsWith('.jsx'));

  if (hasHtml && !hasTsx) {
    // AI generated vanilla HTML even if React was selected - use static template
    return { '__detected_template': 'static', ...result };
  }

  if (framework === 'vanilla') {
    return result;
  }

  // Find the main App component - check multiple possible paths
  const APP_CANDIDATES = [
    '/App.tsx', '/App.jsx', '/App.js',
    '/src/App.tsx', '/src/App.jsx',
    '/app/page.tsx', '/app/page.jsx',   // Next.js app router
    '/pages/index.tsx', '/pages/index.jsx', // Next.js pages router
  ];

  let appPath = APP_CANDIDATES.find(p => result[p]);

  // If still no app, find first component with export default
  if (!appPath) {
    const found = Object.entries(result).find(([p, c]) =>
      (p.endsWith('.tsx') || p.endsWith('.jsx')) &&
      !p.includes('layout') &&
      (c.includes('export default') || c.includes('export function'))
    );
    if (found) appPath = found[0];
  }

  // Create a re-export wrapper at /App.tsx pointing to the real file
  // This keeps the original file's relative imports intact
  let appImport = './App';
  if (appPath && appPath !== '/App.tsx') {
    // Calculate relative path from /App.tsx to the real file
    const rel = appPath.startsWith('/') ? '.' + appPath.replace(/\.tsx$/, '').replace(/\.jsx$/, '') : './' + appPath.replace(/\.tsx$/, '').replace(/\.jsx$/, '');
    result['/App.tsx'] = `export { default } from '${rel}';
export * from '${rel}';`;
  }

  // Check existing CSS
  const cssPath = ['/index.css', '/src/index.css', '/styles.css', '/app/globals.css', '/styles/globals.css']
    .find(p => result[p]);

  // Ensure index entry exists
  const hasIndex = result['/index.tsx'] || result['/index.jsx'] || result['/src/main.tsx'];
  if (!hasIndex) {
    result['/index.tsx'] = [
      "import { StrictMode } from 'react';",
      "import { createRoot } from 'react-dom/client';",
      `import App from '${appImport}';`,
      cssPath ? `import './${cssPath.replace(/^\//, '')}';` : '',
      "createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);",
    ].filter(Boolean).join('\n');
  }

  // Ensure base CSS
  if (!cssPath) {
    result['/index.css'] = [
      '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
      'html, body { height: 100%; }',
      "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }",
    ].join('\n');
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
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 11, cursor: 'pointer' }} title="Refresh preview">
            ↺
          </button>
        )}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('wyber:toggle-chat'))}
          style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--accent)', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}
          title="Toggle chat panel">
          💬 Chat
        </button>
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
                template={sandpackFiles['/__detected_template'] === 'static' ? 'static' : undefined}
                files={Object.fromEntries(Object.entries(sandpackFiles).filter(([k]) => k !== '/__detected_template'))}
                theme="dark"
                customSetup={sandpackFiles['/__detected_template'] === 'static' ? undefined : {
                  dependencies: {
                    "react": "^18.0.0",
                    "react-dom": "^18.0.0",
                    "lucide-react": "^0.383.0",
                    "recharts": "^2.12.0",
                    "react-router-dom": "^6.0.0",
                    "clsx": "^2.0.0",
                  },
                  entry: Object.keys(sandpackFiles).find(p =>
                    p === '/index.tsx' || p === '/index.jsx' || p === '/src/main.tsx'
                  ) ?? '/index.tsx',
                }}
                options={{
                  externalResources: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap'],
                  recompileMode: 'delayed',
                  recompileDelay: 500,
                }}
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

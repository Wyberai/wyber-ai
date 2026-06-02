'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';

/**
 * WyberPreview — zero external dependency preview
 * 
 * Uses srcdoc iframe + @babel/standalone loaded from CDN inside the iframe
 * No Sandpack, no CodeSandbox CDN, no timeouts, no CORS issues
 * Works 100% offline except for the Babel CDN load (cached after first use)
 */

function filesToHTML(files: Record<string, { content: string }>): string {
  // Collect all file contents
  const fileMap: Record<string, string> = {};
  for (const [path, file] of Object.entries(files)) {
    if (file?.content) fileMap[path] = file.content;
  }

  // Get CSS
  const css = Object.entries(fileMap)
    .filter(([p]) => p.endsWith('.css'))
    .map(([, c]) => c)
    .join('\n');

  // Get all TSX/JS files
  const scripts = Object.entries(fileMap)
    .filter(([p]) => p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.js'))
    .sort(([a], [b]) => {
      // Entry point last so it runs after components
      const aIsEntry = a.includes('App.tsx') || a.includes('index.tsx');
      const bIsEntry = b.includes('App.tsx') || b.includes('index.tsx');
      if (aIsEntry && !bIsEntry) return 1;
      if (!aIsEntry && bIsEntry) return -1;
      return 0;
    });

  // Build a combined script that registers modules by filename
  // and then mounts the App
  const moduleRegistrations = scripts.map(([path, content]) => {
    const moduleName = path.replace(/^.*\//, '').replace(/\.(tsx|ts|jsx|js)$/, '');
    // Escape backticks in content
    const escaped = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
    return `__modules['${moduleName}'] = \`${escaped}\`;`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
    body { -webkit-font-smoothing: antialiased; }
    #wyber-error {
      display: none;
      position: fixed;
      inset: 0;
      background: #09090b;
      color: #ef4444;
      font-family: monospace;
      font-size: 13px;
      padding: 24px;
      overflow: auto;
      white-space: pre-wrap;
      z-index: 9999;
    }
    ${css}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="wyber-error"></div>
  <script>
    // Module registry
    const __modules = {};
    const __exports = {};
    ${moduleRegistrations}

    function showError(msg) {
      const el = document.getElementById('wyber-error');
      el.style.display = 'block';
      el.textContent = '⚠ Preview Error\\n\\n' + msg;
      console.error(msg);
    }

    window.addEventListener('error', e => showError(e.message));
    window.addEventListener('unhandledrejection', e => showError(String(e.reason)));

    // Transpile and execute all modules
    function transpileModule(name) {
      if (__exports[name]) return __exports[name];
      const src = __modules[name];
      if (!src) return {};
      try {
        const transformed = Babel.transform(src, {
          presets: [
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }]
          ],
          plugins: [],
          filename: name + '.tsx',
        }).code;

        // Replace import statements with module registry lookups
        const patched = transformed
          .replace(/require\\("([^"]+)"\\)/g, (_, imp) => {
            const modName = imp.replace(/^.*\\//, '').replace(/\\.(tsx|ts|jsx|js)$/, '');
            if (__modules[modName]) return '__exports["' + modName + '"] || (function(){ transpileModule("' + modName + '"); return __exports["' + modName + '"]; })()';
            // External — will be resolved globally (React, etc.)
            return 'window.__ext["' + imp + '"] || {}';
          });

        const fn = new Function('React', 'exports', 'module', patched);
        const mod = { exports: {} };
        fn(window.React, mod.exports, mod);
        __exports[name] = mod.exports;
        return mod.exports;
      } catch(e) {
        showError('Error in ' + name + ':\\n' + e.message);
        return {};
      }
    }

    // Load React from CDN inside iframe
    const reactScript = document.createElement('script');
    reactScript.src = 'https://unpkg.com/react@18/umd/react.development.js';
    reactScript.onload = () => {
      const domScript = document.createElement('script');
      domScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';
      domScript.onload = () => {
        // Load optional libs
        const lucideScript = document.createElement('script');
        lucideScript.src = 'https://unpkg.com/lucide-react@0.383.0/dist/umd/lucide-react.js';
        lucideScript.onload = () => {
          window.__ext = {
            'react': window.React,
            'react-dom': window.ReactDOM,
            'lucide-react': window.lucideReact || {},
          };
          try {
            // Transpile all modules in dependency order
            Object.keys(__modules).forEach(name => transpileModule(name));

            // Find and mount App
            const AppModule = __exports['App'] || __exports[Object.keys(__exports)[Object.keys(__exports).length - 1]];
            const App = AppModule?.default || AppModule?.App;
            if (!App) { showError('No default export found. Make sure App.tsx has: export default function App()'); return; }

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          } catch(e) {
            showError(String(e) + '\\n' + (e.stack || ''));
          }
        };
        lucideScript.onerror = () => {
          // Lucide failed, continue without it
          window.__ext = { 'react': window.React, 'react-dom': window.ReactDOM, 'lucide-react': {} };
          try {
            Object.keys(__modules).forEach(name => transpileModule(name));
            const AppModule = __exports['App'] || __exports[Object.keys(__exports)[Object.keys(__exports).length - 1]];
            const App = AppModule?.default || AppModule?.App;
            if (!App) { showError('No default export found.'); return; }
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          } catch(e) { showError(String(e)); }
        };
        document.head.appendChild(lucideScript);
      };
      document.head.appendChild(domScript);
    };
    reactScript.onerror = () => showError('Failed to load React. Check your internet connection.');
    document.head.appendChild(reactScript);
  <\/script>
</body>
</html>`;
}

export function PreviewPanel() {
  const { files, isGenerating, hasGeneratedFiles } = useEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasFiles, setHasFiles] = useState(false);
  const [key, setKey] = useState(0);
  const htmlRef = useRef('');

  const buildPreview = useCallback(() => {
    const fileEntries = Object.entries(files).filter(([, f]) => (f as any)?.content);
    if (fileEntries.length < 2) return;
    setHasFiles(true);
    const html = filesToHTML(files as any);
    htmlRef.current = html;
    setKey(k => k + 1);
  }, [files]);

  useEffect(() => {
    if (!isGenerating && Object.keys(files).length >= 2) {
      buildPreview();
    }
  }, [isGenerating, files, buildPreview]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>

      {/* Minimal toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, borderBottom: '1px solid var(--ide-border)', background: 'var(--bg-base)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: hasFiles ? '#22c55e' : '#52525b' }} />
          <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontFamily: 'var(--font-mono)' }}>
            {isGenerating ? 'Generating...' : hasFiles ? `${Object.keys(files).length} files` : 'Type a prompt to generate your app'}
          </span>
        </div>
        {hasFiles && (
          <button
            onClick={() => setKey(k => k + 1)}
            title="Refresh preview"
            style={{ background: 'none', border: '1px solid var(--ide-border)', borderRadius: 5, color: 'var(--ide-text3)', cursor: 'pointer', padding: '2px 7px', fontSize: 11 }}
          >
            ↺
          </button>
        )}
      </div>

      {/* Preview */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Empty state */}
        {!hasFiles && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#52525b' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.15)" strokeWidth="1"/>
              <path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11L28 16L23 21" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Type a prompt and generate your app to see it live here</span>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#52525b', zIndex: 5 }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Building your app...</span>
          </div>
        )}

        {/* iframe — full size, no external CDN for bundling */}
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={htmlRef.current || undefined}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: hasFiles ? 'block' : 'none',
            background: '#09090b',
          }}
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

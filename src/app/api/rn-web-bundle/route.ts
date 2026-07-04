export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'

// In-app mobile preview runtime (react-native-web). Bundles a generated RN app
// and returns an HTML document loaded directly in the WyberAi app's WebView, so
// the app renders INSIDE WyberAi — no Expo Go, no Snack handoff. This is the
// "RN-web now" half of the preview runtime; a true-native host comes later.
//
// Hardening principles (we cannot render on-device from here, so failures must
// degrade gracefully):
//   1. Single React + single react-native-web. Every esm.sh dependency is told
//      `?external=react,react-dom,react-native-web` so it reuses the ONE copy
//      from the import map. Duplicate React is the #1 cause of RN-web blank
//      screens ("Invalid hook call") — this removes it.
//   2. Uniform aliasing. Every dependency gets `alias=react-native:
//      react-native-web` so nested libs (navigation, safe-area, svg, expo-*)
//      resolve their own `react-native` import to the web build.
//   3. Never show a raw error. A React error boundary + a DOM fallback card + a
//      blank-screen watchdog guarantee a calm "Preview unavailable" state
//      instead of a red stack, a white blank, or an esbuild dump.

const RNW = 'https://esm.sh/react-native-web@0.19.13?external=react,react-dom'
const ESM = 'https://esm.sh'
// Shared query for every third-party dependency: reuse the singleton React +
// react-native-web, and rewrite any `react-native` import to the web build.
const DEP_QUERY = 'external=react,react-dom,react-native-web&alias=react-native:react-native-web&deps=react@18.3.1,react-native-web@0.19.13'

// Bare specifiers that resolve via the import map (the singletons). Everything
// else is routed to esm.sh with DEP_QUERY.
const SINGLETONS = new Set([
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'react-native-web',
])

const IMPORT_MAP = {
  imports: {
    react: `${ESM}/react@18.3.1`,
    'react-dom': `${ESM}/react-dom@18.3.1?external=react`,
    'react-dom/client': `${ESM}/react-dom@18.3.1/client?external=react`,
    'react/jsx-runtime': `${ESM}/react@18.3.1/jsx-runtime`,
    'react/jsx-dev-runtime': `${ESM}/react@18.3.1/jsx-dev-runtime`,
    'react-native': RNW,
    'react-native-web': RNW,
  },
}

function esmUrl(spec: string): string {
  return `${ESM}/${spec}?${DEP_QUERY}`
}

function normalise(p: string): string {
  if (!p.startsWith('/')) p = '/' + p
  if (!p.match(/\.[a-z]+$/i)) p += '.tsx'
  return p
}

function resolveImport(from: string, to: string): string {
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.') out.push(p)
  }
  return out.join('/')
}

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json()
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'No files', kind: 'empty' }, { status: 400 })
    }

    const fileMap: Record<string, string> = {}
    for (const [path, file] of Object.entries(files)) {
      const np = normalise(path)
      const content = (file as { content?: string })?.content ?? String(file)
      fileMap[np] = content
    }

    const appEntry =
      ['/App.tsx', '/App.jsx', '/App.js', '/src/App.tsx'].find((e) => fileMap[e]) ||
      Object.keys(fileMap).find((k) => /App\.(tsx|jsx|js)$/.test(k)) ||
      ''
    if (!appEntry) {
      return NextResponse.json({ error: 'No App entry found', kind: 'no-entry' }, { status: 400 })
    }

    // Virtual boot module: wrap the app in an error boundary, then register + run
    // through AppRegistry so react-native-web injects styles and mounts into #root.
    const BOOT = '/__wyber_rnw_boot.tsx'
    fileMap[BOOT] = BOOT_SOURCE(appEntry)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const esbuild = require('esbuild')

    const result = await esbuild.build({
      entryPoints: [BOOT],
      bundle: true,
      format: 'esm',
      write: false,
      minify: false,
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.json': 'json' },
      define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true' },
      plugins: [
        {
          name: 'virtual',
          setup(build: {
            onResolve: (o: { filter: RegExp }, cb: (a: { path: string; importer: string }) => unknown) => void
            onLoad: (o: { filter: RegExp; namespace: string }, cb: (a: { path: string }) => unknown) => void
          }) {
            build.onResolve({ filter: /.*/ }, (args) => {
              // Relative / absolute → resolve inside the virtual project.
              if (args.path.startsWith('.') || args.path.startsWith('/')) {
                const resolved = args.path.startsWith('/')
                  ? normalise(args.path)
                  : args.importer
                    ? resolveImport(args.importer, args.path)
                    : normalise(args.path)
                for (const s of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
                  if (fileMap[resolved + s]) return { path: resolved + s, namespace: 'virtual' }
                }
                // Missing local file — leave external so a bad import can't fail
                // the whole build; the error boundary handles it at runtime.
                return { path: resolved, external: true }
              }
              // Singletons resolve via the import map (bare specifier kept as-is).
              if (SINGLETONS.has(args.path)) return { path: args.path, external: true }
              // Every other dependency → esm.sh with shared React + RNW singletons.
              return { path: esmUrl(args.path), external: true }
            })
            build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
              const content = fileMap[args.path]
              if (!content) return { errors: [{ text: `Not found: ${args.path}` }] }
              const ext = args.path.split('.').pop()
              const loader = ext === 'ts' ? 'ts' : ext === 'js' || ext === 'jsx' ? 'jsx' : 'tsx'
              return { contents: content, loader }
            })
          },
        },
      ],
    })

    if (result.errors?.length > 0) {
      const msg = result.errors
        .map((e: { text: string; location?: { file: string; line: number } }) =>
          `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`,
        )
        .join('\n')
      // A code/compile problem in the generated app. Surfaced as a clean,
      // categorised error the client shows calmly (not a raw dump).
      return NextResponse.json({ error: msg, kind: 'compile' }, { status: 422 })
    }

    const js = result.outputFiles?.[0]?.text ?? ''
    return NextResponse.json({ html: PREVIEW_HTML(js) })
  } catch (err) {
    return NextResponse.json({ error: String(err), kind: 'server' }, { status: 500 })
  }
}

// The boot module. An error boundary catches render-time failures and shows a
// calm, on-brand fallback (rendered with RN primitives) instead of a red crash.
function BOOT_SOURCE(appEntry: string): string {
  return `import React from 'react'
import { AppRegistry, View, Text } from 'react-native'
import App from '${appEntry}'

class WyberBoundary extends React.Component {
  constructor(p){ super(p); this.state = { failed: false } }
  static getDerivedStateFromError(){ return { failed: true } }
  componentDidCatch(err){
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'preview-error', message: String((err && err.message) || err) })) } catch(e){}
  }
  render(){
    if (this.state.failed) {
      return React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A0A0B' } },
        React.createElement(Text, { style: { color: '#F5F5F7', fontSize: 16, fontWeight: '600', marginBottom: 6 } }, 'Preview unavailable'),
        React.createElement(Text, { style: { color: '#9A9AA5', fontSize: 13, textAlign: 'center', lineHeight: 19 } }, 'This screen uses something we can’t render in the in-app preview yet. It will still work in a full build.')
      )
    }
    return this.props.children
  }
}

function Root(){ return React.createElement(WyberBoundary, null, React.createElement(App, null)) }
AppRegistry.registerComponent('WyberApp', () => Root)
AppRegistry.runApplication('WyberApp', { rootTag: document.getElementById('root') })`
}

// The HTML shell. Module-load / async failures and blank screens all resolve to
// the same calm DOM fallback card — the user never sees a stack trace.
function PREVIEW_HTML(js: string): string {
  const importmap = JSON.stringify(IMPORT_MAP)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Preview</title>
<script type="importmap">${importmap}</script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
body{background:#0A0A0B;-webkit-font-smoothing:antialiased;overflow:hidden}
#root{display:flex}
#wyber-fallback{display:none;position:fixed;inset:0;background:#0A0A0B;color:#F5F5F7;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}
#wyber-fallback .t{font-size:16px;font-weight:600;margin-bottom:6px}
#wyber-fallback .s{font-size:13px;color:#9A9AA5;max-width:280px;line-height:1.5}
</style>
</head>
<body>
<div id="root"></div>
<div id="wyber-fallback"><div class="t">Preview unavailable</div><div class="s">This app uses a feature we can’t render in the in-app preview yet. It will still work in a full build.</div></div>
<script>
(function(){
  var shown=false;
  function calm(msg){ if(shown)return; shown=true; var el=document.getElementById('wyber-fallback'); if(el)el.style.display='flex';
    try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'preview-error',message:String(msg||'load')})); }catch(e){} }
  window.addEventListener('error', function(ev){ calm(ev && ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ calm(ev && ev.reason && (ev.reason.message||ev.reason)); });
  // Blank-screen watchdog: if nothing mounted after 8s, show the calm card.
  setTimeout(function(){ var r=document.getElementById('root'); if(r && r.childElementCount===0) calm('timeout'); }, 8000);
})();
</script>
<script type="module">
${js}
</script>
</body></html>`
}

// Defensive file-map sanitizer run before sending a project to the remote
// builder / publish. The builder writes every path to disk, so a malformed
// path can make a real file (e.g. index.html) resolve to a DIRECTORY, which
// causes vite to fail with "EISDIR: illegal operation on a directory, read
// index.html". This normalizes paths and resolves file-vs-directory collisions.

import { collectMissingStubs } from './stub-missing-imports'
import { TAILWIND_CONFIG_FILE, DEFAULT_TOKENS_CSS, GOOGLE_FONTS_LINKS } from './design-system'
import { WYBER_UI_KIT_FILES } from './wyber-ui-kit'
import { WYBER_STORE_FILES } from './wyber-store'
import { resolveDirectivesForPreview } from './image-directives'

type FileVal = { content?: string; language?: string } | string

const hasExtension = (p: string) => /\.[a-z0-9]+$/i.test(p)

export function sanitizeFiles<T extends Record<string, FileVal>>(files: T, opts?: { appId?: string; securityBadge?: { score: number } }): T {
  if (!files || typeof files !== 'object') return files

  const out: Record<string, FileVal> = {}
  for (const [rawPath, val] of Object.entries(files)) {
    // Normalize: trim, strip leading "./" or "/", strip trailing slashes
    const p = String(rawPath).trim().replace(/^\.?\/+/, '').replace(/\/+$/, '')
    // Drop empty, parent-traversal, or paths with empty segments ("a//b")
    if (!p || p.includes('..') || p.split('/').some(seg => seg.trim() === '')) continue
    out[p] = val
  }

  // Resolve collisions: if a file path P (has an extension) is also used as a
  // directory prefix by another path (P + "/..."), the descendants would force
  // P to be created as a directory on disk. Drop those bogus descendants so the
  // real file survives.
  const keys = Object.keys(out)
  for (const p of keys) {
    if (!(p in out) || !hasExtension(p)) continue
    for (const other of keys) {
      if (other !== p && other.startsWith(p + '/')) delete out[other]
    }
  }

  // Guarantee Tailwind: apps are styled entirely with Tailwind utility classes,
  // but the starter index.html historically shipped without the CDN and the
  // model doesn't always add it on component-split rebuilds — leaving the app
  // unstyled. If an index.html exists without Tailwind, inject the CDN script so
  // both preview and publish render styled.
  // Tailwind: apps are authored entirely with Tailwind utility classes, but the
  // remote builder runs `vite build`, which (verified against the live builder):
  //   1. STRIPS any Tailwind Play CDN <script> from index.html during the build,
  //      so loading Tailwind via CDN does NOT survive — every class goes unstyled.
  //   2. DOES compile @tailwind directives through PostCSS at build time when the
  //      project carries the right inputs: an index.css with the directives plus
  //      a tailwind.config + postcss.config. Given those, it emits fully compiled
  //      utilities (.flex{display:flex}, etc.); without them the app ships unstyled.
  // From-scratch generated apps emit only src/* with a minimal reset index.css and
  // no config, so they render unstyled. Guarantee the compile inputs here — this
  // runs before every preview build and publish, fixing existing projects too.
  const fileContent = (v: FileVal | undefined): string =>
    v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

  let appExt = 'src/App.tsx' in out ? 'tsx' : 'src/App.jsx' in out ? 'jsx' : null

  // If no App.tsx exists but component files do, synthesize a minimal entry
  // point so the Railway Vite build compiles and renders something instead of
  // a blank shell. This fires both at publish time (web editor flow) and at
  // preview-build time — both paths call sanitizeFiles before posting to the
  // builder. build-runner.ts also synthesizes and saves to DB, so this is a
  // second layer of defense for cases that bypass the MCP pipeline.
  if (!appExt) {
    const components = Object.keys(out).filter(p =>
      p.startsWith('src/') &&
      (p.endsWith('.tsx') || p.endsWith('.jsx')) &&
      !p.endsWith('main.tsx') && !p.endsWith('main.jsx')
    )
    if (components.length > 0) {
      const importLines: string[] = []
      const names: string[] = []
      for (const p of components) {
        const name = p.split('/').pop()!.replace(/\.(tsx|jsx)$/, '')
        const rel = './' + p.replace(/^src\//, '').replace(/\.(tsx|jsx)$/, '')
        importLines.push(`import ${name} from '${rel}'`)
        names.push(name)
      }
      const renders = names.map(n => `  <${n} />`).join('\n')
      out['src/App.tsx'] = {
        content: `${importLines.join('\n')}\n\nexport default function App() {\n  return (\n    <>\n${renders}\n    </>\n  )\n}\n`,
        language: 'typescript',
      }
      appExt = 'tsx'
    }
  }

  if (appExt) {
    // 0. Wyber UI kit — premium pre-built components every app can import
    //    (`import { Button } from './wyber-ui'`). Injected like the tailwind
    //    config: transient, never persisted, user files win. Vite tree-shakes
    //    it entirely when the app doesn't import it. Must land before the
    //    stub pass so a kit import is never stubbed as "missing".
    for (const [kitPath, kitContent] of Object.entries(WYBER_UI_KIT_FILES)) {
      if (!(kitPath in out)) out[kitPath] = { content: kitContent, language: 'typescript' }
    }

    // 0b. Wyber Store — local-first persistence (`import { useCollection } from
    //     './wyber-store'`). Same rules as the kit: transient, user files win,
    //     tree-shaken when unused, must land before the stub pass.
    for (const [storePath, storeContent] of Object.entries(WYBER_STORE_FILES)) {
      if (!(storePath in out)) out[storePath] = { content: storeContent, language: 'typescript' }
    }

    // 1. index.css must carry the @tailwind directives AND the design-system
    //    tokens. Apps style themselves with semantic classes (bg-primary,
    //    text-foreground, …) whose values come from per-app HSL tokens; if the
    //    model forgot to define them, inject sane defaults so the app is never
    //    unstyled and `hsl(var(--…))` never resolves to nothing. (Keep any
    //    existing reset / tokens the model wrote — defaults only fill the gap.)
    const TW_DIRECTIVES = '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
    const css = fileContent(out['src/index.css'])
    let nextCss = css
    if (!nextCss.includes('@tailwind')) nextCss = `${TW_DIRECTIVES}\n${nextCss}`
    if (!/--background\s*:/.test(nextCss)) nextCss = `${nextCss.trimEnd()}\n\n${DEFAULT_TOKENS_CSS}`
    if (nextCss !== css) {
      out['src/index.css'] = { content: nextCss.trim() + '\n', language: 'css' }
    }

    // 2. tailwind + postcss config so the builder's PostCSS pass compiles
    //    utilities. The config maps the semantic token names → classes (shared
    //    with the preview engine via design-system.ts so preview == published).
    if (!['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'].some(p => p in out)) {
      out['tailwind.config.js'] = { content: TAILWIND_CONFIG_FILE, language: 'javascript' }
    }
    if (!['postcss.config.js', 'postcss.config.cjs'].some(p => p in out)) {
      out['postcss.config.js'] = {
        content: `export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}\n`,
        language: 'javascript',
      }
    }

    // 2b. package.json must list the FULL stack PLUS the Tailwind/PostCSS toolchain.
    // The builder runs `npm install` from package.json, replacing its pre-installed
    // node_modules — so a starter package.json that omits tailwindcss/autoprefixer
    // makes PostCSS fail ("Cannot find module 'tailwindcss'") and @tailwind ship raw,
    // breaking EVERY cold build; omitted runtime deps (framer-motion, etc.) fail to
    // resolve in Rollup. (Verified against the live builder.) Merge the standard set
    // into whatever package.json exists — existing versions win — so the first build
    // is clean and the result is deterministic (so the builder's install cache hits
    // and iterative edits stay fast).
    const REQUIRED_DEPS: Record<string, string> = {
      react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router-dom': '^6.28.0',
      'lucide-react': '^0.383.0', recharts: '^2.12.7', clsx: '^2.1.1',
      'date-fns': '^3.6.0', 'framer-motion': '^11.0.0', zustand: '^4.5.2', axios: '^1.7.2',
    }
    const REQUIRED_DEV: Record<string, string> = {
      vite: '^5.4.21', '@vitejs/plugin-react': '^4.3.1',
      tailwindcss: '^3.4.4', autoprefixer: '^10.4.19', postcss: '^8.4.38',
      typescript: '^5.5.0', '@types/react': '^18.3.0', '@types/react-dom': '^18.3.0',
    }
    let pkg: Record<string, unknown> = {}
    const rawPkg = fileContent(out['package.json'])
    if (rawPkg) { try { const p = JSON.parse(rawPkg); if (p && typeof p === 'object') pkg = p } catch { /* malformed → rebuild */ } }
    pkg.name = (typeof pkg.name === 'string' && pkg.name) || 'wyber-app'
    pkg.private = true
    pkg.type = 'module'
    pkg.scripts = { dev: 'vite', build: 'vite build', preview: 'vite preview', ...(pkg.scripts as object || {}) }
    pkg.dependencies = { ...REQUIRED_DEPS, ...(pkg.dependencies as object || {}) }
    pkg.devDependencies = { ...REQUIRED_DEV, ...(pkg.devDependencies as object || {}) }

    // 2c. Imports outside the guaranteed set fail the remote build with
    // "Cannot find module 'X'" and burn a self-heal loop (or worse: the model
    // wires Supabase but forgets to add @supabase/supabase-js to package.json,
    // which is NOT in REQUIRED_DEPS). Scan every source file's bare import
    // specifiers and merge pinned versions for the packages models actually
    // reach for. Truly unknown packages are left alone — guessing a version
    // breaks `npm install` harder than the missing module breaks vite, and
    // self-heal already covers that path.
    const KNOWN_DEP_VERSIONS: Record<string, string> = {
      '@supabase/supabase-js': '^2.45.0',
      'react-hot-toast': '^2.4.1', sonner: '^1.5.0',
      '@tanstack/react-query': '^5.51.0',
      uuid: '^9.0.1', nanoid: '^5.0.7', immer: '^10.1.1',
      papaparse: '^5.4.1', xlsx: '^0.18.5', 'file-saver': '^2.0.5',
      'chart.js': '^4.4.3', 'react-chartjs-2': '^5.2.0',
      dayjs: '^1.11.11', lodash: '^4.17.21',
      'react-hook-form': '^7.52.0', zod: '^3.23.8',
      'react-markdown': '^9.0.1', marked: '^13.0.2',
      'qrcode.react': '^3.1.0', jspdf: '^2.5.1', html2canvas: '^1.4.1',
      'react-dropzone': '^14.2.3',
      '@dnd-kit/core': '^6.1.0', '@dnd-kit/sortable': '^8.0.0', '@dnd-kit/utilities': '^3.2.2',
      'react-beautiful-dnd': '^13.1.1',
      'socket.io-client': '^4.7.5',
      'react-icons': '^5.2.1', '@heroicons/react': '^2.1.4',
      'react-select': '^5.8.0', 'react-datepicker': '^7.3.0',
      'emoji-picker-react': '^4.11.1', 'canvas-confetti': '^1.9.3',
      gsap: '^3.12.5', lenis: '^1.1.14',
    }
    const importRe = /(?:import|export)\s+(?:[\w*{}\s,]+?from\s+)?['"]([^'"]+)['"]|(?:import|require)\s*\(\s*['"]([^'"]+)['"]/g
    const bareImports = new Set<string>()
    for (const [p, v] of Object.entries(out)) {
      if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(p)) continue
      for (const m of fileContent(v).matchAll(importRe)) {
        const spec = m[1] || m[2]
        if (!spec || spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/')) continue
        const segs = spec.split('/')
        bareImports.add(spec.startsWith('@') ? segs.slice(0, 2).join('/') : segs[0])
      }
    }
    const depMap = pkg.dependencies as Record<string, string>
    const devDepMap = pkg.devDependencies as Record<string, string>
    for (const name of bareImports) {
      if (depMap[name] || devDepMap[name] || !KNOWN_DEP_VERSIONS[name]) continue
      depMap[name] = KNOWN_DEP_VERSIONS[name]
    }

    out['package.json'] = { content: JSON.stringify(pkg, null, 2) + '\n', language: 'json' }

    // 2d. Top-level ErrorBoundary: a render error in generated code must show a
    // recoverable "something went wrong" card, not a blank white screen. The
    // boundary also swallows the error before window.onerror can see it, so it
    // relays to the parent editor itself (same 'wyber-runtime-error' message the
    // index.html relay sends) — otherwise wrapping App would BLIND the self-heal
    // loop. Generated apps never name a file this way, so no collision risk.
    const boundaryPath = `src/WyberErrorBoundary.${appExt}`
    if (!(boundaryPath in out)) {
      const types = appExt === 'tsx'
      out[boundaryPath] = {
        content: `import React from 'react';
${types ? '\ntype WyberErrorBoundaryState = { error: Error | null };\n' : ''}
export default class WyberErrorBoundary extends React.Component${types ? '<{ children?: React.ReactNode }, WyberErrorBoundaryState>' : ''} {
  state${types ? ': WyberErrorBoundaryState' : ''} = { error: null };
  static getDerivedStateFromError(error${types ? ': Error' : ''}) {
    return { error };
  }
  componentDidCatch(error${types ? ': Error' : ''}) {
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'wyber-runtime-error', message: String(error && error.message ? error.message : error) }, '*');
      }
    } catch { /* relay is best-effort */ }
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16, wordBreak: 'break-word' }}>{String(this.state.error.message || this.state.error)}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#18181b', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
`,
        language: appExt === 'tsx' ? 'typescript' : 'javascript',
      }
    }

    // 3. an entry that imports the stylesheet, and an index.html that loads it.
    const existingMain = ['src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx'].find(p => p in out)
    const mainPath = existingMain ?? `src/main.${appExt}`
    if (existingMain) {
      // The compiled CSS only ships if the entry imports it — ensure it does.
      const mc = fileContent(out[existingMain])
      let nextMain = mc
      if (!nextMain.includes('index.css')) nextMain = `import './index.css';\n${nextMain}`
      // Wrap <App /> in the boundary. Only transform the unambiguous self-closing
      // form — anything fancier the model wrote is left alone (the index.html
      // crash guard still covers those apps).
      if (!nextMain.includes('WyberErrorBoundary') && /<App\s*\/>/.test(nextMain)) {
        nextMain = `import WyberErrorBoundary from './WyberErrorBoundary';\n${nextMain.replace(/<App\s*\/>/, '<WyberErrorBoundary><App /></WyberErrorBoundary>')}`
      }
      if (nextMain !== mc) {
        const mv = out[existingMain]
        out[existingMain] = typeof mv === 'string' ? nextMain : { ...(mv as object), content: nextMain }
      }
    } else {
      const tsBang = appExt === 'tsx' ? '!' : ''
      out[mainPath] = {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import WyberErrorBoundary from './WyberErrorBoundary';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')${tsBang}).render(
  <React.StrictMode>
    <WyberErrorBoundary>
      <App />
    </WyberErrorBoundary>
  </React.StrictMode>
);`,
        language: appExt === 'tsx' ? 'typescript' : 'javascript',
      }
    }
    if (!('index.html' in out)) {
      out['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
    ${GOOGLE_FONTS_LINKS}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${mainPath}"></script>
  </body>
</html>`,
        language: 'html',
      }
    }
  }

  // Runtime-error relay: the preview iframe is served from the remote builder's
  // origin, so the editor CANNOT reach into it and attach window.onerror from
  // outside (PreviewPanel's inject is a silent no-op cross-origin). A bundle
  // that crashes at startup therefore used to be a blank WHITE screen with
  // nothing for the self-heal loop to catch. Bake a tiny relay into index.html
  // that forwards runtime errors to the parent editor via postMessage — the
  // editor already listens for 'wyber-runtime-error'. No-op when the app isn't
  // embedded in an iframe (window.parent === window), so published sites are
  // unaffected. Plain non-module inline script: vite build leaves it untouched
  // and it registers before the app bundle executes.
  // CORS-blocked external API calls (D6): a browser rejects the fetch() promise
  // with a generic "Failed to fetch" TypeError — by design, JS can never see
  // WHY (that would let code probe cross-origin resources). The one place the
  // actual reason surfaces is a console.error the browser's network stack logs
  // itself, invisible to both the 'error' and 'unhandledrejection' listeners
  // below since a fetch the app's own try/catch already handled never reaches
  // either. Previously this meant a real integration failure (an external API
  // that doesn't allow this origin) looked exactly like "the builder is
  // broken" with zero diagnostic signal anywhere. Wrap console.error to spot
  // the browser's own CORS message and relay a distinct, specific type.
  const ERROR_RELAY = `<script>/* wyber-error-relay */(function(){if(window.parent===window)return;var send=function(m,s,l){try{window.parent.postMessage({type:'wyber-runtime-error',message:String(m||'Script error'),source:s?String(s).split('/').pop():undefined,lineno:l},'*')}catch(e){}};window.addEventListener('error',function(e){send(e.message||e.error,e.filename,e.lineno)});window.addEventListener('unhandledrejection',function(e){send(e.reason&&e.reason.message?e.reason.message:e.reason)});var origErr=console.error;console.error=function(){try{var text=Array.prototype.slice.call(arguments).map(function(a){return typeof a==='string'?a:(a&&a.message)||''}).join(' ');if(/cors policy|access-control-allow-origin/i.test(text)){var m=text.match(/https?:\\/\\/[^\\s'"]+/);window.parent.postMessage({type:'wyber-cors-error',message:text.slice(0,300),url:m?m[0]:undefined},'*')}}catch(e){}return origErr.apply(console,arguments)}})()</script>`
  // Crash guard: the React ErrorBoundary only catches errors INSIDE the React
  // tree — a module-init error or a crash before ReactDOM.render leaves #root
  // empty forever (white screen). If an uncaught error fires and #root is still
  // empty shortly after, render a plain-DOM fallback. Runs on published sites
  // too (unlike the relay, which is iframe-only). Message set via textContent —
  // error strings can contain user input, never innerHTML them.
  const CRASH_GUARD = `<script>/* wyber-crash-guard */(function(){var shown=false;function show(msg){if(shown)return;var r=document.getElementById('root');if(!r||r.childElementCount>0)return;shown=true;var wrap=document.createElement('div');wrap.setAttribute('style','min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:24px');var box=document.createElement('div');box.setAttribute('style','max-width:420px;text-align:center');var h=document.createElement('h1');h.setAttribute('style','font-size:20px;font-weight:600;margin-bottom:8px');h.textContent='Something went wrong';var p=document.createElement('p');p.setAttribute('style','font-size:14px;opacity:.7;margin-bottom:16px;word-break:break-word');p.textContent=String(msg||'The app failed to load.');var b=document.createElement('button');b.setAttribute('style','padding:8px 20px;border-radius:8px;border:none;background:#18181b;color:#fff;font-size:14px;cursor:pointer');b.textContent='Reload app';b.onclick=function(){location.reload()};box.appendChild(h);box.appendChild(p);box.appendChild(b);wrap.appendChild(box);r.appendChild(wrap)}window.addEventListener('error',function(e){setTimeout(function(){show(e.message)},100)});window.addEventListener('unhandledrejection',function(e){setTimeout(function(){show(e.reason&&e.reason.message?e.reason.message:e.reason)},100)})})()</script>`
  const idxVal = out['index.html']
  const idxHtml = fileContent(idxVal)
  if (idxHtml) {
    let nextIdx = idxHtml
    // vite:build-html treats every <link href> as an asset and READS the file;
    // href="/" resolves to the project ROOT DIRECTORY → "EISDIR: illegal
    // operation on a directory" and the ENTIRE build fails (verified against
    // the live builder — removing only this tag fixed an otherwise-identical
    // build). Models write <link rel="canonical" href="/"> because the SEO
    // rules offered "/" as the unknown-domain fallback. Strip any <link> whose
    // href is root/empty/dot — the published page hoists real canonical
    // metadata anyway (app/[slug] generateMetadata), so nothing is lost.
    nextIdx = nextIdx.replace(/<link\b[^>]*\bhref=["'](?:\/|\.\/?)?["'][^>]*\/?>[ \t]*(\r?\n)?/gi, '')
    if (!nextIdx.includes('wyber-error-relay')) {
      nextIdx = nextIdx.includes('<head>')
        ? nextIdx.replace('<head>', `<head>\n    ${ERROR_RELAY}`)
        : `${ERROR_RELAY}\n${nextIdx}`
    }
    if (!nextIdx.includes('wyber-crash-guard')) {
      nextIdx = nextIdx.includes('<head>')
        ? nextIdx.replace('<head>', `<head>\n    ${CRASH_GUARD}`)
        : `${CRASH_GUARD}\n${nextIdx}`
    }
    // App identity for wyber-store namespacing: previews and the main-domain
    // shell iframe share an origin across DIFFERENT apps, so persisted data
    // must be keyed by project id, not origin. Inline non-module script —
    // survives the vite build, registers before the bundle (like the relay).
    if (opts?.appId && !nextIdx.includes('wyber-app-id')) {
      const safeId = String(opts.appId).replace(/[^a-zA-Z0-9-]/g, '')
      const APP_ID_TAG = `<script>/* wyber-app-id */window.__WYBER_PROJECT_ID__='${safeId}'</script>`
      nextIdx = nextIdx.includes('<head>')
        ? nextIdx.replace('<head>', `<head>\n    ${APP_ID_TAG}`)
        : `${APP_ID_TAG}\n${nextIdx}`
    }
    // Security badge — opt-in per project (opts.securityBadge is only ever
    // passed by the publish route when the owner enabled it AND the latest
    // scan came back clean). Links to the public verify page, never exposes
    // findings. Plain fixed-position markup, no JS beyond the click-through.
    if (opts?.securityBadge && opts?.appId && !nextIdx.includes('wyber-security-badge')) {
      const safeId = String(opts.appId).replace(/[^a-zA-Z0-9-]/g, '')
      const BADGE = `<a href="https://wyberai.com/verify/${safeId}" target="_blank" rel="noopener noreferrer" id="wyber-security-badge" style="position:fixed;left:14px;bottom:14px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(12,12,16,0.85);color:#fff;font:600 11px/1 -apple-system,system-ui,sans-serif;text-decoration:none;backdrop-filter:blur(6px);box-shadow:0 4px 16px rgba(0,0,0,0.3)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>Scanned by WyberAi</a>`
      nextIdx = nextIdx.includes('</body>')
        ? nextIdx.replace('</body>', `    ${BADGE}\n  </body>`)
        : `${nextIdx}\n${BADGE}`
    }
    if (nextIdx !== idxHtml) {
      out['index.html'] = typeof idxVal === 'string' ? nextIdx : { ...(idxVal as object), content: nextIdx }
    }
  }

  // Completeness pass: stub any locally-imported file that was never generated
  // (truncated big-app builds drop trailing files; planned components sometimes
  // never arrive). Without this the remote build throws "File not found" and the
  // self-heal loop kicks in. Stubbing makes the build compile and render a clean
  // placeholder instead. Only add files that don't already exist.
  const stubs = collectMissingStubs(out)
  for (const [path, val] of Object.entries(stubs)) {
    if (!(path in out)) out[path] = val
  }

  // Image directives → gradient placeholders. The saved source keeps the raw
  // {{wyber-image: …}} tokens, but the REMOTE builder (which renders the live
  // preview) shipped them verbatim inside <img src>, so previews showed broken
  // image icons — users read that as "images not generated" and burned edits
  // trying to fix it. Resolve every leftover token to the same deterministic
  // brand-gradient data URI the in-browser engine uses. The PUBLISH path is
  // unaffected: it substitutes REAL generated image URLs before calling this,
  // so no tokens remain there. Transient like everything else here — the
  // stored project keeps its tokens for publish-time generation.
  for (const [path, val] of Object.entries(out)) {
    if (!/\.(tsx?|jsx?|html?|css)$/i.test(path)) continue
    const content = fileContent(val)
    if (!content.includes('{{')) continue
    const resolved = resolveDirectivesForPreview(content)
    if (resolved !== content) {
      out[path] = typeof val === 'string' ? resolved : { ...(val as object), content: resolved }
    }
  }

  return out as T
}

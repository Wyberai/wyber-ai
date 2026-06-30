// Defensive file-map sanitizer run before sending a project to the remote
// builder / publish. The builder writes every path to disk, so a malformed
// path can make a real file (e.g. index.html) resolve to a DIRECTORY, which
// causes vite to fail with "EISDIR: illegal operation on a directory, read
// index.html". This normalizes paths and resolves file-vs-directory collisions.

import { collectMissingStubs } from './stub-missing-imports'
import { TAILWIND_CONFIG_FILE, DEFAULT_TOKENS_CSS, GOOGLE_FONTS_LINKS } from './design-system'

type FileVal = { content?: string; language?: string } | string

const hasExtension = (p: string) => /\.[a-z0-9]+$/i.test(p)

export function sanitizeFiles<T extends Record<string, FileVal>>(files: T): T {
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
  const appExt = 'src/App.tsx' in out ? 'tsx' : 'src/App.jsx' in out ? 'jsx' : null
  if (appExt) {
    const fileContent = (v: FileVal | undefined): string =>
      v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

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
      vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.1',
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
    out['package.json'] = { content: JSON.stringify(pkg, null, 2) + '\n', language: 'json' }

    // 3. an entry that imports the stylesheet, and an index.html that loads it.
    const existingMain = ['src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx'].find(p => p in out)
    const mainPath = existingMain ?? `src/main.${appExt}`
    if (existingMain) {
      // The compiled CSS only ships if the entry imports it — ensure it does.
      const mc = fileContent(out[existingMain])
      if (!mc.includes('index.css')) {
        const mv = out[existingMain]
        const injected = `import './index.css';\n${mc}`
        out[existingMain] = typeof mv === 'string' ? injected : { ...(mv as object), content: injected }
      }
    } else {
      const tsBang = appExt === 'tsx' ? '!' : ''
      out[mainPath] = {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')${tsBang}).render(
  <React.StrictMode>
    <App />
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

  // Completeness pass: stub any locally-imported file that was never generated
  // (truncated big-app builds drop trailing files; planned components sometimes
  // never arrive). Without this the remote build throws "File not found" and the
  // self-heal loop kicks in. Stubbing makes the build compile and render a clean
  // placeholder instead. Only add files that don't already exist.
  const stubs = collectMissingStubs(out)
  for (const [path, val] of Object.entries(stubs)) {
    if (!(path in out)) out[path] = val
  }

  return out as T
}

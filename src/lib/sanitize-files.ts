// Defensive file-map sanitizer run before sending a project to the remote
// builder / publish. The builder writes every path to disk, so a malformed
// path can make a real file (e.g. index.html) resolve to a DIRECTORY, which
// causes vite to fail with "EISDIR: illegal operation on a directory, read
// index.html". This normalizes paths and resolves file-vs-directory collisions.

import { collectMissingStubs } from './stub-missing-imports'

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

    // 1. index.css must carry the @tailwind directives (keep any existing reset).
    const TW_DIRECTIVES = '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
    const css = fileContent(out['src/index.css'])
    if (!css.includes('@tailwind')) {
      out['src/index.css'] = { content: `${TW_DIRECTIVES}\n${css}`.trim() + '\n', language: 'css' }
    }

    // 2. tailwind + postcss config so the builder's PostCSS pass compiles utilities.
    if (!['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'].some(p => p in out)) {
      out['tailwind.config.js'] = {
        content: `export default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n`,
        language: 'javascript',
      }
    }
    if (!['postcss.config.js', 'postcss.config.cjs'].some(p => p in out)) {
      out['postcss.config.js'] = {
        content: `export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}\n`,
        language: 'javascript',
      }
    }

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

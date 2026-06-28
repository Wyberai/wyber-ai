// Defensive file-map sanitizer run before sending a project to the remote
// builder / publish. The builder writes every path to disk, so a malformed
// path can make a real file (e.g. index.html) resolve to a DIRECTORY, which
// causes vite to fail with "EISDIR: illegal operation on a directory, read
// index.html". This normalizes paths and resolves file-vs-directory collisions.

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
  const TW = '<script src="https://cdn.tailwindcss.com"></script>'
  const idx = out['index.html']
  if (idx) {
    const content = typeof idx === 'string' ? idx : (idx.content ?? '')
    if (content.includes('<head') && !content.includes('cdn.tailwindcss.com')) {
      const injected = content.replace(/<head([^>]*)>/i, `<head$1>\n    ${TW}`)
      out['index.html'] = typeof idx === 'string' ? injected : { ...idx, content: injected }
    }
  } else {
    // No index.html at all: a from-scratch generated app emits only src/* files
    // (index.html isn't in the model's output format), so the remote builder
    // scaffolds its own — and that scaffold ships WITHOUT the Tailwind CDN,
    // leaving every utility class unstyled. Synthesize a proper Vite entry HTML
    // (with the CDN) plus a matching main entry so the builder uses ours and the
    // app renders styled in both preview and publish.
    const appExt = 'src/App.tsx' in out ? 'tsx' : 'src/App.jsx' in out ? 'jsx' : null
    if (appExt) {
      const existingMain = ['src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx'].find(p => p in out)
      const mainPath = existingMain ?? `src/main.${appExt}`
      const hasCss = 'src/index.css' in out
      if (!existingMain) {
        const tsBang = appExt === 'tsx' ? '!' : ''
        out[mainPath] = {
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
${hasCss ? "import './index.css';\n" : ''}ReactDOM.createRoot(document.getElementById('root')${tsBang}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          language: appExt === 'tsx' ? 'typescript' : 'javascript',
        }
      }
      out['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
    ${TW}
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

  return out as T
}

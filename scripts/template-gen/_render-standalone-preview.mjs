// Bundles the full generated multi-page project with esbuild (real import
// resolution across files, not a single-file transpile) and renders it as a
// standalone static HTML page using the exact CDN approach
// src/lib/wyber-preview/engine.ts itself uses (Tailwind Play CDN + esm.sh for
// react/framer-motion/clsx/lucide-react/recharts) — a faithful reproduction
// without needing an authenticated WyberAi session.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

import { WYBER_UI_KIT_SOURCE, WYBER_UI_KIT_PATH } from '../../src/lib/wyber-ui-kit.ts'
import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG } from '../../src/lib/design-system.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dirArg = process.argv[2]
const pilotDir = dirArg
  ? path.isAbsolute(dirArg) ? dirArg : path.join(__dirname, '_pilot-output', dirArg)
  : path.join(__dirname, '_pilot-output', 'boutique-law-firm-case-intake-client-portal')

async function loadProjectFiles(dir) {
  const files = {}
  async function walk(sub) {
    const entries = await readdir(path.join(dir, sub), { withFileTypes: true })
    for (const e of entries) {
      const rel = path.join(sub, e.name).replace(/\\/g, '/')
      if (e.isDirectory()) await walk(rel)
      else files['/' + rel] = await readFile(path.join(dir, rel), 'utf8')
    }
  }
  await walk('')
  return files
}

const projectFiles = await loadProjectFiles(pilotDir)
projectFiles['/' + WYBER_UI_KIT_PATH] = WYBER_UI_KIT_SOURCE

const EXTERNAL = ['react', 'react-dom/client', 'react/jsx-runtime', 'framer-motion', 'clsx', 'lucide-react', 'recharts']

const virtualFsPlugin = {
  name: 'virtual-fs',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (EXTERNAL.includes(args.path)) return { path: args.path, external: true }
      if (args.path.startsWith('.')) {
        const base = args.namespace === 'entry' ? '/src' : path.posix.dirname(args.importer)
        let resolved = path.posix.normalize(path.posix.join(base, args.path))
        const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '/index.tsx', resolved + '/index.ts']
        for (const p of tryPaths) if (projectFiles[p]) return { path: p, namespace: 'vfs' }
        throw new Error(`Cannot resolve "${args.path}" from "${args.importer}"`)
      }
      return { path: args.path, external: true }
    })
    build.onLoad({ filter: /.*/, namespace: 'vfs' }, (args) => {
      const loader = args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.ts') ? 'ts' : 'jsx'
      return { contents: projectFiles[args.path], loader }
    })
  },
}

const entry = '/src/App.tsx'
const result = await esbuild.build({
  stdin: {
    contents: `import App from '${entry}'\nimport { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('root')).render(<App />)`,
    loader: 'tsx',
    resolveDir: '/src',
  },
  bundle: true,
  format: 'esm',
  write: false,
  plugins: [{
    name: 'entry-resolve',
    setup(build) {
      build.onResolve({ filter: /^\/src\/App\.tsx$/ }, (args) => ({ path: args.path, namespace: 'vfs' }))
    },
  }, virtualFsPlugin],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'esnext',
  banner: { js: `import React from 'react'` },
})

const code = result.outputFiles[0].text
const indexCss = projectFiles['/src/index.css'].replace(/@tailwind [a-z]+;\n?/g, '')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pilot preview — full SaaS app</title>
${GOOGLE_FONTS_LINKS}
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG}</script>
<style>
${indexCss}
</style>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "framer-motion": "https://esm.sh/framer-motion@11.0.0?deps=react@18.3.1,react-dom@18.3.1",
    "clsx": "https://esm.sh/clsx@2.1.1",
    "lucide-react": "https://esm.sh/lucide-react@0.383.0?deps=react@18.3.1",
    "recharts": "https://esm.sh/recharts@2.12.0?deps=react@18.3.1,react-dom@18.3.1"
  }
}
</script>
</head>
<body>
<div id="root"></div>
<script type="module">
${code}
</script>
</body>
</html>
`

const outPath = path.join(__dirname, '_pilot-output', 'preview.html')
await writeFile(outPath, html, 'utf8')
console.log('Written:', outPath, `(${(code.length / 1024).toFixed(1)}kb bundle)`)

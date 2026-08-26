// Bundles a generated mobile template with esbuild against a react-native-web
// import map matching src/lib/rnw-preview/shell.ts's pinned versions, to catch
// real syntax/import errors in the generated TSX before it ever reaches the
// actual WyberAi mobile preview pipeline. Usage: node _render-mobile-preview.mjs <dirname>

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dirArg = process.argv[2]
const pilotDir = path.join(__dirname, '_pilot-output-mobile', dirArg)

async function loadProjectFiles(dir) {
  const files = {}
  async function walk(sub) {
    const entries = await readdir(path.join(dir, sub), { withFileTypes: true })
    for (const e of entries) {
      const rel = path.join(sub, e.name).replace(/\\/g, '/')
      if (e.isDirectory()) await walk(rel)
      else if (/\.(tsx?|jsx?)$/.test(e.name)) files['/' + rel] = await readFile(path.join(dir, rel), 'utf8')
    }
  }
  await walk('')
  return files
}

const projectFiles = await loadProjectFiles(pilotDir)
const EXTERNAL = [
  'react', 'react-native', 'react-native-web', 'react/jsx-runtime',
  '@react-navigation/native', '@react-navigation/bottom-tabs',
  'react-native-screens', 'react-native-safe-area-context', 'react-native-gesture-handler',
  '@expo/vector-icons',
]

const virtualFsPlugin = {
  name: 'virtual-fs',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (EXTERNAL.includes(args.path)) return { path: args.path, external: true }
      if (args.path.startsWith('.') || args.path.startsWith('/')) {
        const base = args.namespace === 'entry' ? '/' : path.posix.dirname(args.importer)
        let resolved = args.path.startsWith('/') ? args.path : path.posix.normalize(path.posix.join(base, args.path))
        const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts']
        for (const p of tryPaths) if (projectFiles[p]) return { path: p, namespace: 'vfs' }
        throw new Error(`Cannot resolve "${args.path}" from "${args.importer}"`)
      }
      return { path: args.path, external: true }
    })
    build.onLoad({ filter: /.*/, namespace: 'vfs' }, (args) => {
      const loader = args.path.endsWith('.tsx') ? 'tsx' : 'ts'
      return { contents: projectFiles[args.path], loader }
    })
  },
}

try {
  const result = await esbuild.build({
    stdin: { contents: `import App from '/App.tsx'\nglobalThis.__wyberVerifyApp = App`, loader: 'tsx', resolveDir: '/' },
    bundle: true, format: 'esm', write: false,
    plugins: [{
      name: 'entry-resolve',
      setup(build) { build.onResolve({ filter: /^\/App\.tsx$/ }, (args) => ({ path: args.path, namespace: 'vfs' })) },
    }, virtualFsPlugin],
    jsx: 'automatic',
    target: 'esnext',
    logLevel: 'silent',
  })
  console.log(`[OK] ${dirArg} — bundled cleanly (${(result.outputFiles[0].text.length / 1024).toFixed(1)}kb)`)
} catch (err) {
  console.log(`[FAIL] ${dirArg}`)
  console.log(err.message)
  process.exit(1)
}

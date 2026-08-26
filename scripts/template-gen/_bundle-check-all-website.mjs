// Bundles every generated SaaS/Web App template with esbuild (real
// resolution of bare imports like lucide-react/recharts, not just relative
// paths) to catch the class of bug validate-templates.mjs structurally can't
// see: an invalid named import from a real npm package. Reads directly from
// the local _pilot-output-website directory already produced by build.mjs.

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'
import { WYBER_UI_KIT_SOURCE, WYBER_UI_KIT_PATH } from '../../src/lib/wyber-ui-kit.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '_pilot-output-website')
const repoRoot = path.join(__dirname, '../..') // real dir with node_modules, for bare-specifier resolution

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

const dirs = (await readdir(outDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
let failCount = 0

for (const dirName of dirs) {
  const projectDir = path.join(outDir, dirName)
  const projectFiles = await loadProjectFiles(projectDir)
  if (!projectFiles['/src/App.tsx']) continue // skip non-SaaS-shaped dirs (e.g. website single-page ones lacking this exact path)
  projectFiles['/' + WYBER_UI_KIT_PATH] = WYBER_UI_KIT_SOURCE

  const virtualFsPlugin = {
    name: 'virtual-fs',
    setup(build) {
      // Only intercept relative/absolute imports — bare specifiers (lucide-react,
      // recharts) fall through untouched to esbuild's real node_modules
      // resolver, which is the whole point: it verifies named exports exist.
      build.onResolve({ filter: /^\.{1,2}\// }, (args) => {
        // Only intercept relative imports FROM our own virtual files — a
        // relative import inside a real node_modules package (e.g.
        // lucide-react's own './Icon.mjs') must fall through to esbuild's
        // real filesystem resolver, not our project virtual FS.
        if (args.namespace !== '' && args.namespace !== 'vfs') return undefined
        const base = path.posix.dirname(args.importer)
        const resolved = path.posix.normalize(path.posix.join(base, args.path))
        const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '/index.tsx']
        for (const p of tryPaths) if (projectFiles[p]) return { path: p, namespace: 'vfs' }
        throw new Error(`Cannot resolve local import "${args.path}" from "${args.importer}"`)
      })
      build.onLoad({ filter: /.*/, namespace: 'vfs' }, (args) => {
        const loader = args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.ts') ? 'ts' : 'jsx'
        return { contents: projectFiles[args.path], loader, resolveDir: repoRoot }
      })
    },
  }

  try {
    await esbuild.build({
      stdin: {
        contents: `import App from '/src/App.tsx'\nglobalThis.__wyberVerifyApp = App`,
        loader: 'tsx',
        resolveDir: repoRoot,
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
      logLevel: 'silent',
      // Deliberately NOT external: lucide-react needs real resolution from
      // node_modules so esbuild actually verifies every named import exists
      // — that's the entire point of this check. recharts IS external:
      // it's never in this repo's own node_modules (the real preview engine
      // resolves it purely via esm.sh at runtime), so trying to resolve it
      // locally is a false failure, not a real bug.
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'framer-motion', 'clsx', 'recharts'],
    })
  } catch (err) {
    failCount++
    console.log(`[FAIL] ${dirName}`)
    console.log('  ' + err.message.split('\n').slice(0, 3).join('\n  '))
  }
}

console.log(`\nChecked ${dirs.length} dirs — ${failCount} failed bundling.`)

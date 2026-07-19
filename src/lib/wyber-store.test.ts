import { describe, it, expect } from 'vitest'
import { transform } from 'esbuild'
import { WYBER_STORE_FILES, WYBER_STORE_SOURCE, WYBER_STORE_PROMPT, WYBER_STORE_PATH } from './wyber-store'
import { sanitizeFiles } from './sanitize-files'

// Like the UI kit, the store ships as a STRING into user builds — our own
// tsc/next build never compiles it, so a syntax error here breaks EVERY user
// build while our CI stays green. These tests are the only guard.

describe('wyber-store — source validity', () => {
  it('every store file parses as TS (esbuild, same loader family as both pipelines)', async () => {
    for (const [path, content] of Object.entries(WYBER_STORE_FILES)) {
      await expect(transform(content, { loader: 'ts' }), path).resolves.toBeTruthy()
    }
  })

  it('imports ONLY react (the one dep guaranteed for this module)', () => {
    const importRe = /import\s+[^'"]*?from\s*['"]([^'"]+)['"]/g
    for (const m of WYBER_STORE_SOURCE.matchAll(importRe)) {
      const spec = m[1]
      if (spec.startsWith('.') || spec.startsWith('/')) continue
      expect(spec, `disallowed dependency: ${spec}`).toBe('react')
    }
  })

  it('prompt references only exports that exist in the source', () => {
    const sourceExports = new Set(
      [...WYBER_STORE_SOURCE.matchAll(/export (?:function|interface|const) (\w+)/g)].map(m => m[1]),
    )
    for (const m of WYBER_STORE_PROMPT.matchAll(/import \{ ([^}]+) \} from '\.\/wyber-store'/g)) {
      for (const name of m[1].split(',').map(s => s.trim())) {
        expect(sourceExports.has(name), `prompt references missing export: ${name}`).toBe(true)
      }
    }
  })

  it('a fixture app using useCollection bundles against the store', async () => {
    const { build } = await import('esbuild')
    const APP = `import { useCollection, exportData } from './wyber-store'
type Client = { id: string; name: string; paid: boolean }
export default function App() {
  const [clients, actions] = useCollection<Client>('clients', [{ id: '1', name: 'Asha', paid: false }])
  return <button onClick={() => actions.add({ name: 'New', paid: false })}>{clients.length}{exportData().length}</button>
}`
    const files: Record<string, string> = { 'src/App.tsx': APP, [WYBER_STORE_PATH]: WYBER_STORE_SOURCE }
    const result = await build({
      entryPoints: ['src/App.tsx'],
      bundle: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      external: ['react', 'react/jsx-runtime'],
      plugins: [{
        name: 'virtual-fs',
        setup(b) {
          b.onResolve({ filter: /^\./ }, (args) => {
            const base = args.path.replace(/^\.\//, 'src/').replace(/\.tsx?$/, '')
            return { path: base, namespace: 'v' }
          })
          b.onResolve({ filter: /^src\// }, (args) => ({ path: args.path, namespace: 'v' }))
          b.onLoad({ filter: /.*/, namespace: 'v' }, (args) => {
            const content = files[args.path + '.tsx'] ?? files[args.path + '.ts'] ?? files[args.path]
            return content != null ? { contents: content, loader: 'tsx' } : undefined
          })
        },
      }],
    })
    expect(result.outputFiles[0].text.length).toBeGreaterThan(0)
  })
})

describe('wyber-store — pipeline injection', () => {
  const APP = `import { useCollection } from './wyber-store'
export default function App() { return null }`

  it('sanitizeFiles injects the store for app builds and does not stub its import', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const store = out[WYBER_STORE_PATH] as { content?: string } | undefined
    expect(store?.content).toContain('export function useCollection')
    expect(store?.content).not.toContain('Auto-stub')
  })

  it('user-authored wyber-store.ts wins over the injected module', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      [WYBER_STORE_PATH]: { content: 'export const useCollection = () => [[], {}]' },
    })
    expect((out[WYBER_STORE_PATH] as { content?: string }).content).toBe('export const useCollection = () => [[], {}]')
  })

  it('appId opt injects the wyber-app-id script into index.html exactly once', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { appId: 'proj-123' })
    const idx = out['index.html'] as { content?: string }
    expect(idx?.content).toContain("window.__WYBER_PROJECT_ID__='proj-123'")
    const rerun = sanitizeFiles(out, { appId: 'proj-123' })
    const idx2 = (rerun['index.html'] as { content?: string }).content || ''
    expect(idx2.match(/wyber-app-id/g)?.length).toBe(1)
  })

  it('appId is sanitized against script injection', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { appId: `x'</script><script>alert(1)` })
    const idx = (out['index.html'] as { content?: string }).content || ''
    expect(idx).not.toContain('alert(1)')
    expect(idx).toContain("window.__WYBER_PROJECT_ID__='xscriptscriptalert1'")
  })
})

'use client'

/**
 * WyberPreview Engine
 * 
 * Phase 1: esbuild-wasm in-browser bundler → blob URL iframe (ships now)
 * Phase 2: Service Worker virtual filesystem → real URL iframe (needs preview.wyberai.com)
 * Phase 3: Incremental compilation, module caching, HMR
 * 
 * Architecture:
 *   Generated TSX files
 *       ↓
 *   esbuild-wasm (Web Worker) transpiles TSX → ESM JS
 *   External deps (react, lucide-react, recharts) → esm.sh CDN via importmap
 *       ↓
 *   Phase 1: blob URL injected into full-screen iframe
 *   Phase 2: Service Worker intercepts /wyber-preview/{id}/* requests
 *       ↓
 *   App renders at full screen
 */

import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG, TOKEN_VARS_CSS } from '@/lib/design-system'
import { resolveDirectivesForPreview } from '@/lib/image-directives'
import { WYBER_UI_KIT_FILES } from '@/lib/wyber-ui-kit'
import { WYBER_STORE_FILES } from '@/lib/wyber-store'
import { injectWyberLoc, WYBER_BRIDGE_SCRIPT } from '@/lib/wyber-preview/bridge'

export interface PreviewFile {
  content: string
  path: string
}

export interface BundleResult {
  html: string
  error?: string
  duration: number
}

// External dependencies served from esm.sh CDN
// These are NOT bundled — imported via importmap in the iframe HTML
const EXTERNAL_DEPS: Record<string, string> = {
  'react':                  'https://esm.sh/react@18.3.1',
  'react-dom':              'https://esm.sh/react-dom@18.3.1',
  'react-dom/client':       'https://esm.sh/react-dom@18.3.1/client',
  'react/jsx-runtime':      'https://esm.sh/react@18.3.1/jsx-runtime',
  'lucide-react':           'https://esm.sh/lucide-react@0.383.0',
  'recharts':               'https://esm.sh/recharts@2.12.0',
  'clsx':                   'https://esm.sh/clsx@2.1.1',
  'react-router-dom':       'https://esm.sh/react-router-dom@6.28.0',
  'framer-motion':          'https://esm.sh/framer-motion@11.0.0',
  'date-fns':               'https://esm.sh/date-fns@3.6.0',
  'zustand':                'https://esm.sh/zustand@4.5.2',
  'axios':                  'https://esm.sh/axios@1.7.2',
  // Scroll/motion physics for landing pages. Subpath entries are explicit
  // because the importmap only prefix-maps keys ending in '/'.
  'gsap':                   'https://esm.sh/gsap@3.12.5',
  'gsap/ScrollTrigger':     'https://esm.sh/gsap@3.12.5/ScrollTrigger',
  'lenis':                  'https://esm.sh/lenis@1.1.14',
}

let esbuildInitialized = false
let esbuildInitPromise: Promise<void> | null = null

async function getEsbuild() {
  if (esbuildInitialized) {
    const { default: esbuild } = await import('esbuild-wasm')
    return esbuild
  }
  if (esbuildInitPromise) {
    await esbuildInitPromise
    const { default: esbuild } = await import('esbuild-wasm')
    return esbuild
  }
  esbuildInitPromise = (async () => {
    const { default: esbuild } = await import('esbuild-wasm')
    await esbuild.initialize({
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.24.0/esbuild.wasm',
      worker: true,
    })
    esbuildInitialized = true
  })()
  await esbuildInitPromise
  const { default: esbuild } = await import('esbuild-wasm')
  return esbuild
}

function normalizeFilePath(path: string): string {
  // Normalize to always start with /
  if (!path.startsWith('/')) path = '/' + path
  // Add .tsx if no extension
  if (!path.includes('.')) path += '.tsx'
  return path
}

function resolveImport(from: string, to: string): string {
  if (to.startsWith('/')) return normalizeFilePath(to)
  // Relative import
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const resolved: string[] = []
  for (const p of parts) {
    if (p === '..') resolved.pop()
    else if (p !== '.') resolved.push(p)
  }
  return normalizeFilePath(resolved.join('/'))
}

function getLoader(path: string): 'tsx' | 'ts' | 'css' | 'json' | 'js' {
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.js')) return 'js'
  return 'tsx'
}

// Phase 3: Module cache for incremental compilation
const moduleCache = new Map<string, { content: string; hash: string; compiled: string }>()

function hashContent(content: string): string {
  let h = 0
  for (let i = 0; i < content.length; i++) {
    h = Math.imul(31, h) + content.charCodeAt(i) | 0
  }
  return h.toString(36)
}

/**
 * PHASE 1 + 3: Bundle files using esbuild-wasm
 * Returns compiled JS string
 */
export async function bundleFiles(
  files: Record<string, string>,
  entryPoint = '/src/App.tsx'
): Promise<{ js: string; css: string; error?: string }> {
  const start = performance.now()

  try {
    const esbuild = await getEsbuild()

    // Normalize all file paths, and resolve any image directives to a gradient
    // data URI so the preview shows a tasteful placeholder (never a broken image
    // or literal {{wyber-image}} text). Real images are generated at publish.
    // Also tag JSX DOM elements with data-wyber-loc for the selection bridge
    // (transient — the stored project never carries these attributes).
    const locTagged = injectWyberLoc(files)
    const normalizedFiles: Record<string, string> = {}
    for (const [path, content] of Object.entries(locTagged)) {
      normalizedFiles[normalizeFilePath(path)] = resolveDirectivesForPreview(content)
    }

    // Find entry point (BEFORE merging the UI kit, so an injected kit file can
    // never be picked as the app entry for projects without one)
    let entry = normalizeFilePath(entryPoint)
    if (!normalizedFiles[entry]) {
      // Try common entry points
      const candidates = ['/src/App.tsx', '/App.tsx', '/src/index.tsx', '/index.tsx', '/src/main.tsx']
      entry = candidates.find(c => normalizedFiles[c]) || Object.keys(normalizedFiles).find(k => k.endsWith('.tsx')) || ''
      if (!entry) throw new Error('No entry point found')
    }

    // Inject the Wyber UI kit (premium pre-built components) into the virtual
    // FS so apps can `import { Button } from './wyber-ui'`. User files always
    // win; unused kit exports are tree-shaken out of the bundle.
    for (const [kitPath, kitContent] of Object.entries(WYBER_UI_KIT_FILES)) {
      const np = normalizeFilePath(kitPath)
      if (!normalizedFiles[np]) normalizedFiles[np] = kitContent
    }

    // Same for the Wyber Store (local-first persistence,
    // `import { useCollection } from './wyber-store'`). generateHTML already
    // sets window.__WYBER_PROJECT_ID__, which the store uses for namespacing.
    for (const [storePath, storeContent] of Object.entries(WYBER_STORE_FILES)) {
      const np = normalizeFilePath(storePath)
      if (!normalizedFiles[np]) normalizedFiles[np] = storeContent
    }

    // Phase 3: Check if any files changed
    let allCached = true
    for (const [path, content] of Object.entries(normalizedFiles)) {
      const hash = hashContent(content)
      const cached = moduleCache.get(path)
      if (!cached || cached.hash !== hash) {
        allCached = false
        break
      }
    }

    let collectedCSS = ''

    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      format: 'esm',
      write: false,
      minify: false,
      treeShaking: true,
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.js': 'js',
        '.jsx': 'jsx',
        '.css': 'css',
        '.json': 'json',
      },
      plugins: [
        {
          name: 'wyber-virtual-fs',
          setup(build) {
            // Mark external deps
            build.onResolve({ filter: /.*/ }, args => {
              // Check known externals first
              if (EXTERNAL_DEPS[args.path]) {
                return { path: args.path, external: true }
              }
              // Check partial matches (e.g. lucide-react/icons)
              for (const ext of Object.keys(EXTERNAL_DEPS)) {
                if (args.path.startsWith(ext + '/')) {
                  return { path: args.path, external: true }
                }
              }

              // Resolve relative/absolute imports to virtual namespace.
              // '@/x' is the standard src alias (models emit it occasionally;
              // stub-missing-imports resolves it the same way on publish).
              let resolved: string
              if (args.path.startsWith('@/')) {
                resolved = normalizeFilePath('/src/' + args.path.slice(2))
              } else if (args.path.startsWith('.') || args.path.startsWith('/')) {
                resolved = args.importer
                  ? resolveImport(args.importer, args.path)
                  : normalizeFilePath(args.path)
              } else {
                resolved = '/' + args.path
              }

              // Try with and without extension
              const tryPaths = [
                resolved,
                resolved + '.tsx',
                resolved + '.ts',
                resolved + '.js',
                resolved + '/index.tsx',
                resolved + '/index.ts',
              ]

              for (const p of tryPaths) {
                if (normalizedFiles[p]) {
                  return { path: p, namespace: 'wyber' }
                }
              }

              // Unknown import — mark external, load from esm.sh
              return { path: `https://esm.sh/${args.path}`, external: true }
            })

            // Load from virtual filesystem
            build.onLoad({ filter: /.*/, namespace: 'wyber' }, args => {
              const content = normalizedFiles[args.path]
              if (!content) {
                return { errors: [{ text: `File not found: ${args.path}` }] }
              }

              const loader = getLoader(args.path)

              // Phase 3: Use cache if available
              const hash = hashContent(content)
              const cached = moduleCache.get(args.path)
              if (cached && cached.hash === hash && loader !== 'css') {
                return { contents: cached.compiled, loader }
              }

              // Handle CSS — collect it separately
              if (loader === 'css') {
                collectedCSS += content + '\n'
                return { contents: '', loader: 'js' } // empty module
              }

              moduleCache.set(args.path, { content, hash, compiled: content })
              return { contents: content, loader }
            })
          },
        },
      ],
      external: Object.keys(EXTERNAL_DEPS),
    })

    if (result.errors.length > 0) {
      const errorText = result.errors.map(e => `${e.text} (${e.location?.file}:${e.location?.line})`).join('\n')
      return { js: '', css: '', error: errorText }
    }

    const js = result.outputFiles?.[0]?.text || ''

    // Also extract CSS from files directly
    for (const [path, content] of Object.entries(normalizedFiles)) {
      if (path.endsWith('.css') && !collectedCSS.includes(content.slice(0, 50))) {
        collectedCSS += content + '\n'
      }
    }

    console.log(`[WyberPreview] Bundled in ${Math.round(performance.now() - start)}ms`)
    return { js, css: collectedCSS }
  } catch (err) {
    return { js: '', css: '', error: String(err) }
  }
}

/**
 * PHASE 1: Generate full HTML document for iframe injection
 * Uses importmap for external deps (no CDN fetch at build time)
 */
export function generateHTML(js: string, css: string, projectId: string): string {
  const importmap = JSON.stringify({ imports: EXTERNAL_DEPS }, null, 2)

  // Wrap in try/catch for error display
  const wrappedJS = `
${js}
`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wyber Preview</title>
  ${GOOGLE_FONTS_LINKS}
  <!-- Tailwind Play CDN + the SHARED semantic-token config. Apps are styled with
       semantic classes (bg-primary, text-foreground, border-border, …) whose values
       come from per-app HSL tokens in src/index.css — so each app looks bespoke.
       The same token names + config are used by the compiled publish build
       (src/lib/design-system.ts), so preview and published app render identically.
       Published apps load Tailwind via their compiled CSS; the preview builds its
       own shell, so load the CDN + config here. -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG};</script>
  <script type="importmap">${importmap}</script>
  <style>
    /* Default token values — a safety net so previews are never unstyled before
       the app's own index.css (injected below) overrides them. */
    ${TOKEN_VARS_CSS}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
    body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-family: var(--font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif); -webkit-font-smoothing: antialiased; }
  </style>
  <style id="app-styles">${css}</style>
</head>
<body>
  <div id="root"></div>
  <div id="wyber-error" style="display:none;position:fixed;inset:0;background:#09090b;color:#ef4444;font-family:monospace;padding:24px;font-size:13px;overflow:auto;z-index:9999;white-space:pre-wrap;"></div>
  <script type="module">
    window.__WYBER_PROJECT_ID__ = '${projectId}';
    
    // Error display
    function showError(msg) {
      const el = document.getElementById('wyber-error');
      if (el) { el.style.display = 'block'; el.textContent = '⚠ Preview Error\\n\\n' + msg; }
      console.error('[WyberPreview]', msg);
    }

    // Global error handler
    window.addEventListener('error', e => showError(e.message + '\\n' + (e.filename ? e.filename + ':' + e.lineno : '')));
    window.addEventListener('unhandledrejection', e => showError(String(e.reason)));
    
    try {
      ${wrappedJS}
    } catch(e) {
      showError(String(e) + '\\n\\n' + (e.stack || ''));
    }

    // Phase 3: HMR via BroadcastChannel
    const hmrChannel = new BroadcastChannel('wyber-hmr-${projectId}');
    hmrChannel.addEventListener('message', (e) => {
      if (e.data?.type === 'reload') {
        window.location.reload();
      }
    });
  </script>
  ${WYBER_BRIDGE_SCRIPT}
</body>
</html>`
}

/**
 * PHASE 1: Create a blob URL for the preview HTML
 * Returns URL that can be set as iframe src
 */
export function createBlobURL(html: string): string {
  const blob = new Blob([html], { type: 'text/html' })
  return URL.createObjectURL(blob)
}

/**
 * PHASE 2: Register the Wyber service worker
 * The SW intercepts /wyber-preview/{projectId}/* requests
 */
export async function registerPreviewServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    const reg = await navigator.serviceWorker.register('/wyber-preview-sw.js', {
      scope: '/wyber-preview/',
    })
    await navigator.serviceWorker.ready
    console.log('[WyberPreview] Service Worker registered', reg.scope)
    return reg
  } catch (err) {
    console.warn('[WyberPreview] SW registration failed (falling back to blob URL):', err)
    return null
  }
}

/**
 * PHASE 2: Send compiled files to the service worker
 */
export function sendFilesToServiceWorker(
  projectId: string,
  html: string
): void {
  if (!navigator.serviceWorker?.controller) return

  navigator.serviceWorker.controller.postMessage({
    type: 'WYBER_UPDATE_FILES',
    projectId,
    html,
    timestamp: Date.now(),
  })
}

/**
 * PHASE 2: Get the service worker preview URL for a project
 */
export function getServiceWorkerURL(projectId: string): string {
  return `/wyber-preview/${projectId}/`
}

/**
 * PHASE 3: Hot Module Replacement via BroadcastChannel
 * Signals the iframe to reload without full page refresh
 */
export function triggerHMR(projectId: string): void {
  try {
    const channel = new BroadcastChannel(`wyber-hmr-${projectId}`)
    channel.postMessage({ type: 'reload', timestamp: Date.now() })
    channel.close()
  } catch {
    // BroadcastChannel not available in some contexts
  }
}

/**
 * PHASE 3: Clear the module cache (call when files are deleted or renamed)
 */
export function clearModuleCache(): void {
  moduleCache.clear()
}

/**
 * Main entry point: compile files and get preview URL
 * Tries Phase 2 (SW) first, falls back to Phase 1 (blob URL)
 */
export async function compileAndPreview(
  files: Record<string, string>,
  projectId: string,
  preferServiceWorker = true
): Promise<{ url: string; error?: string; duration: number; phase: 1 | 2 }> {
  const start = performance.now()

  const { js, css, error } = await bundleFiles(files)

  if (error && !js) {
    // Still generate error HTML so user sees the error in preview
    const errorHTML = generateHTML(
      `document.getElementById('wyber-error').style.display='block'; document.getElementById('wyber-error').textContent='⚠ Build Error\\n\\n${error.replace(/'/g, "\\'").replace(/\n/g, '\\n')}';`,
      '',
      projectId
    )
    return {
      url: createBlobURL(errorHTML),
      error,
      duration: Math.round(performance.now() - start),
      phase: 1,
    }
  }

  const html = generateHTML(js, css, projectId)

  // Try Phase 2: Service Worker
  if (preferServiceWorker && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const sw = await registerPreviewServiceWorker()
      if (sw && navigator.serviceWorker.controller) {
        sendFilesToServiceWorker(projectId, html)
        const swURL = getServiceWorkerURL(projectId)
        return {
          url: swURL,
          error: error,
          duration: Math.round(performance.now() - start),
          phase: 2,
        }
      }
    } catch {
      // SW failed — fall through to Phase 1
    }
  }

  // Phase 1: Blob URL fallback
  const blobURL = createBlobURL(html)
  return {
    url: blobURL,
    error,
    duration: Math.round(performance.now() - start),
    phase: 1,
  }
}

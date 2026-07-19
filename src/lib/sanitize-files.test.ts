import { describe, it, expect } from 'vitest'
import { sanitizeFiles } from './sanitize-files'

// Helper: read content regardless of whether a file value is a string or {content}
const contentOf = (v: unknown): string =>
  typeof v === 'string' ? v : ((v as { content?: string })?.content ?? '')

const APP = `import { useState } from 'react'
export default function App() {
  return <div className="flex h-screen bg-zinc-950">hello</div>
}`

describe('sanitizeFiles — path normalization', () => {
  it('strips leading ./ and / and trailing slashes', () => {
    // No App entry here, so the Tailwind synthesis (tested separately) does not run.
    const out = sanitizeFiles({ './src/util.ts': { content: 'x' }, '/index.css/': { content: 'y' } })
    expect(Object.keys(out).sort()).toEqual(['index.css', 'src/util.ts'])
  })

  it('drops parent-traversal and empty-segment paths', () => {
    const out = sanitizeFiles({
      'src/util.ts': { content: 'x' },
      '../evil.ts': { content: 'x' },
      'a//b.ts': { content: 'x' },
    })
    expect('../evil.ts' in out).toBe(false)
    expect('a//b.ts' in out).toBe(false)
    expect('src/util.ts' in out).toBe(true)
  })

  it('drops descendants that would force a file path to become a directory', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      'src/App.tsx/bogus.ts': { content: 'x' },
    })
    expect('src/App.tsx/bogus.ts' in out).toBe(false)
    expect('src/App.tsx' in out).toBe(true)
  })
})

// vite:build-html reads every <link href> as an asset file; href="/" resolves
// to the project root DIRECTORY → EISDIR and the entire remote build fails.
// (Verified against the live builder: removing only the canonical tag turned
// the identical build green.) Models wrote it because the SEO prompt offered
// "/" as the unknown-domain canonical fallback.
describe('sanitizeFiles — strips root-href <link> tags that crash vite (EISDIR)', () => {
  const HTML = `<!DOCTYPE html><html><head>
    <link rel="canonical" href="/" />
    <link rel="stylesheet" href="/src/real.css" />
    <link rel="canonical" href="https://example.com/" />
  </head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`

  it('removes href="/" links but keeps real hrefs', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'index.html': { content: HTML } })
    const html = contentOf(out['index.html'])
    expect(html).not.toContain('href="/"')
    expect(html).toContain('href="/src/real.css"')
    expect(html).toContain('href="https://example.com/"')
  })

  it('removes empty and dot hrefs too', () => {
    const bad = '<head><link rel="canonical" href="" /><link rel="canonical" href="./" /></head>'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'index.html': { content: bad } })
    const html = contentOf(out['index.html'])
    expect(html).not.toContain('rel="canonical"')
  })
})

// The remote builder renders the live preview; raw {{wyber-image}} tokens in
// <img src> showed as broken images there ("images not generated"). Sanitize
// resolves leftovers to gradient data URIs. Publish substitutes REAL image
// URLs before sanitizing, so no tokens remain on that path.
describe('sanitizeFiles — resolves {{wyber-image}} tokens to gradient placeholders', () => {
  it('replaces tokens in code files with a data URI', () => {
    const withImg = `export default function App() {
  return <img src="{{wyber-image: mountain sunrise | 16:9}}" alt="peak" />
}`
    const out = sanitizeFiles({ 'src/App.tsx': { content: withImg } })
    const app = contentOf(out['src/App.tsx'])
    expect(app).not.toContain('{{wyber-image')
    expect(app).toContain('data:image/svg+xml')
  })

  it('leaves already-resolved real URLs alone', () => {
    const withUrl = `export default function App() {
  return <img src="https://cdn.example.com/x.png" alt="x" />
}`
    const out = sanitizeFiles({ 'src/App.tsx': { content: withUrl } })
    expect(contentOf(out['src/App.tsx'])).toContain('https://cdn.example.com/x.png')
  })
})

// The remote builder runs `vite build`, which strips a Tailwind Play CDN script
// but DOES compile @tailwind directives via PostCSS. So styling depends on the
// compile inputs (index.css directives + tailwind/postcss config) being present.
describe('sanitizeFiles — guarantees Tailwind compile inputs (BUG-1)', () => {
  it('adds @tailwind directives to a project that has none', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const css = contentOf(out['src/index.css'])
    expect(css).toContain('@tailwind base')
    expect(css).toContain('@tailwind components')
    expect(css).toContain('@tailwind utilities')
  })

  it('prepends directives while preserving an existing reset', () => {
    const reset = 'body { margin: 0; }'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/index.css': { content: reset } })
    const css = contentOf(out['src/index.css'])
    expect(css).toContain('@tailwind utilities')
    expect(css).toContain(reset)
    expect(css.indexOf('@tailwind')).toBeLessThan(css.indexOf(reset))
  })

  it('does not duplicate @tailwind directives, but injects default tokens when missing', () => {
    const css = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody{}'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/index.css': { content: css } })
    const result = contentOf(out['src/index.css'])
    expect(result.match(/@tailwind base/g)?.length).toBe(1) // directives appear exactly once
    expect(result).toContain('body{}')                       // original reset preserved
    expect(result).toContain('--background:')                // default semantic tokens injected
    expect(result).toContain('--primary:')
  })

  it('does NOT inject default tokens when the app already defines them', () => {
    const css = '@tailwind base;\n:root { --background: 220 40% 6%; --primary: 245 80% 60%; }'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/index.css': { content: css } })
    const result = contentOf(out['src/index.css'])
    expect(result).toContain('220 40% 6%')   // the app's own value survives
    expect(result).not.toContain('0 0% 100%') // default light value not appended
  })

  it('creates tailwind.config.js and postcss.config.js when absent', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    expect('tailwind.config.js' in out).toBe(true)
    expect('postcss.config.js' in out).toBe(true)
    expect(contentOf(out['tailwind.config.js'])).toContain('./src/**/*.{js,ts,jsx,tsx}')
    // maps semantic tokens → classes so bg-primary / text-foreground compile
    expect(contentOf(out['tailwind.config.js'])).toContain('hsl(var(--primary))')
    expect(contentOf(out['tailwind.config.js'])).toContain('hsl(var(--background))')
    expect(contentOf(out['postcss.config.js'])).toContain('tailwindcss')
    expect(contentOf(out['postcss.config.js'])).toContain('autoprefixer')
  })

  it('does not overwrite an existing tailwind/postcss config', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      'tailwind.config.ts': { content: '// custom' },
      'postcss.config.cjs': { content: '// custom' },
    })
    expect('tailwind.config.js' in out).toBe(false)
    expect('postcss.config.js' in out).toBe(false)
    expect(contentOf(out['tailwind.config.ts'])).toBe('// custom')
  })
})

// The builder runs `npm install` from package.json, so it must list the tailwind
// toolchain (or @tailwind ships raw) and the full runtime stack (or imports fail).
describe('sanitizeFiles — completes package.json (cold-build fix)', () => {
  const pkgOf = (out: Record<string, unknown>) => JSON.parse(contentOf(out['package.json']))

  it('adds a complete package.json when none exists', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const p = pkgOf(out)
    expect(p.devDependencies.tailwindcss).toBeTruthy()
    expect(p.devDependencies.autoprefixer).toBeTruthy()
    expect(p.devDependencies.postcss).toBeTruthy()
    expect(p.dependencies['lucide-react']).toBeTruthy()
    expect(p.dependencies['framer-motion']).toBeTruthy()
    expect(p.dependencies.recharts).toBeTruthy()
  })

  it('completes a starter package.json that omits the tailwind toolchain', () => {
    const starter = JSON.stringify({
      name: 'my-app', private: true, type: 'module',
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', 'lucide-react': '^0.300.0' },
      devDependencies: { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' },
    })
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'package.json': { content: starter } })
    const p = pkgOf(out)
    expect(p.devDependencies.tailwindcss).toBeTruthy() // added — the missing piece
    expect(p.name).toBe('my-app')                       // preserved
    expect(p.dependencies.react).toBe('^18.2.0')        // existing version wins
  })

  it('rebuilds a malformed package.json instead of failing', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'package.json': { content: '{ not json' } })
    const p = pkgOf(out)
    expect(p.devDependencies.tailwindcss).toBeTruthy()
  })

  it('does not add a package.json when there is no App entry', () => {
    const out = sanitizeFiles({ 'src/util.ts': { content: 'export const x = 1' } })
    expect('package.json' in out).toBe(false)
  })
})

describe('sanitizeFiles — entry + index.html', () => {
  it('synthesizes a main entry that imports the stylesheet and an index.html that loads it', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const main = contentOf(out['src/main.tsx'])
    expect(main).toContain("import App from './App'")
    expect(main).toContain("import './index.css'")
    expect(main).toContain("getElementById('root')!") // TS non-null assertion for .tsx
    const html = contentOf(out['index.html'])
    expect(html).toContain('<script type="module" src="/src/main.tsx">')
    expect(html).toContain('<div id="root">')
  })

  it('uses a .jsx entry (no TS non-null assertion) for a src/App.jsx app', () => {
    const out = sanitizeFiles({ 'src/App.jsx': { content: APP } })
    expect('src/main.jsx' in out).toBe(true)
    expect(contentOf(out['index.html'])).toContain('src="/src/main.jsx"')
    expect(contentOf(out['src/main.jsx'])).not.toContain("getElementById('root')!")
  })

  it('does not overwrite an existing entry, but ensures it imports the stylesheet', () => {
    const customMain = "// my entry\nimport App from './App'\n"
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: customMain } })
    const main = contentOf(out['src/main.tsx'])
    expect(main).toContain('// my entry')
    expect(main).toContain("import './index.css'")
    expect(contentOf(out['index.html'])).toContain('src="/src/main.tsx"')
  })

  it('preserves an existing index.html (points at its own entry, no synthesis)', () => {
    const html = '<!doctype html><html><head><title>x</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: "import './index.css'" }, 'index.html': { content: html } })
    const result = contentOf(out['index.html'])
    // Only the error relay is injected — everything the model wrote survives.
    expect(result).toContain('<title>x</title>')
    expect(result).toContain('src="/src/main.tsx"')
    expect(result).toContain('wyber-error-relay')
  })

  it('does nothing structural when there is no App entry', () => {
    const out = sanitizeFiles({ 'src/index.css': { content: 'body{}' } })
    expect('index.html' in out).toBe(false)
    expect('tailwind.config.js' in out).toBe(false)
    expect(contentOf(out['src/index.css'])).toBe('body{}')
  })
})

describe('sanitizeFiles — security badge (opt-in, publish-time only)', () => {
  it('injects the badge when securityBadge + appId are both passed', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { appId: 'proj-123', securityBadge: { score: 92 } })
    const html = contentOf(out['index.html'])
    expect(html).toContain('wyber-security-badge')
    expect(html).toContain('/verify/proj-123')
  })

  it('does not inject a badge when securityBadge is omitted (the default, non-publish path)', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { appId: 'proj-123' })
    expect(contentOf(out['index.html'])).not.toContain('wyber-security-badge')
  })

  it('does not inject a badge without an appId, even if securityBadge is passed', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { securityBadge: { score: 92 } })
    expect(contentOf(out['index.html'])).not.toContain('wyber-security-badge')
  })

  it('does not double-inject on a second sanitize pass', () => {
    const once = sanitizeFiles({ 'src/App.tsx': { content: APP } }, { appId: 'proj-123', securityBadge: { score: 92 } })
    const twice = sanitizeFiles(once, { appId: 'proj-123', securityBadge: { score: 92 } })
    const html = contentOf(twice['index.html'])
    expect(html.split('wyber-security-badge').length - 1).toBe(1)
  })
})

// Cross-origin preview iframes can't have window.onerror attached from the
// editor side, so every index.html must carry its own error relay that
// postMessages runtime crashes ('wyber-runtime-error') to the parent editor.
describe('sanitizeFiles — runtime-error relay (blank-white-preview fix)', () => {
  it('injects the relay into a synthesized index.html', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const html = contentOf(out['index.html'])
    expect(html).toContain('wyber-error-relay')
    expect(html).toContain('wyber-runtime-error')
    // Relay registers in <head>, before the app bundle in <body> executes.
    expect(html.indexOf('wyber-error-relay')).toBeLessThan(html.indexOf('<body>'))
  })

  it('injects the relay into a model-written index.html exactly once', () => {
    const html = '<!doctype html><html><head></head><body><div id="root"></div></body></html>'
    const once = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: "import './index.css'" }, 'index.html': { content: html } })
    const twice = sanitizeFiles(once)
    const result = contentOf(twice['index.html'])
    expect(result.split('wyber-error-relay').length - 1).toBe(1)
  })

  it('is a no-op for the relay when there is no index.html at all', () => {
    const out = sanitizeFiles({ 'src/util.ts': { content: 'x' } })
    expect('index.html' in out).toBe(false)
  })
})

// A render error in generated code must show a recoverable card, not a blank
// screen: every app gets a WyberErrorBoundary wrapped around <App />, and
// index.html gets a plain-DOM crash guard for errors before React even mounts.
describe('sanitizeFiles — error boundary + crash guard', () => {
  it('creates the boundary file and wraps <App /> in a synthesized entry', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    expect('src/WyberErrorBoundary.tsx' in out).toBe(true)
    const boundary = contentOf(out['src/WyberErrorBoundary.tsx'])
    expect(boundary).toContain('getDerivedStateFromError')
    expect(boundary).toContain('wyber-runtime-error') // relays so self-heal still sees the error
    const main = contentOf(out['src/main.tsx'])
    expect(main).toContain("import WyberErrorBoundary from './WyberErrorBoundary'")
    expect(main).toContain('<WyberErrorBoundary>')
    expect(main.indexOf('<WyberErrorBoundary>')).toBeLessThan(main.indexOf('<App />'))
    expect(main.indexOf('<App />')).toBeLessThan(main.indexOf('</WyberErrorBoundary>'))
  })

  it('emits an untyped .jsx boundary for a jsx app', () => {
    const out = sanitizeFiles({ 'src/App.jsx': { content: APP } })
    expect('src/WyberErrorBoundary.jsx' in out).toBe(true)
    expect(contentOf(out['src/WyberErrorBoundary.jsx'])).not.toContain(': Error')
  })

  it('wraps <App /> in a model-written entry (unambiguous self-closing form only)', () => {
    const customMain = "import App from './App'\nimport './index.css'\ncreateRoot(el).render(<App />)\n"
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: customMain } })
    const main = contentOf(out['src/main.tsx'])
    expect(main).toContain("import WyberErrorBoundary from './WyberErrorBoundary'")
    expect(main).toContain('<WyberErrorBoundary><App /></WyberErrorBoundary>')
  })

  it('leaves a non-standard entry alone and does not double-wrap on re-run', () => {
    const fancy = "import App from './App'\nimport './index.css'\nrender(<App prop={1}>x</App>)\n"
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: fancy } })
    expect(contentOf(out['src/main.tsx'])).not.toContain('WyberErrorBoundary')
    const wrapped = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const rerun = sanitizeFiles(wrapped)
    const main = contentOf(rerun['src/main.tsx'])
    expect(main.split("from './WyberErrorBoundary'").length - 1).toBe(1)
  })

  it('never overwrites a user file that happens to share the boundary path', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      'src/WyberErrorBoundary.tsx': { content: '// custom' },
    })
    expect(contentOf(out['src/WyberErrorBoundary.tsx'])).toBe('// custom')
  })

  it('injects the crash guard into index.html exactly once', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const html = contentOf(out['index.html'])
    expect(html).toContain('wyber-crash-guard')
    // Unlike the relay, the guard must work on PUBLISHED sites (no iframe check
    // on its show path) — it renders via textContent, never innerHTML.
    expect(html).not.toContain('innerHTML')
    const rerun = sanitizeFiles(out)
    expect(contentOf(rerun['index.html']).split('wyber-crash-guard').length - 1).toBe(1)
  })
})

// Imports outside REQUIRED_DEPS fail the remote build ("Cannot find module") —
// most damagingly @supabase/supabase-js, which every Supabase-wired app needs
// but which is not in the always-merged set. Known packages get pinned
// versions merged into package.json; unknown (hallucinated) ones are left for
// self-heal rather than poisoning npm install with a bad guess.
describe('sanitizeFiles — import-based dependency detection', () => {
  const pkgOf = (out: Record<string, unknown>) =>
    JSON.parse(contentOf(out['package.json' as keyof typeof out])) as {
      dependencies: Record<string, string>
    }

  it('adds known packages found in imports (incl. scoped ones)', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      'src/lib/supabase.ts': { content: "import { createClient } from '@supabase/supabase-js'\nexport const supabase = createClient('u', 'k')" },
      'src/Upload.tsx': { content: "import Papa from 'papaparse'\nexport const x = () => Papa" },
    })
    const pkg = pkgOf(out)
    expect(pkg.dependencies['@supabase/supabase-js']).toBeTruthy()
    expect(pkg.dependencies['papaparse']).toBeTruthy()
  })

  it('ignores relative, alias, and unknown imports', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: `import { x } from './util'\nimport y from '@/lib/thing'\nimport z from 'totally-hallucinated-pkg'\n${APP}` },
    })
    const pkg = pkgOf(out)
    expect(pkg.dependencies['totally-hallucinated-pkg']).toBeUndefined()
    expect(Object.keys(pkg.dependencies).some(k => k.startsWith('.') || k.startsWith('@/'))).toBe(false)
  })

  it('never overrides a version the model already pinned', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: `import dayjs from 'dayjs'\n${APP}` },
      'package.json': { content: JSON.stringify({ dependencies: { dayjs: '^1.0.0' } }) },
    })
    expect(pkgOf(out).dependencies['dayjs']).toBe('^1.0.0')
  })

  it('catches dynamic imports too', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: `const load = () => import('canvas-confetti')\n${APP}` },
    })
    expect(pkgOf(out).dependencies['canvas-confetti']).toBeTruthy()
  })
})

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
    expect(contentOf(out['index.html'])).toBe(html)
  })

  it('does nothing structural when there is no App entry', () => {
    const out = sanitizeFiles({ 'src/index.css': { content: 'body{}' } })
    expect('index.html' in out).toBe(false)
    expect('tailwind.config.js' in out).toBe(false)
    expect(contentOf(out['src/index.css'])).toBe('body{}')
  })
})

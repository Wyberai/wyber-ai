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

  it('does not duplicate directives when index.css already has them', () => {
    const css = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody{}'
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/index.css': { content: css } })
    expect(contentOf(out['src/index.css'])).toBe(css)
  })

  it('creates tailwind.config.js and postcss.config.js when absent', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    expect('tailwind.config.js' in out).toBe(true)
    expect('postcss.config.js' in out).toBe(true)
    expect(contentOf(out['tailwind.config.js'])).toContain('./src/**/*.{js,ts,jsx,tsx}')
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

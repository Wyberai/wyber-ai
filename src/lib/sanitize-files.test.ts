import { describe, it, expect } from 'vitest'
import { sanitizeFiles } from './sanitize-files'

// Helper: read content regardless of whether a file value is a string or {content}
const contentOf = (v: unknown): string =>
  typeof v === 'string' ? v : ((v as { content?: string })?.content ?? '')

const CDN = 'cdn.tailwindcss.com'

const APP = `import { useState } from 'react'
export default function App() {
  return <div className="flex h-screen bg-zinc-950">hello</div>
}`

describe('sanitizeFiles — path normalization', () => {
  it('strips leading ./ and / and trailing slashes', () => {
    // No App entry here, so synthesis (tested separately) does not kick in.
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
      'index.html': { content: '<head></head>' },
      'index.html/bogus.ts': { content: 'x' },
    })
    expect('index.html/bogus.ts' in out).toBe(false)
    expect('index.html' in out).toBe(true)
  })
})

describe('sanitizeFiles — Tailwind CDN on existing index.html', () => {
  it('injects the CDN into an index.html that lacks it', () => {
    const out = sanitizeFiles({
      'index.html': { content: '<!doctype html><html><head><title>x</title></head><body></body></html>' },
      'src/App.tsx': { content: APP },
    })
    expect(contentOf(out['index.html'])).toContain(CDN)
  })

  it('does not double-inject when the CDN is already present', () => {
    const html = `<!doctype html><html><head><script src="https://${CDN}"></script></head><body></body></html>`
    const out = sanitizeFiles({ 'index.html': { content: html }, 'src/App.tsx': { content: APP } })
    const occurrences = contentOf(out['index.html']).split(CDN).length - 1
    expect(occurrences).toBe(1)
  })

  it('preserves the non-content fields of an existing index.html file object', () => {
    const out = sanitizeFiles({
      'index.html': { content: '<head></head>', language: 'html' },
      'src/App.tsx': { content: APP },
    })
    expect((out['index.html'] as { language?: string }).language).toBe('html')
  })
})

describe('sanitizeFiles — synthesizes index.html when absent (BUG-1)', () => {
  it('creates an index.html with the CDN when a src/App.tsx exists but no index.html', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    expect('index.html' in out).toBe(true)
    const html = contentOf(out['index.html'])
    expect(html).toContain(CDN)
    expect(html).toContain('<script type="module" src="/src/main.tsx">')
    expect(html).toContain('<div id="root">')
  })

  it('synthesizes a src/main.tsx entry that imports App and index.css', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/index.css': { content: 'body{}' } })
    const main = contentOf(out['src/main.tsx'])
    expect(main).toContain("import App from './App'")
    expect(main).toContain("import './index.css'")
    expect(main).toContain("getElementById('root')!") // TS non-null assertion for .tsx
  })

  it('omits the index.css import when no src/index.css is present', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    expect(contentOf(out['src/main.tsx'])).not.toContain("import './index.css'")
  })

  it('uses a .jsx entry (no TS non-null assertion) for a src/App.jsx app', () => {
    const out = sanitizeFiles({ 'src/App.jsx': { content: APP } })
    expect('src/main.jsx' in out).toBe(true)
    const html = contentOf(out['index.html'])
    expect(html).toContain('src="/src/main.jsx"')
    expect(contentOf(out['src/main.jsx'])).toContain("getElementById('root')")
    expect(contentOf(out['src/main.jsx'])).not.toContain("getElementById('root')!")
  })

  it('does not overwrite an existing main entry; points index.html at it', () => {
    const existingMain = "// my custom entry\nimport App from './App'"
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP }, 'src/main.tsx': { content: existingMain } })
    expect(contentOf(out['src/main.tsx'])).toBe(existingMain)
    expect(contentOf(out['index.html'])).toContain('src="/src/main.tsx"')
  })

  it('does NOT synthesize an index.html when there is no App entry', () => {
    const out = sanitizeFiles({ 'src/index.css': { content: 'body{}' } })
    expect('index.html' in out).toBe(false)
    expect('src/main.tsx' in out).toBe(false)
  })
})

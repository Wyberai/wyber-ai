import { describe, it, expect } from 'vitest'
import { injectWyberLoc, injectPreviewBridge, WYBER_BRIDGE_SCRIPT } from './bridge'

const file = (content: string) => ({ content, language: 'typescript' })

describe('injectWyberLoc', () => {
  it('tags lowercase DOM elements with path:line', () => {
    const files = injectWyberLoc({
      'src/App.tsx': file(`export default function App() {\n  return (\n    <div className="x">\n      <h1>Hello</h1>\n    </div>\n  )\n}`),
    })
    const out = (files['src/App.tsx'] as { content: string }).content
    expect(out).toContain('<div data-wyber-loc="src/App.tsx:3" className="x">')
    expect(out).toContain('<h1 data-wyber-loc="src/App.tsx:4">Hello</h1>')
  })

  it('never tags capitalized components', () => {
    const files = injectWyberLoc({ 'src/App.tsx': file(`const a = <Card title="x" />`) })
    expect((files['src/App.tsx'] as { content: string }).content).not.toContain('data-wyber-loc')
  })

  it('never adds or removes lines (line numbers stay stable)', () => {
    const src = `export default function App() {\n  return <div>\n    <p>hi</p>\n  </div>\n}`
    const files = injectWyberLoc({ 'src/App.tsx': file(src) })
    expect((files['src/App.tsx'] as { content: string }).content.split('\n').length).toBe(src.split('\n').length)
  })

  it('skips comparisons and strings', () => {
    const src = [
      `const ok = a < b ? 1 : 2`,
      `const s = "<div>not jsx</div>"`,
      `// <div>commented out</div>`,
    ].join('\n')
    const files = injectWyberLoc({ 'src/x.tsx': file(src) })
    expect((files['src/x.tsx'] as { content: string }).content).toBe(src)
  })

  it('skips non-jsx files and is idempotent', () => {
    const css = { 'src/index.css': file(':root { color: red }') }
    expect(injectWyberLoc(css)).toEqual(css)
    const once = injectWyberLoc({ 'src/App.tsx': file(`const a = <div className="x" />`) })
    const twice = injectWyberLoc(once)
    const out = (twice['src/App.tsx'] as { content: string }).content
    expect(out.match(/data-wyber-loc/g)?.length).toBe(1)
  })

  it('works with plain-string file values', () => {
    const files = injectWyberLoc({ 'src/App.tsx': `const a = () => <span>hi</span>` })
    expect(files['src/App.tsx']).toContain('data-wyber-loc="src/App.tsx:1"')
  })
})

describe('injectPreviewBridge', () => {
  it('appends the bridge script before </body> exactly once', () => {
    const files = { 'index.html': file('<html><head></head><body><div id="root"></div></body></html>') }
    const once = injectPreviewBridge(files)
    const html = (once['index.html'] as { content: string }).content
    expect(html).toContain('wyber-select-bridge')
    expect(html.indexOf('</body>')).toBeGreaterThan(html.indexOf('wyber-select-bridge'))
    const twice = injectPreviewBridge(once)
    expect(((twice['index.html'] as { content: string }).content.match(/wyber-select-bridge/g) || []).length).toBe(
      (WYBER_BRIDGE_SCRIPT.match(/wyber-select-bridge/g) || []).length
    )
  })

  it('returns the map unchanged when index.html is missing', () => {
    const files = { 'src/App.tsx': file('x') }
    expect(injectPreviewBridge(files)).toEqual(files)
  })
})

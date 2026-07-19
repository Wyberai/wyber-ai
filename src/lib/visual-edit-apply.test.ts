import { describe, it, expect } from 'vitest'
import { applyTextEdit, applyClassEdit, stepClass, setColorClass, parseLoc } from './visual-edit-apply'

const file = (content: string) => ({ content, language: 'typescript' })
const content = (v: unknown) => (v as { content: string }).content

const APP = `export default function App() {
  return (
    <div className="p-4 bg-background">
      <h1 className="text-2xl font-bold text-foreground">Welcome to Acme</h1>
      <p className="text-sm text-muted-foreground">The best CRM ever</p>
      <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Get started</button>
    </div>
  )
}`

describe('parseLoc', () => {
  it('parses path:line and rejects garbage', () => {
    expect(parseLoc('src/App.tsx:4')).toEqual({ path: 'src/App.tsx', line: 4 })
    expect(parseLoc('nope')).toBeNull()
    expect(parseLoc('')).toBeNull()
    expect(parseLoc(null)).toBeNull()
  })
})

describe('applyTextEdit', () => {
  it('replaces text at the loc line window', () => {
    const r = applyTextEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:4', 'Welcome to Acme', 'Welcome to Wyber')
    expect(r.ok).toBe(true)
    expect(r.path).toBe('src/App.tsx')
    expect(content(r.files['src/App.tsx'])).toContain('Welcome to Wyber')
    expect(content(r.files['src/App.tsx'])).not.toContain('Welcome to Acme')
  })

  it('falls back to unique-string match when loc is stale', () => {
    const r = applyTextEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:999', 'The best CRM ever', 'A CRM you will love')
    expect(r.ok).toBe(true)
    expect(content(r.files['src/App.tsx'])).toContain('A CRM you will love')
  })

  it('falls back across files when loc is missing', () => {
    const files = { 'src/App.tsx': file(APP), 'src/Footer.tsx': file(`export const F = () => <footer>Made with love</footer>`) }
    const r = applyTextEdit(files, null, 'Made with love', 'Made with Wyber')
    expect(r.ok).toBe(true)
    expect(r.path).toBe('src/Footer.tsx')
  })

  it('refuses ambiguous text instead of guessing', () => {
    const files = {
      'src/A.tsx': file(`<span>Save</span>`),
      'src/B.tsx': file(`<button>Save</button>`),
    }
    const r = applyTextEdit(files, null, 'Save', 'Store')
    expect(r.ok).toBe(false)
    expect(content(r.files['src/A.tsx'])).toContain('Save')
  })

  it('rejects empty/no-op edits', () => {
    expect(applyTextEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:4', '', 'x').ok).toBe(false)
    expect(applyTextEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:4', 'Welcome to Acme', ' Welcome to Acme ').ok).toBe(false)
  })
})

describe('applyClassEdit', () => {
  it('swaps the className at the loc line', () => {
    const oldC = 'text-2xl font-bold text-foreground'
    const newC = 'text-4xl font-bold text-primary'
    const r = applyClassEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:4', oldC, newC)
    expect(r.ok).toBe(true)
    expect(content(r.files['src/App.tsx'])).toContain(`className="${newC}"`)
  })

  it('fails cleanly when the attribute is not found', () => {
    const r = applyClassEdit({ 'src/App.tsx': file(APP) }, 'src/App.tsx:4', 'not-a-real-class', 'x')
    expect(r.ok).toBe(false)
  })
})

describe('stepClass', () => {
  it('steps text size up and down within the scale', () => {
    expect(stepClass('text-2xl font-bold', 'text-size', 1)).toBe('text-3xl font-bold')
    expect(stepClass('text-2xl font-bold', 'text-size', -1)).toBe('text-xl font-bold')
  })

  it('clamps at scale edges', () => {
    expect(stepClass('text-xs', 'text-size', -1)).toBe('text-xs')
    expect(stepClass('rounded-full', 'rounded', 1)).toBe('rounded-full')
  })

  it('adds a sensible default when the family is absent', () => {
    expect(stepClass('font-bold', 'text-size', 1)).toBe('font-bold text-lg')
    expect(stepClass('bg-card', 'p', 1)).toBe('bg-card p-5')
  })
})

describe('setColorClass', () => {
  it('replaces the color token but keeps size/alignment', () => {
    expect(setColorClass('text-2xl text-center text-muted-foreground', 'text', 'primary'))
      .toBe('text-2xl text-center text-primary')
  })

  it('replaces tailwind palette colors and arbitrary values', () => {
    expect(setColorClass('bg-red-500 p-4', 'bg', 'card')).toBe('p-4 bg-card')
    expect(setColorClass('text-[#ff0000] text-sm', 'text', 'foreground')).toBe('text-sm text-foreground')
  })

  it('keeps border widths when changing border color', () => {
    expect(setColorClass('border-2 border-red-500 rounded', 'border', 'border'))
      .toBe('border-2 rounded border-border')
  })
})

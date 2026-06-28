import { describe, it, expect } from 'vitest'
import { collectMissingStubs } from './stub-missing-imports'
import { sanitizeFiles } from './sanitize-files'

const c = (content: string) => ({ content })
const textOf = (v: unknown) => (typeof v === 'string' ? v : (v as { content?: string })?.content ?? '')

describe('collectMissingStubs', () => {
  it('stubs a default-imported component that was never generated', () => {
    const stubs = collectMissingStubs({
      'src/App.tsx': c("import Sidebar from './components/Sidebar'\nexport default function App(){ return <Sidebar/> }"),
    })
    expect('src/components/Sidebar.tsx' in stubs).toBe(true)
    expect(stubs['src/components/Sidebar.tsx'].content).toContain('export default function')
    expect(stubs['src/components/Sidebar.tsx'].content).toContain('coming soon')
  })

  it('provides named exports for a named import', () => {
    const stubs = collectMissingStubs({
      'src/App.tsx': c("import { Card, Button } from './ui'\nexport default function App(){ return <Card/> }"),
    })
    const stub = stubs['src/ui.tsx'].content
    expect(stub).toContain('export const Card = () => null;')
    expect(stub).toContain('export const Button = () => null;')
  })

  it('does NOT stub a file that already exists (any extension/index form)', () => {
    const stubs = collectMissingStubs({
      'src/App.tsx': c("import Sidebar from './components/Sidebar'\nimport Foo from './Foo'"),
      'src/components/Sidebar.tsx': c('export default function S(){return null}'),
      'src/Foo/index.tsx': c('export default function F(){return null}'),
    })
    expect(Object.keys(stubs)).toHaveLength(0)
  })

  it('never stubs external packages', () => {
    const stubs = collectMissingStubs({
      'src/App.tsx': c("import React from 'react'\nimport { BarChart } from 'recharts'\nimport clsx from 'clsx'"),
    })
    expect(Object.keys(stubs)).toHaveLength(0)
  })

  it('stubs a missing css import as an empty stylesheet', () => {
    const stubs = collectMissingStubs({ 'src/main.tsx': c("import './theme.css'\nimport App from './App'") })
    expect(stubs['src/theme.css']?.language).toBe('css')
    // App.tsx is also missing → component stub
    expect('src/App.tsx' in stubs).toBe(true)
  })

  it('does not stub non-code assets (images/fonts)', () => {
    const stubs = collectMissingStubs({ 'src/App.tsx': c("import logo from './logo.png'\nimport './font.woff2'") })
    expect('src/logo.png' in stubs).toBe(false)
    expect('src/font.woff2' in stubs).toBe(false)
  })

  it('resolves the @/ alias to src/', () => {
    const stubs = collectMissingStubs({ 'src/App.tsx': c("import { Thing } from '@/lib/thing'") })
    expect('src/lib/thing.tsx' in stubs).toBe(true)
  })

  it('avoids a default/named name collision', () => {
    const stubs = collectMissingStubs({ 'src/App.tsx': c("import { Sidebar } from './Sidebar'") })
    const stub = stubs['src/Sidebar.tsx'].content
    expect(stub).toContain('export default function SidebarStub()')
    expect(stub).toContain('export const Sidebar = () => null;')
  })
})

describe('sanitizeFiles integration', () => {
  it('adds stubs for missing imports so the map is build-complete', () => {
    const out = sanitizeFiles({
      'src/App.tsx': c("import Sidebar from './components/Sidebar'\nimport Dashboard from './components/Dashboard'\nexport default function App(){ return <div><Sidebar/><Dashboard/></div> }"),
      'src/components/Sidebar.tsx': c('export default function Sidebar(){ return <nav/> }'),
      // Dashboard.tsx is missing (truncated build) — sanitizeFiles should stub it
    })
    expect('src/components/Dashboard.tsx' in out).toBe(true)
    expect(textOf(out['src/components/Dashboard.tsx'])).toContain('coming soon')
    // and it should NOT clobber the real Sidebar
    expect(textOf(out['src/components/Sidebar.tsx'])).toContain('return <nav/>')
  })
})

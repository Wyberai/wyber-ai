import { describe, it, expect } from 'vitest'
import { STARTER_TEMPLATES, isPlaceholderApp } from './starter-templates'

// isPlaceholderApp is what stands between "the model skipped App.tsx" and a
// permanently blank preview: ChatPanel's free-lane backstop and PreviewPanel's
// hasApp gate both key off it. These tests lock the invariant that every
// starter placeholder — current AND the pre-June-2026 one already saved in
// user projects — is detected.
describe('isPlaceholderApp', () => {
  it('detects the current react-vite starter App', () => {
    const starter = STARTER_TEMPLATES['react-vite']['src/App.tsx']
    expect(isPlaceholderApp(starter.content)).toBe(true)
  })

  it('current starter App stays under the 200-char threshold', () => {
    // ChatPanel's backstop comment promises this; the old starter silently
    // grew to ~460 chars and disabled the backstop entirely.
    const starter = STARTER_TEMPLATES['react-vite']['src/App.tsx']
    expect(starter.content.length).toBeLessThanOrEqual(200)
  })

  it('detects the OLD ~460-char starter still saved in existing projects', () => {
    const legacy = `import { useState } from 'react';
export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0EA5E9' }}>Your app will appear here</h1>
      <p style={{ color: '#a1a1aa', fontSize: 15 }}>Describe what you want to build in the chat &rarr;</p>
    </div>
  );
}`
    expect(legacy.length).toBeGreaterThan(200) // the exact trap: length check alone misses it
    expect(isPlaceholderApp(legacy)).toBe(true)
  })

  it('detects the react-native starter App', () => {
    const starter = STARTER_TEMPLATES['react-native']['App.tsx']
    expect(isPlaceholderApp(starter.content)).toBe(true)
  })

  it('treats missing/empty content as placeholder', () => {
    expect(isPlaceholderApp(undefined)).toBe(true)
    expect(isPlaceholderApp(null)).toBe(true)
    expect(isPlaceholderApp('')).toBe(true)
  })

  it('does not flag a real generated App', () => {
    const real = `import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
export default function App() {
  const [tab, setTab] = useState('home');
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar active={tab} onSelect={setTab} />
      <main className="flex-1 p-6">{tab === 'home' ? <Dashboard /> : <p>Settings</p>}</main>
    </div>
  );
}`
    expect(isPlaceholderApp(real)).toBe(false)
  })
})

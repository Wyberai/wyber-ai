import { describe, it, expect } from 'vitest'
import { buildThreatModel, threatModelHasContent } from './threat-model'

const f = (content: string) => ({ content })

describe('buildThreatModel', () => {
  it('extracts supabase tables from .from() calls', () => {
    const tm = buildThreatModel({
      'src/App.tsx': f(`const { data } = await supabase.from('orders').select('*');\nawait supabase.from("profiles").update({})`),
    })
    expect(tm.supabaseTables).toEqual(['orders', 'profiles'])
  })

  it('extracts wyber-store collections', () => {
    const tm = buildThreatModel({
      'src/App.tsx': f(`const tasks = useCollection<Task>('tasks'); const users = getCollection("users")`),
    })
    expect(tm.collections).toEqual(['tasks', 'users'])
    expect(threatModelHasContent(tm)).toBe(true)
  })

  it('extracts localStorage keys', () => {
    const tm = buildThreatModel({
      'src/store.ts': f(`localStorage.setItem('cart', JSON.stringify(x)); localStorage.getItem('theme')`),
    })
    expect(tm.localStorageKeys).toEqual(['cart', 'theme'])
  })

  it('labels auth surfaces and PII inputs', () => {
    const tm = buildThreatModel({
      'src/Login.tsx': f(`await supabase.auth.signInWithPassword({ email, password });
        return <input type="password" /><input type="email" />`),
    })
    expect(tm.authSurfaces).toContain('Email/password sign-in (Supabase Auth)')
    expect(tm.piiInputs).toEqual(expect.arrayContaining(['Passwords', 'Email addresses']))
  })

  it('collects external call domains but ignores platform plumbing', () => {
    const tm = buildThreatModel({
      'src/api.ts': f(`fetch('https://api.stripe.com/v1/charges');
        fetch('https://xyz.supabase.co/rest/v1/things');
        fetch('https://images.unsplash.com/photo-1');`),
    })
    expect(tm.externalCalls).toEqual([{ domain: 'api.stripe.com', files: ['src/api.ts'] }])
  })

  it('flags sensitive sinks with their file', () => {
    const tm = buildThreatModel({
      'src/Html.tsx': f(`<div dangerouslySetInnerHTML={{ __html: raw }} />`),
      'src/legacy.js': f(`el.innerHTML = userInput`),
    })
    expect(tm.sensitiveSinks).toEqual(expect.arrayContaining([
      { kind: 'dangerouslySetInnerHTML', file: 'src/Html.tsx' },
      { kind: 'innerHTML assignment', file: 'src/legacy.js' },
    ]))
  })

  it('surfaces embedded secrets via security-scan', () => {
    const tm = buildThreatModel({
      'src/config.ts': f(`const key = 'sk_live_abcdefghijklmnopqrstuv';`),
    })
    expect(tm.secretFindings).toEqual([{ file: 'src/config.ts', name: 'Stripe secret key' }])
  })

  it('only analyzes code files and counts them', () => {
    const tm = buildThreatModel({
      'src/App.tsx': f(`export default () => null`),
      'README.md': f(`fetch('https://api.evil.com')`),
      'src/empty.ts': f(''),
    })
    expect(tm.filesAnalyzed).toBe(1)
    expect(tm.externalCalls).toEqual([])
  })

  it('threatModelHasContent is false for an empty app', () => {
    const tm = buildThreatModel({ 'src/App.tsx': f('export default () => <div>hi</div>') })
    expect(threatModelHasContent(tm)).toBe(false)
  })

  it('handles string file values and plain-string maps', () => {
    const tm = buildThreatModel({
      'src/a.ts': `supabase.from('items').select()` as unknown as { content?: string },
    })
    expect(tm.supabaseTables).toEqual(['items'])
  })
})

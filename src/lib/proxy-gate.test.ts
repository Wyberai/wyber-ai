import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { PROTECTED_TOP_LEVEL, isProtectedPath } from './route-gate'

// Recomputes which top-level page directories are NOT on the proxy's public allowlist and checks the list in
// route-gate.ts matches, so adding a protected page without listing it (it would become public) fails here.
function computeProtected(): string[] {
  const src = readFileSync('src/proxy.ts', 'utf8')
  const start = src.indexOf('// Skip everything that is clearly public')
  const block = src.slice(start, src.indexOf('return NextResponse.next()', start))
  const prefixes = [...block.matchAll(/path\.startsWith\('([^']+)'\)/g)].map(m => m[1])
  const exact = [...block.matchAll(/path === '([^']+)'/g)].map(m => m[1])
  const dirs = readdirSync('src/app', { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
  const skip = (d: string) => d.startsWith('[') || d.startsWith('(') || d.startsWith('_') || d === 'api'
  const isPublic = (d: string) => prefixes.some(x => ('/' + d).startsWith(x) || ('/' + d + '/').startsWith(x)) || exact.includes('/' + d)
  return dirs.filter(d => !skip(d) && !isPublic(d)).sort()
}

describe('proxy route gate', () => {
  it('lists exactly the non-public top-level page directories', () => {
    expect([...PROTECTED_TOP_LEVEL].sort()).toEqual(computeProtected())
  })
  it('gates real sign-in areas, including nested paths', () => {
    for (const p of ['/dashboard', '/dashboard/x', '/project/abc', '/settings/billing', '/admin/users', '/onboarding']) {
      expect(isProtectedPath(p), p).toBe(true)
    }
  })
  it('lets unknown and public paths through so they 404 or render', () => {
    for (const p of ['/pricng', '/wp-admin', '/this-page-does-not-exist', '/seo', '/scan', '/', '/pricing', '/dashboardx', '']) {
      expect(isProtectedPath(p), p).toBe(false)
    }
  })
})

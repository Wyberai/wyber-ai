import { describe, it, expect } from 'vitest'
import { ANCHOR_NAV_JS, buildStorageShim, injectStorageShim } from './published-app-sandbox'

// 16 Nov: a plain <a href="#services"> inside the srcdoc frame resolved against the host page's URL, so a click loaded the whole
// WyberAi page inside the frame (sign-in screen for a second, then "Application error"). The shim now takes over hash-only links.
// Verified in real Chrome by hand (scrolls, stays in about:srcdoc, #/route links still fire hashchange); these tests guard the wiring.
describe('in-page link handler in the app frame shim', () => {
  it('is valid JavaScript on its own', () => {
    expect(() => new Function(ANCHOR_NAV_JS)).not.toThrow()
  })

  it('is part of the shim every frame gets (published, editor preview, agency preview)', () => {
    const shim = buildStorageShim({})
    expect(shim).toContain(ANCHOR_NAV_JS)
    const script = shim.replace(/^<script>/, '').replace(/<\/script>$/, '')
    expect(() => new Function(script)).not.toThrow()
  })

  it('is injected right after <head>, before the app scripts', () => {
    const out = injectStorageShim('<!doctype html><html><head><title>x</title></head><body><a href="#a">a</a></body></html>', {})
    expect(out.indexOf('closest')).toBeGreaterThan(-1)
    expect(out.indexOf('closest')).toBeLessThan(out.indexOf('<title>'))
  })

  it('only takes over hash links, never external or relative ones, and stands down for modified clicks and prevented events', () => {
    expect(ANCHOR_NAV_JS).toContain("h.charAt(0)!=='#'")
    expect(ANCHOR_NAV_JS).toContain('e.defaultPrevented')
    expect(ANCHOR_NAV_JS).toContain('e.metaKey')
    expect(ANCHOR_NAV_JS).toContain("a.target!=='_self'")
  })
})

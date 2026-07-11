import { describe, it, expect } from 'vitest'
import { injectPwa, PWA_MARKER } from './install-snippet'

const HTML = `<!DOCTYPE html><html><head><title>My App</title></head><body><div id="root"></div></body></html>`

describe('injectPwa', () => {
  it('injects manifest link, apple metas, and the install runtime', () => {
    const out = injectPwa(HTML, { themeColor: '#123456' })
    expect(out).toContain('<link rel="manifest" href="/manifest.webmanifest">')
    expect(out).toContain('<link rel="apple-touch-icon" href="/pwa-icon-192.png">')
    expect(out).toContain('content="#123456"')
    expect(out).toContain('beforeinstallprompt')
    // Head tags land in <head>, runtime lands before </body>
    expect(out.indexOf(PWA_MARKER)).toBeLessThan(out.indexOf('</head>'))
    expect(out.indexOf('beforeinstallprompt')).toBeLessThan(out.indexOf('</body>'))
  })

  it('is idempotent on republish (marker guard)', () => {
    const once = injectPwa(HTML, { themeColor: '#123456' })
    const twice = injectPwa(once, { themeColor: '#123456' })
    expect(twice).toBe(once)
    expect(twice.match(/manifest\.webmanifest/g)?.length).toBe(1)
  })

  it('survives HTML without head/body tags', () => {
    const out = injectPwa('<div id="root"></div>', { themeColor: '#000' })
    expect(out).toContain('manifest.webmanifest')
    expect(out).toContain('beforeinstallprompt')
  })

  it('the inline runtime never contains a nested closing script tag in a string', () => {
    const out = injectPwa(HTML, { themeColor: '#000' })
    // Each <script> must be balanced — a stray literal </script> inside a JS
    // string would truncate the runtime when the browser parses the HTML.
    const opens = out.match(/<script>/g)?.length ?? 0
    const closes = out.match(/<\/script>/g)?.length ?? 0
    expect(opens).toBe(closes)
  })
})

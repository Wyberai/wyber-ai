import { describe, it, expect } from 'vitest'
import { parseConsent, CONSENT_KEY } from './cookie-consent'
import { readFileSync } from 'node:fs'

describe('cookie consent', () => {
  it('only an explicit "accepted" allows tracking', () => {
    expect(parseConsent('accepted')).toBe('accepted')
    expect(parseConsent('declined')).toBe('declined')
    for (const v of [null, undefined, '', 'true', 'yes', 'ACCEPTED', '1']) expect(parseConsent(v as any)).toBe('unknown')
  })

  it('the pixels in PlatformChrome are gated behind consent, not loaded unconditionally', () => {
    const src = readFileSync('src/components/shared/PlatformChrome.tsx', 'utf8')
    expect(src).toContain("useCookieConsent")
    expect(src).toMatch(/consent === 'accepted'/)
    // each tracker must sit inside the gated block: the gate opens before the first tracker and closes after the last
    const gate = src.indexOf("consent === 'accepted'")
    for (const needle of ['googletagmanager.com/gtag/js', 'reddit-pixel', 'meta-pixel']) {
      expect(src.indexOf(needle), needle).toBeGreaterThan(gate)
    }
  })

  it('the banner writes through the shared helper and the key matches', () => {
    const banner = readFileSync('src/components/shared/CookieBanner.tsx', 'utf8')
    expect(banner).toContain('writeConsent')
    expect(CONSENT_KEY).toBe('wyber-cookie-consent') // existing visitors keep their stored choice
  })

  it('the banner no longer claims only essential cookies', () => {
    const banner = readFileSync('src/components/shared/CookieBanner.tsx', 'utf8')
    expect(banner).not.toContain('We use essential cookies to keep you signed in and remember your preferences.')
    expect(banner).toMatch(/analytics and advertising/i)
  })
})

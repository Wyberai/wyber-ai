import { describe, it, expect } from 'vitest'
import { hashPasscode, verifyPasscode, unlockToken, isUnlocked, unlockCookieName } from './passcode'

describe('client page passcode', () => {
  it('verifies the right passcode and rejects others', () => {
    const h = hashPasscode('blue-door')
    expect(verifyPasscode('blue-door', h)).toBe(true)
    expect(verifyPasscode('blue-doors', h)).toBe(false)
    expect(verifyPasscode('', h)).toBe(false)
    expect(verifyPasscode('x'.repeat(500), h)).toBe(false)
  })

  it('salts: the same passcode hashes differently each time, and never stores the passcode', () => {
    const a = hashPasscode('blue-door'), b = hashPasscode('blue-door')
    expect(a).not.toBe(b)
    expect(a).not.toContain('blue-door')
  })

  it('no stored hash means nothing to verify', () => {
    expect(verifyPasscode('anything', null)).toBe(false)
    expect(verifyPasscode('anything', 'garbage')).toBe(false)
  })

  it('an unprotected page is open, a protected one needs the matching cookie', () => {
    expect(isUnlocked('s', null, undefined)).toBe(true)
    const h = hashPasscode('blue-door')
    expect(isUnlocked('s', h, undefined)).toBe(false)
    expect(isUnlocked('s', h, 'forged')).toBe(false)
    expect(isUnlocked('s', h, unlockToken('s', h))).toBe(true)
  })

  it('the cookie is bound to the link and to the passcode', () => {
    const h = hashPasscode('blue-door')
    expect(isUnlocked('other-slug', h, unlockToken('s', h))).toBe(false)
    expect(isUnlocked('s', hashPasscode('new-code'), unlockToken('s', h))).toBe(false)
  })

  it('each client gets its own cookie name', () => {
    expect(unlockCookieName('a')).not.toBe(unlockCookieName('b'))
    expect(unlockCookieName('a')).toBe(unlockCookieName('a'))
  })
})

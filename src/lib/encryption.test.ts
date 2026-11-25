import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { encryptCredential, decryptCredential, maskCredential } from './encryption'

// What the first version of this file did: use only the first 32 characters of the secret, padded with zeros.
async function legacyEncrypt(secret: string, plaintext: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32)), { name: 'AES-GCM' }, false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  const all = new Uint8Array(iv.length + enc.byteLength); all.set(iv); all.set(new Uint8Array(enc), iv.length)
  return Buffer.from(all).toString('base64')
}

describe('saved third-party keys', () => {
  const original = process.env.CREDENTIAL_ENCRYPTION_KEY
  beforeEach(() => { process.env.CREDENTIAL_ENCRYPTION_KEY = 'a'.repeat(40) })
  afterEach(() => { if (original === undefined) delete process.env.CREDENTIAL_ENCRYPTION_KEY; else process.env.CREDENTIAL_ENCRYPTION_KEY = original })

  it('round-trips, writes the v2 format, and never repeats itself', async () => {
    const a = await encryptCredential('sk-live-12345678')
    const b = await encryptCredential('sk-live-12345678')
    expect(a.startsWith('v2:')).toBe(true)
    expect(a).not.toBe(b)
    expect(a).not.toContain('sk-live')
    expect(await decryptCredential(a)).toBe('sk-live-12345678')
  })
  it('still reads values saved by the first version, so nothing already stored is lost', async () => {
    const old = await legacyEncrypt('a'.repeat(40), 'sk-saved-long-ago')
    expect(old.startsWith('v2:')).toBe(false)
    expect(await decryptCredential(old)).toBe('sk-saved-long-ago')
  })
  it('the whole secret counts now: a secret that only shares the first 32 characters cannot open it', async () => {
    const value = await encryptCredential('private')
    process.env.CREDENTIAL_ENCRYPTION_KEY = 'a'.repeat(32) + 'DIFFERENT'
    await expect(decryptCredential(value)).rejects.toThrow()
  })
  it('a short secret no longer collapses to a zero-padded key', async () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = 'short'
    const value = await encryptCredential('private')
    process.env.CREDENTIAL_ENCRYPTION_KEY = 'short' + '0'.repeat(27) // what the old padding turned it into
    await expect(decryptCredential(value)).rejects.toThrow()
  })
  it('shows only the last four characters, and nothing for a short value', () => {
    expect(maskCredential('sk-live-12345678')).toBe('••••••••5678')
    expect(maskCredential('abc')).toBe('••••••••')
  })
})

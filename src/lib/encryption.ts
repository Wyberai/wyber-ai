// AES-256-GCM encryption for API keys and credentials
// Keys encrypted before storage, decrypted only at execution time
// Never logged, never exposed in API responses
//
// Two formats are readable:
//   "v2:<base64>"  the current one. The AES key is the SHA-256 of CREDENTIAL_ENCRYPTION_KEY, so the whole secret counts
//                  whatever its length or characters.
//   "<base64>"     the first version (no prefix). It used only the first 32 characters of the secret, padded with
//                  zeros when shorter, which weakens a short or hex-looking secret. Still readable so nothing already
//                  saved is lost; every new value is written as v2.

const ALGO = 'AES-GCM'
const V2 = 'v2:'

function getEncryptionKey(): string {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!key) throw new Error('CREDENTIAL_ENCRYPTION_KEY env var not set')
  return key
}

async function legacyKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey('raw', enc.encode(secret.padEnd(32, '0').slice(0, 32)), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function currentKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptCredential(plaintext: string): Promise<string> {
  const key = await currentKey(getEncryptionKey())
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv }, key, new TextEncoder().encode(plaintext))
  // Combine iv + encrypted data, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return V2 + Buffer.from(combined).toString('base64')
}

export async function decryptCredential(ciphertext: string): Promise<string> {
  const isV2 = ciphertext.startsWith(V2)
  const key = isV2 ? await currentKey(getEncryptionKey()) : await legacyKey(getEncryptionKey())
  const combined = Buffer.from(isV2 ? ciphertext.slice(V2.length) : ciphertext, 'base64')
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

// Mask credential for display — show only last 4 chars
export function maskCredential(value: string): string {
  if (!value || value.length < 8) return '••••••••'
  return '••••••••' + value.slice(-4)
}

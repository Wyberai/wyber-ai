// AES-256-GCM encryption for API keys and credentials
// Keys encrypted before storage, decrypted only at execution time
// Never logged, never exposed in API responses

const ALGO = 'AES-GCM'
const KEY_LEN = 256

function getEncryptionKey(): string {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!key) throw new Error('CREDENTIAL_ENCRYPTION_KEY env var not set')
  return key
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(secret.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  )
  return keyMaterial
}

export async function encryptCredential(plaintext: string): Promise<string> {
  const key = await deriveKey(getEncryptionKey())
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv }, key, enc.encode(plaintext)
  )
  // Combine iv + encrypted data, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return Buffer.from(combined).toString('base64')
}

export async function decryptCredential(ciphertext: string): Promise<string> {
  const key = await deriveKey(getEncryptionKey())
  const combined = Buffer.from(ciphertext, 'base64')
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv }, key, data
  )
  return new TextDecoder().decode(decrypted)
}

// Mask credential for display — show only last 4 chars
export function maskCredential(value: string): string {
  if (!value || value.length < 8) return '••••••••'
  return '••••••••' + value.slice(-4)
}

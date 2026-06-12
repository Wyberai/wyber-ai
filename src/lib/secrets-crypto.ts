import crypto from 'crypto'

const ALG = 'aes-256-gcm'
const KEY_HEX = process.env.SECRETS_ENCRYPTION_KEY

function getKey(): Buffer {
  if (!KEY_HEX) throw new Error('SECRETS_ENCRYPTION_KEY env var is not set')
  const buf = Buffer.from(KEY_HEX, 'hex')
  if (buf.length !== 32) throw new Error(`SECRETS_ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${buf.length}`)
  return buf
}

// Returns "iv:authTag:ciphertext" all base64
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map(b => b.toString('base64')).join(':')
}

export function decrypt(stored: string): string {
  const key = getKey()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted value format')
  const [iv, authTag, ciphertext] = parts.map(p => Buffer.from(p, 'base64'))
  const decipher = crypto.createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

// Returns "sk-...4f2a" style masked preview — never the full value
export function mask(plaintext: string): string {
  if (plaintext.length <= 8) return '••••••••'
  return plaintext.slice(0, 3) + '...' + plaintext.slice(-4)
}

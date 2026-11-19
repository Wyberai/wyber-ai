import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'

// Client delivery pages can be locked with a passcode the agency shares with the client. This is a light gate, not an
// account system: it keeps a forwarded or guessed link from opening the page. The passcode is stored as a scrypt hash;
// once it is entered correctly the browser keeps a signed cookie that stops working the moment the passcode changes.

export const MIN_PASSCODE = 4
export const MAX_PASSCODE = 64

export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(passcode, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPasscode(passcode: string, stored: string | null | undefined): boolean {
  if (!stored || typeof passcode !== 'string' || passcode.length > MAX_PASSCODE) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const a = Buffer.from(hash, 'hex')
  const b = scryptSync(passcode, salt, a.length)
  return a.length === b.length && timingSafeEqual(a, b)
}

function secret(): string {
  return process.env.CLIENT_PORTAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-only-client-portal-secret'
}

/** The cookie value proving this browser entered the passcode. Tied to the slug and to the stored hash, so rotating the
 *  link or changing the passcode logs every browser out. */
export function unlockToken(slug: string, storedHash: string): string {
  return createHmac('sha256', secret()).update(`${slug}|${storedHash}`).digest('hex').slice(0, 40)
}

export function isUnlocked(slug: string, storedHash: string | null | undefined, cookieValue: string | undefined): boolean {
  if (!storedHash) return true // no passcode set: open
  if (!cookieValue) return false
  const want = Buffer.from(unlockToken(slug, storedHash))
  const got = Buffer.from(cookieValue)
  return want.length === got.length && timingSafeEqual(want, got)
}

/** Cookie name per client, so unlocking one client's page never unlocks another's. */
export function unlockCookieName(slug: string): string {
  return 'wy_cp_' + createHmac('sha256', 'cookie-name').update(slug).digest('hex').slice(0, 12)
}

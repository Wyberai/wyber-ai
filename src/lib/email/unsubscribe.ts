import crypto from 'crypto'

// Signed unsubscribe links: /unsubscribe?e=<email>&t=<hmac>. The token proves
// the link came from one of our own emails, so the page can set the opt-out
// flag with zero friction (no login) while nobody can forge links in bulk.
const SECRET = process.env.SECRETS_ENCRYPTION_KEY || process.env.SUPABASE_WEBHOOK_SECRET || 'wyber-unsub'

export function unsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
  return `${base}/unsubscribe?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${unsubscribeToken(email)}`
}

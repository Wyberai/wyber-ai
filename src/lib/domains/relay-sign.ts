import { createHmac, timingSafeEqual } from 'crypto'

// The app talks to the relay (a small server with a fixed outbound IP, see /relay) with signed requests.
// signature = hex(HMAC-SHA256(secret, `${timestamp}.${body}`)). The relay rejects anything older than 60 seconds.
// relay/server.mjs carries the same few lines because it has to run on its own without this repo's build.

export const RELAY_MAX_SKEW_SECONDS = 60

export function signRelayBody(secret: string, timestamp: number, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
}

export function verifyRelaySignature(secret: string, timestamp: number, body: string, signature: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!secret || !signature || !Number.isFinite(timestamp)) return false
  if (Math.abs(nowSeconds - timestamp) > RELAY_MAX_SKEW_SECONDS) return false
  const expected = Buffer.from(signRelayBody(secret, timestamp, body), 'hex')
  let given: Buffer
  try { given = Buffer.from(signature, 'hex') } catch { return false }
  return expected.length === given.length && timingSafeEqual(expected, given)
}

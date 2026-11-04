import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * SSRF guard for BYOS: the analyzer fetches pages from a hostname a visitor
 * typed, so it must never reach loopback, private, link-local or cloud-metadata
 * addresses. Only the hostname is ever used — the visitor's path/query is dropped.
 */

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/
const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost', '.lan', '.home', '.corp', '.test', '.invalid']

/** "https://www.Pipedrive.com/features?x=1" -> "www.pipedrive.com"; null when not a plausible public domain. */
export function normalizeDomain(input: string): string | null {
  const raw = (input || '').trim().slice(0, 253)
  if (!raw) return null
  let host: string
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`).hostname
  } catch {
    return null
  }
  host = host.toLowerCase().replace(/\.$/, '')
  if (isIP(host) || host.startsWith('[')) return null
  if (BLOCKED_SUFFIXES.some(s => host.endsWith(s))) return null
  const labels = host.split('.')
  if (labels.length < 2 || !labels.every(l => LABEL.test(l))) return null
  if (!/^[a-z]{2,24}$/.test(labels[labels.length - 1])) return null
  return host
}

/** Cache key: the same product regardless of a leading "www.". */
export function cacheKey(domain: string): string {
  return domain.replace(/^www\./, '')
}

export function isPrivateAddress(ip: string): boolean {
  if (ip.includes(':')) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fe80:') || v.startsWith('fc') || v.startsWith('fd')) return true
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]) : false
  }
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = p
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    a >= 224
  )
}

/** True only when every address the name resolves to is public. */
export async function resolvesPublicly(host: string): Promise<boolean> {
  try {
    const addrs = await lookup(host, { all: true })
    return addrs.length > 0 && addrs.every(a => !isPrivateAddress(a.address))
  } catch {
    return false
  }
}

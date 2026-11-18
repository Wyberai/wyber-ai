// Shared by the public tools that fetch a visitor-supplied URL from our server. http/https only, and internal, link-local
// and loopback hosts are refused so the tool cannot be pointed at our own network (SSRF).

export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
  }
  if (h === '::1' || h === '[::1]' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true
  return false
}

export function normalizeUrl(raw: string): URL | null {
  try {
    let s = raw.trim()
    // Another scheme (ftp://, file://) must be refused, not quietly turned into an https address with a strange host.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) return null
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    const u = new URL(s)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (isPrivateHost(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

/**
 * fetch() that follows redirects by hand and checks every hop with normalizeUrl, so a public address cannot bounce the
 * request to an internal one. Gives up after `maxHops` redirects.
 */
export async function safeFetch(url: string, init: RequestInit = {}, maxHops = 4): Promise<Response> {
  let current = url
  for (let hop = 0; hop <= maxHops; hop++) {
    const u = normalizeUrl(current)
    if (!u) throw new Error('blocked address')
    const res = await fetch(u.toString(), { ...init, redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return res
      current = new URL(loc, u).toString()
      continue
    }
    return res
  }
  throw new Error('too many redirects')
}

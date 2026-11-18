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
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    const u = new URL(s)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (isPrivateHost(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

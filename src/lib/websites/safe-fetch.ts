import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// Fetches a user-supplied URL server-side for the /websites "rebuild my site"
// flow without becoming an SSRF hole: http(s) on default ports only, every
// hop (redirects followed manually, max 3) re-resolved and rejected if it
// lands on a private / loopback / link-local / metadata address, 7s timeout,
// 1.5 MB read cap.

const MAX_BYTES = 1_500_000
const TIMEOUT_MS = 7_000

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v6 = ip.toLowerCase()
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80')
    || v6.startsWith('::ffff:') && isPrivateIp(v6.slice(7))
}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http(s) links are supported.')
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('That link uses an unusual port.')
  if (url.username || url.password) throw new Error('Links with passwords are not supported.')
  const host = url.hostname
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('That address is not public.')
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new Error('That address is not public.')
}

export async function fetchPublicPage(raw: string): Promise<{ url: string; html: string }> {
  let url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(url)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WyberAiSiteReader/1.0; +https://wyberai.com/websites)', Accept: 'text/html' },
      })
    } finally {
      clearTimeout(timer)
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      continue
    }
    if (!res.ok) throw new Error(`That site answered with an error (${res.status}).`)
    if (!/text\/html|application\/xhtml/i.test(res.headers.get('content-type') || '')) throw new Error('That link is not a web page.')
    const reader = res.body?.getReader()
    if (!reader) throw new Error('Could not read that page.')
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) { await reader.cancel(); break }
      chunks.push(value)
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
    return { url: url.toString(), html }
  }
  throw new Error('That link redirects too many times.')
}

// Rebuilding someone else's site is how phishing kits are made. We only use a
// page's text (never its design), but still refuse banks, payments, government
// and big-brand domains/names outright.
const BLOCKED_HOST = /(^|\.)(gov|gov\.in|nic\.in|mil|bank|bank\.in)$|(^|\.)(sbi|onlinesbi|hdfcbank|icicibank|axisbank|kotak|pnbindia|bankofbaroda|canarabank|unionbankofindia|yesbank|idfcfirstbank|indusind|rbi|npci|paytm|phonepe|gpay|razorpay|paypal|stripe|visa|mastercard|americanexpress|google|youtube|facebook|instagram|whatsapp|meta|apple|icloud|microsoft|live|outlook|office|amazon|flipkart|myntra|netflix|twitter|x|linkedin|zomato|swiggy|uber|olacabs|irctc|airtel|jio|vodafone|lic|uidai|incometax|epfindia|binance|coinbase|wazirx|zerodha|groww|upstox)\.[a-z.]+$/i
const BLOCKED_NAME = /\b(state bank|sbi|hdfc|icici|axis bank|kotak|paytm|phonepe|google pay|paypal|razorpay|amazon|flipkart|netflix|microsoft|apple|facebook|instagram|whatsapp|income tax|aadhaar|uidai|epfo|irctc|reserve bank|zerodha|binance|coinbase)\b/i

export function isBlockedTarget(host: string, name?: string): boolean {
  return BLOCKED_HOST.test(host.toLowerCase()) || (!!name && BLOCKED_NAME.test(name))
}

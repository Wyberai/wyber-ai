// WyberAi domains relay. A tiny server with a FIXED outbound IP that forwards signed requests from the app to the
// ResellerClub HTTP API. The provider only accepts calls from whitelisted IPs and Vercel has none, so this runs on a
// small VPS whose IP is whitelisted in the reseller panel (Settings > API).
//
// No dependencies. Node 18+. Credentials come from the environment only and are never logged:
//   RELAY_SECRET          shared with the app (DOMAINS_RELAY_SECRET)
//   RESELLERCLUB_USERID   the reseller id (auth-userid)
//   RESELLERCLUB_API_KEY  the API key
//   RESELLERCLUB_BASE     https://test.httpapi.com/api/  (sandbox, default)  or  https://httpapi.com/api/  (live)
//   PORT                  default 8787
import http from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'

const { RELAY_SECRET, RESELLERCLUB_USERID, RESELLERCLUB_API_KEY } = process.env
const BASE = (process.env.RESELLERCLUB_BASE || 'https://test.httpapi.com/api/').replace(/\/?$/, '/')
const PORT = Number(process.env.PORT || 8787)
const MAX_SKEW = 60
const LIVE = !BASE.includes('test.httpapi.com')
if (!RELAY_SECRET || !RESELLERCLUB_USERID || !RESELLERCLUB_API_KEY) {
  console.error('RELAY_SECRET, RESELLERCLUB_USERID and RESELLERCLUB_API_KEY must be set')
  process.exit(1)
}

// Only these provider paths can be called, with the method the provider requires. Anything else is refused.
const ALLOWED = new Map([
  ['domains/available.json', 'GET'], ['products/reseller-cost-price.json', 'GET'], ['customers/v2/signup.json', 'POST'],
  ['contacts/add.json', 'POST'], ['domains/customer-default-ns.json', 'GET'], ['domains/register.json', 'POST'],
  ['domains/renew.json', 'POST'], ['domains/details.json', 'GET'], ['domains/orderid.json', 'GET'], ['dns/activate.json', 'POST'],
  ['dns/manage/add-ipv4-record.json', 'POST'], ['dns/manage/add-ipv6-record.json', 'POST'], ['dns/manage/add-cname-record.json', 'POST'],
  ['dns/manage/add-mx-record.json', 'POST'], ['dns/manage/add-txt-record.json', 'POST'],
  ...['in', 'se', 'gbl'].flatMap(r => [
    [`gapps/${r}/add.json`, 'POST'], [`gapps/${r}/admin/add.json`, 'POST'], [`gapps/${r}/add-account.json`, 'POST'],
    [`gapps/${r}/renew.json`, 'POST'], [`gapps/${r}/details.json`, 'GET'], [`gapps/${r}/orderid.json`, 'GET'],
    [`gapps/${r}/dns-record.json`, 'GET'],
  ]),
])

const sign = (ts, body) => createHmac('sha256', RELAY_SECRET).update(`${ts}.${body}`).digest('hex')
function authentic(req, body) {
  const ts = Number(req.headers['x-relay-timestamp'])
  const sig = String(req.headers['x-relay-signature'] || '')
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW) return false
  const a = Buffer.from(sign(ts, body), 'hex'), b = Buffer.from(sig, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)) }

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, { ok: true, mode: LIVE ? 'live' : 'sandbox' })
  if (req.method !== 'POST' || req.url !== '/v1/call') return send(res, 404, { message: 'Not found' })
  const chunks = []
  let size = 0
  req.on('data', c => { size += c.length; if (size > 64_000) req.destroy(); else chunks.push(c) })
  req.on('end', async () => {
    const body = Buffer.concat(chunks).toString('utf8')
    if (!authentic(req, body)) return send(res, 401, { message: 'Bad signature' })
    let call
    try { call = JSON.parse(body) } catch { return send(res, 400, { message: 'Bad JSON' }) }
    const path = String(call.path || '')
    if (ALLOWED.get(path) !== call.method) return send(res, 403, { message: 'That call is not allowed' })
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(call.params || {})) for (const item of Array.isArray(v) ? v : [v]) qs.append(k, String(item))
    qs.set('auth-userid', RESELLERCLUB_USERID)
    qs.set('api-key', RESELLERCLUB_API_KEY)
    // Availability has its own host on the live service.
    const base = LIVE && path === 'domains/available.json' ? 'https://domaincheck.httpapi.com/api/' : BASE
    try {
      const upstream = await fetch(call.method === 'GET' ? `${base}${path}?${qs}` : `${base}${path}`, {
        method: call.method,
        headers: call.method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : undefined,
        body: call.method === 'POST' ? qs.toString() : undefined,
      })
      const text = await upstream.text()
      res.writeHead(upstream.status, { 'content-type': 'application/json' })
      res.end(text)
    } catch (e) {
      console.error('upstream error', path, e instanceof Error ? e.message : 'unknown')
      send(res, 502, { message: 'The domain provider could not be reached' })
    }
  })
}).listen(PORT, () => console.log(`relay listening on ${PORT} (${LIVE ? 'LIVE' : 'sandbox'})`))

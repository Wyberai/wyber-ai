import { NextRequest, NextResponse } from 'next/server'
import { analyzeHtml } from '@/lib/seo-audit'
import { rateLimit } from '@/lib/rate-limit'

// PUBLIC, no-auth SEO auditor. Fetches a marketing/app URL server-side and grades
// on-page SEO. Guardrails: http/https only, private hosts blocked (SSRF), 6s
// timeout, response body capped, per-IP rate limit.

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Reject internal/link-local/loopback hosts to prevent SSRF.
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  // literal IPv4 in private ranges
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
  }
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true
  return false
}

function normalizeUrl(raw: string): URL | null {
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

async function fetchText(url: string, ms: number, maxBytes: number): Promise<{ ok: boolean; text: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'WyberAiSEOBot/1.0 (+https://wyberai.com/tools)' },
    })
    if (!res.ok) return { ok: false, text: '' }
    const reader = res.body?.getReader()
    if (!reader) return { ok: res.ok, text: await res.text() }
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) { chunks.push(value); total += value.length; if (total > maxBytes) { ctrl.abort(); break } }
    }
    return { ok: true, text: new TextDecoder().decode(concat(chunks)) }
  } catch {
    return { ok: false, text: '' }
  } finally {
    clearTimeout(timer)
  }
}
function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const c of chunks) { out.set(c, o); o += c.length }
  return out
}
async function head200(url: string, ms: number): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const { allowed } = rateLimit(`pub-seo:${ip}`, 12, 3_600_000) // 12/hour/IP
  if (!allowed) {
    return NextResponse.json({ error: 'That’s a lot of audits. Please wait a bit before trying again.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const u = normalizeUrl(String(body.url ?? ''))
  if (!u) {
    return NextResponse.json({ error: 'Enter a public website URL (e.g. yourcompany.com).' }, { status: 400 })
  }

  const page = await fetchText(u.toString(), 6000, 2_000_000)
  if (!page.ok || !page.text) {
    return NextResponse.json({ error: 'Couldn’t load that page. Check the URL is public and reachable.' }, { status: 502 })
  }

  const origin = `${u.protocol}//${u.host}`
  const [robotsOk, sitemapOk] = await Promise.all([
    head200(`${origin}/robots.txt`, 3500),
    head200(`${origin}/sitemap.xml`, 3500),
  ])

  const report = analyzeHtml(u.toString(), page.text, robotsOk, sitemapOk)
  return NextResponse.json(report)
}

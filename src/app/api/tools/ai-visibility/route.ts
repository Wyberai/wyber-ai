import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { normalizeUrl, safeFetch } from '@/lib/safe-url'
import { gradeVisibility, type Fetched } from '@/lib/ai-visibility'

// PUBLIC, no-auth AI visibility check. Fetches the page the way an AI crawler does (no JavaScript, an AI crawler's user
// agent) and grades what comes back. Same guardrails as the SEO tool: http/https only, private hosts refused, short
// timeout, capped body, per-IP rate limit. Free to run: it calls no model.

const UA = 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot) WyberAiVisibilityCheck/1.0'

async function get(url: string, ms: number, maxBytes: number): Promise<Fetched> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await safeFetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,text/plain,*/*' } })
    const buf = new Uint8Array(await res.arrayBuffer())
    const text = new TextDecoder().decode(buf.length > maxBytes ? buf.slice(0, maxBytes) : buf)
    return { ok: res.ok, status: res.status, text }
  } catch {
    return { ok: false, status: 0, text: '' }
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit(`pub-ai-vis:${ip}`, 12, 3_600_000)
  if (!allowed) return NextResponse.json({ error: 'That is a lot of checks. Please wait a bit before trying again.' }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const u = normalizeUrl(String(body.url ?? ''))
  if (!u) return NextResponse.json({ error: 'Enter a public website address (for example yourcompany.com).' }, { status: 400 })

  const origin = `${u.protocol}//${u.host}`
  const [page, robots, llms, sitemap] = await Promise.all([
    get(u.toString(), 8000, 1_500_000),
    get(`${origin}/robots.txt`, 4000, 100_000),
    get(`${origin}/llms.txt`, 4000, 200_000),
    get(`${origin}/sitemap.xml`, 4000, 500_000),
  ])
  if (!page.ok && page.status === 0) return NextResponse.json({ error: 'Could not load that page. Check the address is public and reachable.' }, { status: 502 })

  return NextResponse.json(gradeVisibility({ url: u.toString(), page, robots, llms, sitemap }))
}

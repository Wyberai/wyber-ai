import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { normalizeUrl, safeFetch } from '@/lib/safe-url'
import { gradeSlop } from '@/lib/slop-scan'

// PUBLIC, no-auth anti-AI-slop scan. Fetches the page and up to three same-site stylesheets and grades what a visitor can
// read. Same guardrails as the other public tools: http/https only, private hosts and redirects checked, short timeouts,
// capped bodies, per-IP rate limit. Calls no model.

const UA = 'Mozilla/5.0 (compatible; WyberAiSlopScan/1.0; +https://wyberai.com/tools)'

async function get(url: string, ms: number, maxBytes: number): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await safeFetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    return new TextDecoder().decode(buf.length > maxBytes ? buf.slice(0, maxBytes) : buf)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const unescapeAttr = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit(`pub-slop:${ip}`, 12, 3_600_000)
  if (!allowed) return NextResponse.json({ error: 'That is a lot of scans. Please wait a bit before trying again.' }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const u = normalizeUrl(String(body.url ?? ''))
  if (!u) return NextResponse.json({ error: 'Enter a public website address (for example yourcompany.com).' }, { status: 400 })

  let html = await get(u.toString(), 8000, 1_500_000)
  if (!html) return NextResponse.json({ error: 'Could not load that page. Check the address is public and reachable.' }, { status: 502 })

  // A site published on WyberAi serves its app inside an iframe's srcdoc: read that too, or the scan would see an empty page.
  const srcdoc = html.match(/srcdoc="([^"]*)"/i)?.[1]
  if (srcdoc) {
    // The outer page is the platform's own shell, so its stylesheets say nothing about the app (reading them gave every published
    // app the platform's purple). Keep the outer page for its text only, and take colours and fonts from the app's own document.
    const shellText = html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/\sstyle="[^"]*"/gi, '')
    html = shellText + '\n' + unescapeAttr(srcdoc)
  }

  const links = srcdoc ? [] : [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)]
    .map(m => m[0].match(/href=["']([^"']+)["']/i)?.[1])
    .filter((h): h is string => !!h)
    .map(h => { try { return new URL(unescapeAttr(h), u) } catch { return null } })
    .filter((x): x is URL => !!x && x.host === u.host)
    .slice(0, 3)
  const css = (await Promise.all(links.map(l => get(l.toString(), 5000, 400_000)))).filter((c): c is string => !!c).join('\n')

  return NextResponse.json(gradeSlop({ url: u.toString(), html, css }))
}

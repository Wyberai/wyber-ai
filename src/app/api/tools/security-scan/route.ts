import { NextRequest, NextResponse } from 'next/server'
import { scanRls } from '@/lib/rls-scan'
import { rateLimit } from '@/lib/rate-limit'

// PUBLIC, no-auth RLS scanner — the free wedge tool. It reuses the same
// attacker's-eye probe as the in-app Security tab (src/lib/rls-scan.ts): given a
// project's PUBLIC anon key it tries to read each table over PostgREST with no
// user logged in. The report contains ONLY table names, column names and row
// COUNTS — never actual row data (the probe fetches limit=1 and counts). So it
// proves a leak without exfiltrating anything.
//
// Guardrails (this is a public tool that fetches a URL server-side):
//  · host must end in .supabase.co  → eliminates SSRF (no internal hosts/IPs)
//  · requires the anon key too      → "scan your own app", not "scan any domain"
//  · hard per-IP rate limit

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function validSupabaseUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:') return null
    if (!u.hostname.toLowerCase().endsWith('.supabase.co')) return null
    return `https://${u.hostname}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const { allowed } = rateLimit(`pub-rls:${ip}`, 8, 3_600_000) // 8/hour/IP
  if (!allowed) {
    return NextResponse.json(
      { error: 'That’s a lot of scans. Please wait a bit before trying again.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const url = validSupabaseUrl(String(body.url ?? ''))
  const anonKey = String(body.anonKey ?? '').trim()

  if (!url) {
    return NextResponse.json(
      { error: 'Enter your Supabase Project URL (looks like https://abcd1234.supabase.co).' },
      { status: 400 },
    )
  }
  // Anon keys are public JWTs — this is not a secret ask. Sanity-check the shape.
  if (!anonKey.startsWith('eyJ') || anonKey.length < 60) {
    return NextResponse.json(
      { error: 'Enter your public anon key (Project Settings → API → anon/public). It starts with "eyJ".' },
      { status: 400 },
    )
  }

  try {
    const report = await scanRls({ url, anonKey })
    // report already contains no row data — safe to return verbatim.
    return NextResponse.json(report)
  } catch (e) {
    return NextResponse.json(
      { error: 'Scan failed — double-check the URL and anon key. ' + String(e).slice(0, 120) },
      { status: 502 },
    )
  }
}

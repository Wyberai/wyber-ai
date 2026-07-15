import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sendScannerReport, sendScannerLeadAlert } from '@/lib/email'

// Lead capture for the free public scanners at /tools. A visitor who ran a
// security or SEO scan asks us to email them the full report — we honour that
// (delivery = the lead magnet) AND store the lead in `tool_leads` for outbound
// follow-up. Anonymous + public, so it is guarded the same way the scanners are:
// per-IP rate limit, strict input validation, IP hashed (never stored raw).

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function domainOf(raw: string): string {
  const s = String(raw || '').trim()
  if (!s) return ''
  try {
    return new URL(s.includes('://') ? s : `https://${s}`).hostname.replace(/^www\./, '')
  } catch {
    return s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].slice(0, 200)
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const { allowed } = rateLimit(`tools-lead:${ip}`, 10, 3_600_000) // 10/hour/IP
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a bit.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  const tool = body.tool === 'seo' ? 'seo' : body.tool === 'security' ? 'security' : null

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!tool) {
    return NextResponse.json({ error: 'Unknown tool.' }, { status: 400 })
  }

  const domain = domainOf(body.url ?? '')
  const score = Number.isFinite(Number(body.score)) ? Math.max(0, Math.min(100, Math.round(Number(body.score)))) : null
  const findingsCount = Number.isFinite(Number(body.findingsCount)) ? Math.max(0, Math.round(Number(body.findingsCount))) : 0
  const topSeverity = typeof body.topSeverity === 'string' ? body.topSeverity.slice(0, 20) : null
  const intentTag = tool === 'security'
    ? (findingsCount > 0 ? 'security_at_risk' : 'security_clean')
    : ((score ?? 100) < 80 ? 'seo_needs_work' : 'seo_ok')
  const ipHash = ip === 'unknown' ? null : createHash('sha256').update(ip).digest('hex').slice(0, 32)

  const db = createServiceClient()
  const { error } = await db.from('tool_leads').insert({
    email,
    tool,
    target_url: String(body.url ?? '').slice(0, 500) || null,
    target_domain: domain || null,
    score,
    findings_count: findingsCount,
    top_severity: topSeverity,
    intent_tag: intentTag,
    ip_hash: ipHash,
    user_agent: (req.headers.get('user-agent') || '').slice(0, 400) || null,
    emailed: true,
  })
  if (error) {
    // Don't fail the visitor's request over a storage hiccup — still try to email.
    console.error('tool_leads insert failed:', error.message)
  }

  // Fire-and-forget both emails: the report to the visitor, an alert to the founder.
  sendScannerReport(email, { tool, domain: domain || 'your site', score: score ?? 0, findingsCount, topSeverity: topSeverity ?? undefined }).catch(() => {})
  sendScannerLeadAlert({ email, tool, domain: domain || 'unknown', score: score ?? 0, findingsCount }).catch(() => {})

  return NextResponse.json({ ok: true })
}

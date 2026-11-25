import { NextRequest, NextResponse } from 'next/server'

// Receives Content-Security-Policy-Report-Only violation reports (see next.config.js). Report-only means nothing is
// blocked; these lines show what an enforced policy would have blocked so it can be tightened from real traffic.
// Public, unauthenticated and noisy by nature (browser extensions trigger plenty), so: tiny body cap, no storage, one
// short log line per report, always 204.
export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024

export async function POST(req: NextRequest) {
  try {
    const text = (await req.text()).slice(0, MAX_BYTES)
    const j = JSON.parse(text)
    const r = j?.['csp-report'] ?? j
    const blocked = String(r?.['blocked-uri'] ?? r?.blockedURL ?? '').slice(0, 160)
    const directive = String(r?.['violated-directive'] ?? r?.effectiveDirective ?? '').slice(0, 60)
    const page = String(r?.['document-uri'] ?? r?.documentURL ?? '').slice(0, 120)
    // Skip extension noise (chrome-extension:, moz-extension:, inline/eval samples without a page).
    if (!/^(chrome|moz|safari)-extension:/.test(blocked)) console.warn(`[csp-report] ${directive} blocked=${blocked} page=${page}`)
  } catch { /* malformed report: ignore */ }
  return new NextResponse(null, { status: 204 })
}

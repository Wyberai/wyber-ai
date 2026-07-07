export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sendAdminContentReport } from '@/lib/email'

// Public abuse-report endpoint for published apps (App Store 1.2 / Google Play
// UGC policy). Anyone viewing a published app can flag it; the report lands in
// content_reports + emails the founder so it can be triaged within 24h. No auth:
// a viewer reporting objectionable content generally isn't a WyberAi user.

const REASONS = new Set([
  'spam',
  'malware',
  'sexual',
  'violence',
  'hate',
  'illegal',
  'copyright',
  'other',
])

export async function POST(req: NextRequest) {
  try {
    // Rate-limit by IP: a report form must not become an email/DB flood vector.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const { allowed } = rateLimit(`report:${ip}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many reports. Try again shortly.' }, { status: 429 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      slug?: string
      reason?: string
      details?: string
    }
    const slug = (body.slug || '').trim().slice(0, 200)
    const reason = (body.reason || '').trim().toLowerCase()
    const details = (body.details || '').trim().slice(0, 2000) || undefined

    if (!slug || !REASONS.has(reason)) {
      return NextResponse.json({ error: 'Invalid report.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Best-effort link to the project so triage can jump straight to it (and so
    // we don't accept reports for slugs that were never published).
    let projectId: string | undefined
    try {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('subdomain', slug)
        .eq('is_public', true)
        .single()
      projectId = data?.id as string | undefined
    } catch {
      /* unknown slug still recorded — a report for a taken-down app is valid */
    }

    // Hash the reporter IP (never store it raw) so repeat/abusive reporters can
    // be correlated for triage without keeping PII.
    const ipHash = createHash('sha256').update(`${ip}:wyber-report`).digest('hex').slice(0, 32)

    // Record + notify are BOTH best-effort and independent: the admin email is
    // the 24h-response compliance guarantee, so a DB hiccup (or a not-yet-applied
    // migration) must never drop the report on the floor. Fire both, then ack.
    await Promise.allSettled([
      supabase.from('content_reports').insert({
        project_id: projectId ?? null,
        slug,
        reason,
        details: details ?? null,
        reporter_ip_hash: ipHash,
      }),
      sendAdminContentReport({ slug, reason, details, projectId }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    // Never leak internals to an anonymous reporter.
    return NextResponse.json({ error: 'Could not submit report.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sendAdminPaperLeakTip } from '@/lib/email'

// Public tip-submission endpoint for the /app/paper-leaks dashboard. Anyone can
// suggest an incident — nothing here auto-publishes; every tip is reviewed and
// verified against real sources before it's manually added to
// src/lib/paper-leaks/data.ts, same bar as every existing entry. No auth: a
// visitor suggesting a public-record incident generally isn't a WyberAi user.

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const { allowed } = rateLimit(`paper-leak-tip:${ip}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many submissions. Try again shortly.' }, { status: 429 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      examName?: string
      state?: string
      year?: number | string
      description?: string
      sourceUrl?: string
      email?: string
      website?: string // honeypot — real visitors never fill this
    }

    // Honeypot: a filled hidden field means a bot, not a person. Pretend success
    // so the bot doesn't learn to skip the field.
    if (body.website) {
      return NextResponse.json({ ok: true })
    }

    const examName = (body.examName || '').trim().slice(0, 200)
    const state = (body.state || '').trim().slice(0, 100) || undefined
    const description = (body.description || '').trim().slice(0, 2000)
    const email = (body.email || '').trim().slice(0, 200) || undefined
    const rawSourceUrl = (body.sourceUrl || '').trim().slice(0, 500)

    if (!examName || !description) {
      return NextResponse.json({ error: 'Exam name and description are required.' }, { status: 400 })
    }

    let sourceUrl: string | undefined
    if (rawSourceUrl) {
      try {
        sourceUrl = new URL(rawSourceUrl).toString()
      } catch {
        return NextResponse.json({ error: 'Source link must be a valid URL.' }, { status: 400 })
      }
    }

    let year: number | undefined
    if (body.year !== undefined && body.year !== '') {
      const n = Number(body.year)
      if (Number.isInteger(n) && n >= 1990 && n <= new Date().getFullYear() + 1) year = n
    }

    const supabase = await createServiceClient()
    const ipHash = createHash('sha256').update(`${ip}:paper-leak-tip`).digest('hex').slice(0, 32)

    // Record + notify are both best-effort and independent: a DB hiccup (or a
    // not-yet-applied migration) must never drop the tip on the floor.
    await Promise.allSettled([
      supabase.from('paper_leak_tips').insert({
        exam_name: examName,
        state: state ?? null,
        year: year ?? null,
        description,
        source_url: sourceUrl ?? null,
        reporter_email: email ?? null,
        reporter_ip_hash: ipHash,
      }),
      sendAdminPaperLeakTip({ examName, state, year, description, sourceUrl, reporterEmail: email }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not submit tip.' }, { status: 500 })
  }
}

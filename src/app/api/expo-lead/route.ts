import { NextRequest, NextResponse, after } from 'next/server'
import { sendAdminExpoLeadAlert } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizePhone, resolveLeadSource } from '@/lib/expo-leads'
import { rateLimit } from '@/lib/rate-limit'
import { deliverExpoEmail, expoSequenceDisabled } from '@/lib/expo-sequence-send'
import { syncIncoming } from '@/lib/crm/db'
import { expoLeadToIncoming } from '@/lib/crm/sources'

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DAYS = new Set(['27 Nov', '28 Nov', '29 Nov', 'Any day'])
const AUDIENCES: Record<string, string> = { software: 'Software company', business: 'Business owner', student: 'Student' }

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(body.website, 50)) return NextResponse.json({ ok: true })

  // Light abuse bound per IP (the booth wifi shares one IP, so keep it generous).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`expo-lead:${ip}`, 30, 10 * 60_000).allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 })
  }

  const name = clean(body.name, 80)
  const whatsapp = clean(body.whatsapp, 20)
  const email = clean(body.email, 120)
  const business = clean(body.business, 120)
  const painPoint = clean(body.painPoint, 800)
  const day = DAYS.has(clean(body.day, 12)) ? clean(body.day, 12) : 'Any day'
  const audience = AUDIENCES[clean(body.audience, 20)] ?? 'Not given'
  const { source, utmSource, utmCampaign } = resolveLeadSource(clean(body.source, 80), req.cookies.get('wyber_attr')?.value)

  // The pain point is optional (a shorter form converts better); everything downstream copes with an empty one.
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Please add your name.' }, { status: 400 })
  }
  if (whatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid WhatsApp number.' }, { status: 400 })
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'That email does not look right.' }, { status: 400 })
  }

  // Record the lead first. Best-effort: if the table is missing or the DB is
  // down we still fall through to the alert email, as before.
  const phoneNorm = normalizePhone(whatsapp)
  let saved = false
  let leadId: string | null = null
  let admin: Awaited<ReturnType<typeof createAdminClient>> | null = null
  try {
    admin = await createAdminClient()
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const { data: dup } = await admin
      .from('expo_leads').select('id').eq('whatsapp_norm', phoneNorm).gte('created_at', since).limit(1)
    if (dup && dup.length) {
      // Same person double-tapping or re-submitting: already recorded and alerted.
      return NextResponse.json({ ok: true })
    }
    const { data: inserted, error } = await admin.from('expo_leads').insert({
      name, whatsapp, whatsapp_norm: phoneNorm, email: email || null, business: business || null,
      audience, preferred_day: day, pain_point: painPoint, source, utm_source: utmSource, utm_campaign: utmCampaign,
    }).select('id').single()
    if (error) console.error('[expo-lead] db insert failed:', error.message)
    else { saved = true; leadId = inserted?.id ?? null }
  } catch (err) {
    console.error('[expo-lead] db error:', err)
  }

  let alerted = false
  try {
    await sendAdminExpoLeadAlert({ name, whatsapp, email, business, painPoint, day, audience, source })
    alerted = true
  } catch (err) {
    console.error('[expo-lead] alert email failed:', err)
  }

  // Work that runs after the response so a slow mail server or database never
  // holds up the form: (1) put the lead straight into the internal CRM so it
  // shows up in Today with its reply deadline, (2) send the visitor the first
  // email of the sequence (the daily cron retries it if this attempt fails).
  // Both are best-effort and independent of each other.
  if (saved && leadId && admin) {
    const id = leadId
    const db = admin
    const job = async () => {
      try {
        await syncIncoming(db, [expoLeadToIncoming({
          id, created_at: new Date().toISOString(), name, whatsapp, email: email || null, business: business || null,
          audience, preferred_day: day, pain_point: painPoint, source, status: 'new',
        })])
      } catch (err) { console.error('[expo-lead] crm sync failed:', err instanceof Error ? err.message : err) }
      if (email && !expoSequenceDisabled()) {
        await deliverExpoEmail(db, { id, name, email, preferred_day: day, pain_point: painPoint }, 'confirmation').catch(() => {})
      }
    }
    try { after(job) } catch { void job() }
  }

  // Fail only when the lead would be lost entirely.
  if (!saved && !alerted) {
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

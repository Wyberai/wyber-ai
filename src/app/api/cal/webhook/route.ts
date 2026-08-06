import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendConsultationConfirmEmail,
  sendConsultationThankYouEmail,
  sendFounderBriefingEmail,
  sendAdminPaymentAlert,
} from '@/lib/email'

// Receiver for Cal.com's webhooks on the "wyber-ai-build-consultation" event
// type — populates consultation_meetings (migration 20260806000000) so the
// admin dashboard can show scheduled-vs-done, and fires the confirmation /
// thank-you emails from the lifecycle below (1-day/30-min reminders are cron-
// driven instead, since Cal.com has no "reminder time approaching" event —
// see src/app/api/cron/consultation-reminders).
//
// INERT UNTIL CONFIGURED: requires CAL_WEBHOOK_SECRET (set when you add this
// URL as a webhook in Cal.com's event-type settings) — Cal.com's own webhooks
// feature needs the Teams plan or above per cal.com/pricing, confirmed
// 2026-08-06. Without the secret this 503s harmlessly rather than accepting
// unverified events.

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  // Cal.com sends "sha256=<hex>" — strip the prefix before comparing.
  const raw = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (expected.length !== raw.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(raw))
}

type CalBookingPayload = {
  uid?: string
  attendees?: { name?: string; email?: string }[]
  startTime?: string
  endTime?: string
  metadata?: { videoCallUrl?: string }
  location?: string
  // Cal.com v2: custom question responses keyed by field slug
  responses?: Record<string, { label?: string; value?: unknown }>
  // Cal.com legacy: flat key-value list
  customInputs?: { label: string; value: unknown }[]
}

function extractIntakeAnswers(p: CalBookingPayload): Record<string, string> | null {
  const skip = new Set(['name', 'email', 'guests', 'location', 'notes', 'title'])
  const out: Record<string, string> = {}

  if (p.responses) {
    for (const [key, entry] of Object.entries(p.responses)) {
      if (skip.has(key.toLowerCase())) continue
      const label = entry.label || key
      const raw = entry.value
      if (raw == null || raw === '') continue
      out[label] = Array.isArray(raw) ? raw.join(', ') : String(raw)
    }
  }

  if (p.customInputs) {
    for (const { label, value } of p.customInputs) {
      if (!value || skip.has(label.toLowerCase())) continue
      out[label] = String(value)
    }
  }

  return Object.keys(out).length ? out : null
}

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Cal.com webhook not configured — set CAL_WEBHOOK_SECRET' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-cal-signature-256')
  if (!verifySignature(body, signature, secret)) {
    console.error('Cal.com webhook rejected: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { triggerEvent?: string; payload?: CalBookingPayload } & CalBookingPayload
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // MEETING_STARTED/MEETING_ENDED are flat (booking fields at top level);
  // BOOKING_* events nest everything under `payload`. Normalize both shapes.
  const triggerEvent = event.triggerEvent || ''
  const p: CalBookingPayload = event.payload || event
  const uid = p.uid
  const attendee = p.attendees?.[0]

  if (!uid) return NextResponse.json({ received: true, warning: 'no booking uid' })

  const admin = getAdmin()

  try {
    if (triggerEvent === 'BOOKING_CREATED') {
      if (!p.startTime || !attendee?.email) {
        return NextResponse.json({ received: true, warning: 'incomplete booking payload' })
      }
      const intakeAnswers = extractIntakeAnswers(p)
      const { error } = await admin.from('consultation_meetings').upsert({
        cal_booking_uid: uid,
        attendee_name: attendee.name || null,
        attendee_email: attendee.email,
        scheduled_start: p.startTime,
        scheduled_end: p.endTime || null,
        status: 'scheduled',
        intake_answers: intakeAnswers,
        raw_payload: event,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cal_booking_uid' })
      if (error) throw error

      sendConsultationConfirmEmail(attendee.email, attendee.name || null, p.startTime, p.metadata?.videoCallUrl).catch(() => {})
      sendFounderBriefingEmail(attendee.name || null, attendee.email, p.startTime, intakeAnswers).catch(() => {})
      sendAdminPaymentAlert(attendee.email, 'Free scoping call booked').catch(() => {})
      return NextResponse.json({ received: true })
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      await admin.from('consultation_meetings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('cal_booking_uid', uid)
      return NextResponse.json({ received: true })
    }

    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      await admin.from('consultation_meetings').update({
        status: 'scheduled',
        scheduled_start: p.startTime || undefined,
        scheduled_end: p.endTime || undefined,
        // Rescheduled → the old reminder timers no longer apply to the new time.
        reminder_1day_sent_at: null,
        reminder_30min_sent_at: null,
        updated_at: new Date().toISOString(),
      }).eq('cal_booking_uid', uid)
      return NextResponse.json({ received: true })
    }

    if (triggerEvent === 'MEETING_ENDED') {
      const { data: meeting } = await admin.from('consultation_meetings').select('attendee_email, attendee_name, thankyou_sent_at').eq('cal_booking_uid', uid).single()
      await admin.from('consultation_meetings').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('cal_booking_uid', uid)
      if (meeting?.attendee_email && !meeting.thankyou_sent_at) {
        sendConsultationThankYouEmail(meeting.attendee_email, meeting.attendee_name || null).catch(() => {})
        await admin.from('consultation_meetings').update({ thankyou_sent_at: new Date().toISOString() }).eq('cal_booking_uid', uid)
      }
      return NextResponse.json({ received: true })
    }

    // Any other event type (BOOKING_REQUESTED, MEETING_STARTED, etc.) — ack
    // without action, nothing downstream depends on them today.
    return NextResponse.json({ received: true, ignored: triggerEvent })
  } catch (err) {
    console.error('Cal.com webhook processing error:', String(err))
    return NextResponse.json({ error: 'Processing failed — retry' }, { status: 500 })
  }
}

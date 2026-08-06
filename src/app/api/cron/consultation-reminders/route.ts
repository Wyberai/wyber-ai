import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendConsultationReminder1DayEmail, sendConsultationReminder30MinEmail } from '@/lib/email'

// Cal.com has no "reminder time approaching" webhook event, so the 1-day and
// 30-minute-before reminders are polled here instead — meant to run every
// 10-15 minutes (see vercel.json). Each window is intentionally wide (a few
// hours for the 1-day reminder, ~40min for the 30-min one) so a missed or
// delayed cron tick can't skip a booking entirely; the *_sent_at columns make
// re-checking the same booking on the next tick a no-op.
//
// Meeting Google Meet links live in raw_payload.payload.metadata.videoCallUrl
// (Cal.com's booking payload shape) rather than a dedicated column — read
// straight through rather than duplicating it at write time.

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function meetLinkFrom(raw: unknown): string | undefined {
  const r = raw as { payload?: { metadata?: { videoCallUrl?: string } }, metadata?: { videoCallUrl?: string } } | null
  return r?.payload?.metadata?.videoCallUrl || r?.metadata?.videoCallUrl
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const now = new Date()
  const results = { oneDaySent: 0, thirtyMinSent: 0, errors: [] as string[] }

  // ── 1-day-before window: 22h-26h out, not yet sent ──────────────────────
  {
    const from = new Date(now.getTime() + 22 * 3600_000).toISOString()
    const to = new Date(now.getTime() + 26 * 3600_000).toISOString()
    const { data: due, error } = await admin
      .from('consultation_meetings')
      .select('cal_booking_uid, attendee_name, attendee_email, scheduled_start, raw_payload')
      .eq('status', 'scheduled')
      .is('reminder_1day_sent_at', null)
      .gte('scheduled_start', from)
      .lte('scheduled_start', to)
    if (error) results.errors.push(`1day query: ${error.message}`)
    for (const m of due || []) {
      try {
        await sendConsultationReminder1DayEmail(m.attendee_email, m.attendee_name, m.scheduled_start, meetLinkFrom(m.raw_payload))
        await admin.from('consultation_meetings').update({ reminder_1day_sent_at: new Date().toISOString() }).eq('cal_booking_uid', m.cal_booking_uid)
        results.oneDaySent++
      } catch (e) {
        results.errors.push(`1day send ${m.cal_booking_uid}: ${String(e)}`)
      }
    }
  }

  // ── 30-min-before window: 20-40 min out, not yet sent ───────────────────
  {
    const from = new Date(now.getTime() + 20 * 60_000).toISOString()
    const to = new Date(now.getTime() + 40 * 60_000).toISOString()
    const { data: due, error } = await admin
      .from('consultation_meetings')
      .select('cal_booking_uid, attendee_name, attendee_email, raw_payload')
      .eq('status', 'scheduled')
      .is('reminder_30min_sent_at', null)
      .gte('scheduled_start', from)
      .lte('scheduled_start', to)
    if (error) results.errors.push(`30min query: ${error.message}`)
    for (const m of due || []) {
      try {
        await sendConsultationReminder30MinEmail(m.attendee_email, m.attendee_name, meetLinkFrom(m.raw_payload))
        await admin.from('consultation_meetings').update({ reminder_30min_sent_at: new Date().toISOString() }).eq('cal_booking_uid', m.cal_booking_uid)
        results.thirtyMinSent++
      } catch (e) {
        results.errors.push(`30min send ${m.cal_booking_uid}: ${String(e)}`)
      }
    }
  }

  return NextResponse.json({ success: true, ...results, timestamp: now.toISOString() })
}

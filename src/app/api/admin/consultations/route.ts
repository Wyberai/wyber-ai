import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    attendee_name?: string
    attendee_email: string
    scheduled_start: string
    scheduled_end?: string
    notes?: string
    intake_answers?: Record<string, string>
    source?: string
    cal_booking_uid?: string
  }

  if (!body.attendee_email || !body.scheduled_start) {
    return NextResponse.json({ error: 'attendee_email and scheduled_start are required' }, { status: 400 })
  }

  // Generate a stable UID from email + start time if not provided
  const uid = body.cal_booking_uid
    ?? `manual_${body.attendee_email.split('@')[0]}_${Date.now()}`

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('consultation_meetings')
    .insert({
      cal_booking_uid: uid,
      attendee_name: body.attendee_name ?? null,
      attendee_email: body.attendee_email,
      scheduled_start: body.scheduled_start,
      scheduled_end: body.scheduled_end ?? null,
      status: 'scheduled',
      notes: body.notes ?? null,
      intake_answers: body.intake_answers ?? null,
      source: body.source ?? 'manual',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

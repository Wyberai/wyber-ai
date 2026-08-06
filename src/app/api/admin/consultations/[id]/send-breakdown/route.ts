import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { sendBreakdownEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as {
    complexity: string
    tools: string[]
    credits_low: number
    credits_high: number
    note: string
  }

  const { complexity, tools, credits_low, credits_high, note } = body
  if (!complexity || typeof credits_low !== 'number' || typeof credits_high !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: meeting, error: fetchErr } = await admin
    .from('consultation_meetings')
    .select('attendee_email, attendee_name')
    .eq('id', id)
    .single()

  if (fetchErr || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  await sendBreakdownEmail(meeting.attendee_email, meeting.attendee_name || null, {
    complexity,
    tools: tools ?? [],
    credits_low,
    credits_high,
    note: note ?? '',
  })

  const sentAt = new Date().toISOString()
  const payload = { complexity, tools: tools ?? [], credits_low, credits_high, note: note ?? '' }

  const { error: updateErr } = await admin
    .from('consultation_meetings')
    .update({ breakdown_sent_at: sentAt, breakdown_payload: payload, updated_at: sentAt })
    .eq('id', id)

  if (updateErr) {
    console.error('Breakdown email sent but DB update failed:', updateErr.message)
  }

  return NextResponse.json({ ok: true, sent_at: sentAt })
}

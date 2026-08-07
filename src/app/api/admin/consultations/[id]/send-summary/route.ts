import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { sendConsultationSummaryEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { call_summary, idea_one_liner } = await req.json() as {
    call_summary: string
    idea_one_liner: string
  }

  if (!call_summary?.trim()) {
    return NextResponse.json({ error: 'call_summary is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: m, error } = await admin
    .from('consultation_meetings')
    .select('attendee_name, attendee_email')
    .eq('id', id)
    .single()

  if (error || !m) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await sendConsultationSummaryEmail({
    to: m.attendee_email,
    name: m.attendee_name,
    callSummary: call_summary,
    ideaOneLiner: idea_one_liner || 'your idea as discussed',
  })

  const now = new Date().toISOString()
  await admin
    .from('consultation_meetings')
    .update({ summary_sent_at: now, updated_at: now })
    .eq('id', id)

  return NextResponse.json({ ok: true, sent_at: now })
}

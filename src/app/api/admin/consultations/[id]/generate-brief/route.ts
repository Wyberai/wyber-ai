import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { generateConsultationBrief } from '@/lib/consultation-brief'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: m, error } = await admin
    .from('consultation_meetings')
    .select('attendee_name, attendee_email, scheduled_start, intake_answers, notes')
    .eq('id', id)
    .single()

  if (error || !m) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let brief: Record<string, unknown>
  try {
    brief = await generateConsultationBrief(m)
  } catch {
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }

  await admin
    .from('consultation_meetings')
    .update({ ai_brief: brief, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, brief })
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ConsultationsClient from './ConsultationsClient'

export const metadata: Metadata = { title: 'Consultations — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminConsultationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/consultations')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = await createAdminClient()
  const { data: meetings } = await admin
    .from('consultation_meetings')
    .select('id, cal_booking_uid, attendee_name, attendee_email, scheduled_start, scheduled_end, status, notes, recording_url, converted, deal_value, source, intake_answers, conversion_ideas, breakdown_sent_at, breakdown_payload, confirmation_sent_at, reminder_1day_sent_at, reminder_30min_sent_at, thankyou_sent_at, ai_brief, created_at')
    .order('scheduled_start', { ascending: true })
    .limit(500)

  return <ConsultationsClient initialMeetings={meetings ?? []} />
}

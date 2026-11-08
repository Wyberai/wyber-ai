import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loadSchedule } from '@/lib/ops/schedule-load'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CompanyNav from '@/components/admin/CompanyNav'
import TodayClient from './TodayClient'

export const metadata: Metadata = { title: 'Schedule — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminTodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/today')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  const initial = await loadSchedule(createAdminClient())
  return <><CompanyNav /><TodayClient initial={JSON.parse(JSON.stringify(initial))} /></>
}

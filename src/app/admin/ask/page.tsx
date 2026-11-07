import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CompanyNav from '@/components/admin/CompanyNav'
import AskClient from './AskClient'

export const metadata: Metadata = { title: 'Ask — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminAskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/ask')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  return <><CompanyNav /><AskClient /></>
}

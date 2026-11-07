import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CompanyNav from '@/components/admin/CompanyNav'
import BoothClient from './BoothClient'

export const metadata: Metadata = { title: 'Booth capture — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminBoothPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/booth')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  return <><CompanyNav /><BoothClient /></>
}

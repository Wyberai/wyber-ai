import { createClient } from '@/lib/supabase/server'
import CompanyNav from '@/components/admin/CompanyNav'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import QuotesClient from './QuotesClient'

export const metadata: Metadata = { title: 'Quotes — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/quotes')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  return <><CompanyNav /><QuotesClient /></>
}

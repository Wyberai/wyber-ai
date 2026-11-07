import { createClient, createAdminClient } from '@/lib/supabase/server'
import CompanyNav from '@/components/admin/CompanyNav'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CrmClient from './CrmClient'
import { loadContacts } from '@/lib/crm/db'
import type { Contact } from '@/lib/crm/contact'

export const metadata: Metadata = { title: 'CRM — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminCrmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/crm')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  let contacts: Contact[] = []
  let error: string | null = null
  try {
    contacts = await loadContacts(admin)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load the CRM'
  }
  return <><CompanyNav /><CrmClient initialContacts={contacts} loadError={error} /></>
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import EnterpriseLeadsClient from './EnterpriseLeadsClient'

export const metadata: Metadata = { title: 'Enterprise leads — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminEnterpriseLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/enterprise-leads')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: leads } = await admin
    .from('enterprise_leads')
    .select('id, name, email, company, team_size, message, source, status, notes, org_id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return <EnterpriseLeadsClient initialLeads={leads ?? []} />
}

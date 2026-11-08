import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loadAgentsState } from '@/lib/ops/agents/state'
import CompanyNav from '@/components/admin/CompanyNav'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AgentsClient from './AgentsClient'

export const metadata: Metadata = { title: 'Agents — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/agents')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  // Load the first screen's data here, in the same trip as the page, instead of after it loads.
  const initial = await loadAgentsState(createAdminClient())
  return <><CompanyNav /><AgentsClient initial={JSON.parse(JSON.stringify(initial))} /></>
}

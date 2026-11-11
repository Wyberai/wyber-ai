import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { visibleClients, myWorkspaces } from '@/lib/agency/access'
import { clientForOwner, CLIENT_LIST_SELECT } from '@/lib/agency/shape'
import { ClientsPageClient } from './ClientsPageClient'

export const metadata = { title: 'Clients', robots: { index: false, follow: false } }

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/clients')

  // Access rules live in one place (src/lib/agency/access.ts): your own clients plus the ones in your agency workspaces.
  const admin = await createAdminClient()
  const [rows, workspaces] = await Promise.all([visibleClients(admin, user.id, CLIENT_LIST_SELECT), myWorkspaces(admin, user.id)])

  // Projects you can attach: yours, plus those that belong to a workspace you are in.
  const orgIds = workspaces.map(w => w.id)
  const { data: own } = await admin.from('projects').select('id, name, thumbnail_url, org_id').eq('user_id', user.id).order('updated_at', { ascending: false })
  const { data: shared } = orgIds.length
    ? await admin.from('projects').select('id, name, thumbnail_url, org_id').in('org_id', orgIds).order('updated_at', { ascending: false })
    : { data: [] as Array<{ id: string; name: string; thumbnail_url: string | null; org_id: string | null }> }
  const seen = new Set<string>()
  const projects = [...(own ?? []), ...(shared ?? [])].filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  return <ClientsPageClient initialClients={rows.map(clientForOwner) as never} projects={projects} workspaces={workspaces} />
}

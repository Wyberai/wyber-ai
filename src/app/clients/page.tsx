import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { visibleClients, myWorkspaces } from '@/lib/agency/access'
import { clientForOwner, CLIENT_LIST_SELECT, creditsSpentFor } from '@/lib/agency/shape'
import { ClientsPageClient } from './ClientsPageClient'
import { PROFILE_COLUMNS } from '@/lib/agency/profile'

export const metadata = { title: 'Clients', robots: { index: false, follow: false } }

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/clients')

  // Access rules live in one place (src/lib/agency/access.ts): your own clients plus the ones in your agency workspaces.
  const admin = await createAdminClient()
  const [rows, workspaces] = await Promise.all([visibleClients(admin, user.id, CLIENT_LIST_SELECT), myWorkspaces(admin, user.id)])

  // Projects you can attach: yours, plus those that belong to a workspace you are in.
  const orgIds = workspaces.map(w => w.id)
  const { data: own } = await admin.from('projects').select('id, name, thumbnail_url, org_id, project_type').eq('user_id', user.id).order('updated_at', { ascending: false })
  const { data: shared } = orgIds.length
    ? await admin.from('projects').select('id, name, thumbnail_url, org_id, project_type').in('org_id', orgIds).order('updated_at', { ascending: false })
    : { data: [] as Array<{ id: string; name: string; thumbnail_url: string | null; org_id: string | null; project_type: string | null }> }
  const seen = new Set<string>()
  const projects = [...(own ?? []), ...(shared ?? [])].filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  // For the projects attached to clients: credits used on each, and the pinned comments clients left on the live preview.
  const attached = new Set<string>()
  for (const c of rows) for (const d of ((c.client_deliverables ?? []) as Array<{ project_id: string }>)) attached.add(d.project_id)
  const ids = [...attached]
  const [{ data: usage }, { data: pins }, { data: modes }] = ids.length
    ? await Promise.all([
        admin.from('generation_usage_log').select('project_id, credits_charged').in('project_id', ids),
        admin.from('preview_comments').select('id, project_id, page_path, body, author_name, resolved, created_at').in('project_id', ids).eq('resolved', false).order('created_at', { ascending: false }).limit(300),
        admin.from('projects').select('id, feedback_mode_enabled').in('id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // The business profile for each tenant the person belongs to: their own, and one per workspace.
  const { data: myProfile } = await admin.from('agency_profiles').select(PROFILE_COLUMNS).eq('owner_id', user.id).maybeSingle()
  const { data: orgProfiles } = orgIds.length ? await admin.from('agency_profiles').select(`org_id, ${PROFILE_COLUMNS}`).in('org_id', orgIds) : { data: [] as Array<Record<string, unknown>> }
  const profiles: Record<string, unknown> = { me: myProfile ?? null }
  for (const p of (orgProfiles ?? []) as Array<{ org_id: string }>) { const { org_id, ...rest } = p; profiles[org_id] = rest }

  const clients = rows.map(c => {
    const projectIds = ((c.client_deliverables ?? []) as Array<{ project_id: string }>).map(d => d.project_id)
    return { ...clientForOwner(c), credits_used: creditsSpentFor(projectIds, (usage ?? []) as Array<{ project_id: string | null; credits_charged: number | null }>) }
  })

  return (
    <ClientsPageClient
      initialClients={clients as never}
      projects={projects}
      workspaces={workspaces}
      pins={(pins ?? []) as never}
      profiles={profiles as never}
      welcome={welcome === '1'}
      feedbackModes={Object.fromEntries(((modes ?? []) as Array<{ id: string; feedback_mode_enabled: boolean | null }>).map(m => [m.id, !!m.feedback_mode_enabled]))}
    />
  )
}

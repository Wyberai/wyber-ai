import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from './ClientsPageClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/clients')

  const { data: clients } = await supabase
    .from('clients')
    .select('*, client_deliverables(id, headline, description, sort_order, is_visible, project_id, projects(id, name, thumbnail_url))')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, thumbnail_url')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <ClientsPageClient initialClients={clients ?? []} projects={projects ?? []} />
}

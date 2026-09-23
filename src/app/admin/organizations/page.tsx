import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import OrganizationsClient from './OrganizationsClient'

export const metadata: Metadata = { title: 'Organizations — admin', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ q?: string }> }

// Platform-staff view of orgs, primarily to flip organizations.plan to 'enterprise'
// once a deal closes (see /api/admin/organizations/[id]) — previously only possible
// via a raw SQL script against prod.
export default async function AdminOrganizationsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/organizations')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  const query = (q ?? '').trim()
  const base = admin.from('organizations').select('id, name, slug, plan, owner_id, custom_domain, created_at').order('created_at', { ascending: false }).limit(50)
  const { data: orgs } = query ? await base.or(`name.ilike.%${query}%,slug.ilike.%${query}%`) : await base

  const ownerIds = [...new Set((orgs ?? []).map(o => o.owner_id))]
  const { data: owners } = ownerIds.length ? await admin.from('profiles').select('id, email').in('id', ownerIds) : { data: [] }
  const emailById = new Map((owners ?? []).map(o => [o.id, o.email as string]))

  const results = (orgs ?? []).map(o => ({ ...o, owner_email: emailById.get(o.owner_id) ?? 'unknown' }))

  return <OrganizationsClient initialOrgs={results} query={query} />
}

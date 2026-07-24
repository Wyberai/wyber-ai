import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { AdminMarketplaceClient, type AdminListing } from './AdminMarketplaceClient'

export const dynamic = 'force-dynamic'

export default async function AdminMarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/dashboard')

  const db = createServiceClient()

  let listings: AdminListing[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('marketplace_listings')
      .select('id, seller_id, source, title, category, price_usd, status, sales_count, created_at')
      .eq('source', 'user')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error

    const ids = Array.from(new Set((data ?? []).map(l => l.seller_id).filter(Boolean))) as string[]
    const emailById: Record<string, string> = {}
    if (ids.length) {
      const { data: profiles } = await db.from('profiles').select('id, email').in('id', ids)
      profiles?.forEach(p => { emailById[p.id] = p.email })
    }
    listings = (data ?? []).map(l => ({ ...l, email: emailById[l.seller_id ?? ''] ?? '—' }))
  } catch {
    tableReady = false // migration not applied yet
  }

  return <AdminMarketplaceClient listings={listings} tableReady={tableReady} />
}

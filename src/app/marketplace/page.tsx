import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceClient, type MarketplaceListing } from './MarketplaceClient'

export const metadata: Metadata = {
  title: 'Marketplace — Buy ready-made apps built on WyberAi',
  description: 'Browse real apps built on WyberAi and buy one for a price the seller set. Every purchase drops a fully editable copy straight into your account.',
  openGraph: {
    title: 'WyberAi Marketplace — Buy ready-made apps',
    description: 'Real apps, real prices, instantly yours to edit.',
    url: 'https://wyberai.com/marketplace',
  },
}

export const dynamic = 'force-dynamic'

// Server component: resolves seller display info here (profiles is
// owner-only under RLS — see supabase/schema.sql — so a public grid can't
// read seller name/avatar with a client-side query the way /gallery reads
// prebuilt_apps). Ships a fully-formed, already-safe array to the client.
export default async function MarketplacePage() {
  const db = createServiceClient()

  let listings: MarketplaceListing[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('marketplace_listings')
      .select('id, seller_id, source, title, description, category, price_usd, thumbnail_url, preview_color, sales_count, created_at')
      .eq('status', 'approved')
      .order('sales_count', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    const sellerIds = Array.from(new Set((data ?? []).map(l => l.seller_id).filter(Boolean))) as string[]
    const sellerById: Record<string, { name: string; avatar_url: string | null }> = {}
    if (sellerIds.length) {
      const { data: profiles } = await db.from('profiles').select('id, full_name, email, avatar_url').in('id', sellerIds)
      profiles?.forEach(p => { sellerById[p.id] = { name: p.full_name || p.email?.split('@')[0] || 'Builder', avatar_url: p.avatar_url } })
    }

    listings = (data ?? []).map(l => ({
      ...l,
      sellerName: l.source === 'studio' ? 'WyberAi Studio' : (sellerById[l.seller_id ?? '']?.name ?? 'Builder'),
      sellerAvatarUrl: l.source === 'studio' ? null : (sellerById[l.seller_id ?? '']?.avatar_url ?? null),
    }))
  } catch {
    tableReady = false // migration not applied yet
  }

  return <MarketplaceClient listings={listings} tableReady={tableReady} />
}

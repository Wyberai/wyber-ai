import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ListingDetailClient } from './ListingDetailClient'

export const dynamic = 'force-dynamic'

async function loadListing(id: string) {
  const db = createServiceClient()
  const { data: listing } = await db
    .from('marketplace_listings')
    .select('id, seller_id, source, title, description, category, price_usd, preview_color, thumbnail_url, framework, sales_count, created_at')
    .eq('id', id)
    .eq('status', 'approved')
    .single()
  if (!listing) return null

  let sellerName = 'WyberAi Studio'
  let sellerAvatarUrl: string | null = null
  if (listing.source === 'user' && listing.seller_id) {
    const { data: profile } = await db.from('profiles').select('full_name, email, avatar_url').eq('id', listing.seller_id).single()
    sellerName = profile?.full_name || profile?.email?.split('@')[0] || 'Builder'
    sellerAvatarUrl = profile?.avatar_url ?? null
  }

  return { ...listing, sellerName, sellerAvatarUrl }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const listing = await loadListing(id)
  if (!listing) return { title: 'Listing not found — WyberAi Marketplace' }
  return {
    title: `${listing.title} — $${listing.price_usd} | WyberAi Marketplace`,
    description: listing.description,
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await loadListing(id)
  if (!listing) notFound()

  return <ListingDetailClient listing={listing} />
}

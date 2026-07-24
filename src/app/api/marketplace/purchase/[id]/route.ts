import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/marketplace/purchase/[id]
// Polled by /marketplace/purchase/[id] while the Dodo webhook fulfills the
// purchase asynchronously in the background. Scoped to the buyer only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createServiceClient()
  const { data: purchase, error } = await db
    .from('marketplace_purchases')
    .select('buyer_id, status, delivered_project_id, listing_id')
    .eq('id', id)
    .single()

  if (error || !purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  if (purchase.buyer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: listing } = await db.from('marketplace_listings').select('title').eq('id', purchase.listing_id).single()

  return NextResponse.json({
    status: purchase.status,
    deliveredProjectId: purchase.delivered_project_id,
    listingTitle: listing?.title ?? null,
  })
}

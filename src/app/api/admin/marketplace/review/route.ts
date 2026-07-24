import { NextRequest, NextResponse, after } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { generateMarketplaceThumbnail } from '@/lib/marketplace-thumbnail'

// Approve / reject a marketplace listing submission. Mirrors
// src/app/api/admin/community/review/route.ts. Admin-gated + service-role,
// so a seller can never self-approve straight onto the public grid.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, action } = await req.json().catch(() => ({})) as { id?: string; action?: 'approve' | 'reject' }
  if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 })

  const db = createServiceClient()
  const { data: listing } = await db
    .from('marketplace_listings')
    .select('id, source, status')
    .eq('id', id)
    .single()
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.source === 'studio') return NextResponse.json({ error: 'Studio listings are already approved by the seed script' }, { status: 400 })

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const { error } = await db
    .from('marketplace_listings')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // No point spending a build + headless-Chrome screenshot on a listing that
  // might get rejected — only generate on approve, and after the response so
  // the admin's click doesn't wait on it.
  if (action === 'approve') after(() => generateMarketplaceThumbnail(id))

  return NextResponse.json({ ok: true, status: newStatus })
}

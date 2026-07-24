import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateMarketplaceThumbnail } from '@/lib/marketplace-thumbnail'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/admin/marketplace/thumbnails
// Generates a real screenshot for every marketplace_listings row missing one
// (see src/lib/marketplace-thumbnail.ts for the build → screenshot → store
// pipeline). Small batches (default 5) since each row is a real build +
// headless-Chrome launch, not a cheap DB write — this is expected to take
// real wall-clock time per call, unlike /api/admin/seed-marketplace.
export async function POST(req: NextRequest) {
  try {
    const authKey = req.headers.get('x-admin-key')
    const adminSecret = process.env.ADMIN_SECRET_KEY
    if (!adminSecret || authKey !== adminSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()
    const { batchSize } = await req.json().catch(() => ({ batchSize: 5 })) as { batchSize?: number }
    const limit = Math.min(batchSize ?? 5, 10)

    const { data: listings, error: fetchErr } = await admin
      .from('marketplace_listings')
      .select('id, title')
      .eq('status', 'approved')
      .is('thumbnail_url', null)
      .order('created_at')
      .limit(limit)

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!listings?.length) return NextResponse.json({ processed: 0, remaining: 0, message: 'All done' })

    for (const listing of listings) {
      await generateMarketplaceThumbnail(listing.id)
    }

    const { count: stillMissing } = await admin
      .from('marketplace_listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('thumbnail_url', null)

    return NextResponse.json({ processed: listings.length, remaining: stillMissing ?? undefined })
  } catch (err) {
    console.error('Marketplace thumbnails error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

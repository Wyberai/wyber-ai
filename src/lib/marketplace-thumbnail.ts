import { createServiceClient } from '@/lib/supabase/server'
import { templateFilesToProjectFiles } from '@/lib/template-to-project'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { captureScreenshot, uploadScreenshot } from '@/lib/screenshot'

const BUILDER_URL = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com'

// Builds a listing's source via the same preview-builder service the editor's
// live preview uses, screenshots the result, and stores it as the listing's
// thumbnail. Used by the batched admin sweep (src/app/api/admin/marketplace/
// thumbnails/route.ts) and by a single-listing trigger right after a
// submission is approved (src/app/api/admin/marketplace/review/route.ts).
// Never throws — a failed thumbnail is non-critical and must not block
// either caller; failures are logged only.
//
// thumbnail_url encodes three states, not two: null = never attempted,
// '' = attempted and failed (e.g. the source has a genuine build error —
// some prebuilt_apps rows do), a real URL = succeeded. Without the distinct
// '' state, a failure leaves the column null forever, so the batch sweep's
// `WHERE thumbnail_url IS NULL` query would return the exact same broken
// rows every single call and never make progress through the rest of the
// catalog.
export async function generateMarketplaceThumbnail(listingId: string): Promise<void> {
  const db = createServiceClient()
  try {
    const { data: listing, error } = await db
      .from('marketplace_listings')
      .select('id, title, files, thumbnail_url')
      .eq('id', listingId)
      .single()
    if (error || !listing) throw new Error(error?.message || 'Listing not found')
    if (listing.thumbnail_url !== null) return // already attempted (succeeded or failed)

    const normalized = templateFilesToProjectFiles(listing.files, listing.title)
    const sanitized = sanitizeFiles(normalized, { appId: listing.id })

    const buildRes = await fetch(`${BUILDER_URL}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: sanitized, projectId: listing.id }),
    })
    const buildData = await buildRes.json().catch(() => ({}))
    if (!buildRes.ok || !buildData.url) throw new Error(buildData.error || `builder returned ${buildRes.status}`)

    const screenshot = await captureScreenshot(buildData.url)
    const publicUrl = await uploadScreenshot(screenshot, `marketplace-thumbnails/${listing.id}.jpg`)

    await db.from('marketplace_listings').update({ thumbnail_url: publicUrl }).eq('id', listing.id)
  } catch (err) {
    console.error(`generateMarketplaceThumbnail failed for ${listingId}:`, String(err))
    await db.from('marketplace_listings').update({ thumbnail_url: '' }).eq('id', listingId)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { processQueuedMessage } from '@/lib/mcp/build-runner'

// Each tick runs real builds (via /api/generate) end-to-end, so give it the
// same ceiling as the publish/preview builds. Builds take 8-10 minutes +
// Vercel overhead, so raise from 300s. We process a small batch sequentially.
export const maxDuration = 900

// How many queued builds to drain per minute-tick. Kept low because each build
// is a full generation; the queue drains over successive ticks.
const BATCH = 2

// A message stuck in 'processing' this long is from a crashed/killed worker —
// reclaim it. Comfortably longer than any real build.
const STALE_MS = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call (same guard as the other crons).
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  // ── Reclaim crashed builds ──────────────────────────────────────────────
  // No dedicated processing-started column exists, so approximate: a row still
  // 'processing' but created long ago is stuck (real builds finish in minutes).
  const staleCutoff = new Date(Date.now() - STALE_MS).toISOString()
  await db
    .from('mcp_messages')
    .update({ status: 'queued' })
    .eq('status', 'processing')
    .lt('created_at', staleCutoff)

  // ── Pull the oldest queued builds ───────────────────────────────────────
  const { data: queued, error } = await db
    .from('mcp_messages')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(BATCH)

  if (error) {
    console.error('[mcp-consumer] DB error fetching queue:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!queued || queued.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  // Process sequentially so we don't run multiple heavy builds concurrently in
  // one function invocation. processQueuedMessage claims atomically, so a
  // concurrent tick can never double-run the same row.
  let processed = 0
  for (const row of queued) {
    try {
      await processQueuedMessage(row.id)
      processed++
    } catch (err) {
      console.error(`[mcp-consumer] failed processing ${row.id}:`, err)
    }
  }

  return NextResponse.json({ processed })
}

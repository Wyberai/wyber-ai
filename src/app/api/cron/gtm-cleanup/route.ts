import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Delete UNCLAIMED campaign demos once they've aged out. A demo the founder
// claimed has is_demo flipped to false (see /api/gtm/claim), so it's excluded
// here and survives as their own project. Only unclaimed, still-is_demo rows
// past the age cutoff are removed: their published files are deleted from
// storage and the project row is hard-deleted.
//
// Auth: Authorization: Bearer CRON_SECRET (same as the other crons).
// Tunable: ?days=N (default 14) age cutoff; ?dryRun=1 to preview without deleting.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 14)
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: demos, error } = await admin
    .from('projects')
    .select('id, name, created_at')
    .eq('is_demo', true)
    .lt('created_at', cutoff)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (dryRun) {
    return NextResponse.json({ dryRun: true, days, wouldDelete: demos?.length ?? 0, demos: demos ?? [] })
  }

  const deleted: string[] = []
  const failed: Array<{ id: string; error: string }> = []
  for (const d of demos ?? []) {
    try {
      // Remove every published asset under this project's storage folder, then
      // the row itself. List first — an app can ship more than index.html.
      const { data: files } = await admin.storage.from('published-apps').list(d.id)
      if (files && files.length) {
        await admin.storage.from('published-apps').remove(files.map(f => `${d.id}/${f.name}`))
      }
      const { error: delErr } = await admin.from('projects').delete().eq('id', d.id).eq('is_demo', true)
      if (delErr) { failed.push({ id: d.id, error: delErr.message }); continue }
      deleted.push(d.id)
    } catch (e) {
      failed.push({ id: d.id, error: String(e) })
    }
  }

  return NextResponse.json({ ok: true, days, deleted: deleted.length, failed, timestamp: new Date().toISOString() })
}

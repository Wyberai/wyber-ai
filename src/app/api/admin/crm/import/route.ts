import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { csvToIncoming } from '@/lib/crm/csv'
import { syncIncoming } from '@/lib/crm/db'
import { isSegment } from '@/lib/crm/stages'

export const maxDuration = 60
const MAX_BYTES = 5_000_000
const MAX_ROWS = 20_000

// Import a lead list (Apollo export, the WhatsApp sheet, a master list) pasted
// or uploaded as CSV text. De-duplicates against everyone already in the CRM
// and drops the founder's own addresses.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  const csv = typeof b?.csv === 'string' ? b.csv : ''
  if (!csv.trim()) return NextResponse.json({ error: 'Paste the CSV text first' }, { status: 400 })
  if (csv.length > MAX_BYTES) return NextResponse.json({ error: 'File too large (5 MB max)' }, { status: 413 })

  const source = String(b?.source ?? 'import').replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'import'
  const segment = isSegment(b?.segment) ? (b!.segment as string) : undefined
  const tags = Array.isArray(b?.tags) ? (b!.tags as unknown[]).map(String).slice(0, 10) : []
  const country = typeof b?.country === 'string' && b.country.trim() ? b.country.trim().slice(0, 60) : undefined

  const { incoming, headers, unmapped } = csvToIncoming(csv, { source, segment, country, tags })
  if (!incoming.length) return NextResponse.json({ error: 'No rows found. The first line must be the column names.' }, { status: 400 })
  if (incoming.length > MAX_ROWS) return NextResponse.json({ error: `Too many rows (${MAX_ROWS} max)` }, { status: 413 })

  try {
    const result = await syncIncoming(admin, incoming)
    return NextResponse.json({ ok: result.errors.length === 0, rows: incoming.length, headers, unmapped, ...result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Import failed' }, { status: 500 })
  }
}

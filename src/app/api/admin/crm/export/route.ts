import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadContacts } from '@/lib/crm/db'
import { contactsToCsv, filterForExport } from '@/lib/crm/csv'
import { isStage } from '@/lib/crm/stages'

export const dynamic = 'force-dynamic'

// Download contacts as a spreadsheet file. Admin only. Optional filters: ?stage= &source= &tag= &min_score=
export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams
  const stage = q.get('stage') ?? undefined
  if (stage && !isStage(stage)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })
  const min = q.get('min_score')
  let contacts
  try { contacts = await loadContacts(admin) } catch { return NextResponse.json({ error: 'The CRM could not be read' }, { status: 500 }) }
  const rows = filterForExport(contacts, { stage, source: q.get('source') ?? undefined, tag: q.get('tag') ?? undefined, minScore: min !== null && min !== '' && Number.isFinite(Number(min)) ? Number(min) : undefined })
  const name = `wyberai-contacts-${new Date().toISOString().slice(0, 10)}${stage ? `-${stage}` : ''}.csv`
  return new NextResponse(contactsToCsv(rows as unknown as Record<string, unknown>[]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  })
}

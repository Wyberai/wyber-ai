import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { toCsv } from '@/lib/agency/csv'

// A plain record of everything the client said and did on their page: who approved what, and when, plus every change
// request and comment. Handy to attach to an invoice or keep if there is ever a disagreement about what was signed off.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: dels }, { data: feedback }, { data: quotes }] = await Promise.all([
    admin.from('client_deliverables').select('id, headline, projects(name)').eq('client_id', id),
    admin.from('client_feedback').select('deliverable_id, kind, author_name, body, resolved, created_at').eq('client_id', id).order('created_at', { ascending: true }),
    admin.from('client_quotes').select('number, title, status, total, currency, responded_at, responded_by, decline_reason').eq('client_id', id).order('created_at', { ascending: true }),
  ])
  const nameOf = new Map(((dels ?? []) as Array<{ id: string; headline: string | null; projects: { name?: string } | Array<{ name?: string }> | null }>).map(d => {
    const pr = Array.isArray(d.projects) ? d.projects[0] : d.projects
    return [d.id, d.headline || pr?.name || 'Project']
  }))

  const rows: unknown[][] = []
  for (const f of (feedback ?? []) as Array<{ deliverable_id: string | null; kind: string; author_name: string | null; body: string | null; resolved: boolean; created_at: string }>) {
    rows.push([f.created_at, f.kind === 'approved' ? 'Approved' : f.kind === 'changes_requested' ? 'Changes requested' : 'Comment', nameOf.get(f.deliverable_id ?? '') ?? 'Project', f.author_name ?? '', f.body ?? '', f.kind === 'changes_requested' ? (f.resolved ? 'yes' : 'no') : ''])
  }
  for (const q of (quotes ?? []) as Array<{ number: string; title: string; status: string; total: number; currency: string; responded_at: string | null; responded_by: string | null; decline_reason: string | null }>) {
    if (q.responded_at) rows.push([q.responded_at, q.status === 'declined' ? 'Quote declined' : 'Quote accepted', `${q.number} ${q.title} (${q.currency} ${q.total})`, q.responded_by ?? '', q.decline_reason ?? '', ''])
  }
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  rows.unshift(['When', 'What', 'Project or quote', 'Who', 'Note', 'Done'])

  const safe = String(access.client.name).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client'
  return new NextResponse(toCsv(rows), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${safe}-approvals.csv"`, 'Cache-Control': 'no-store' },
  })
}

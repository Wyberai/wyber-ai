import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { applyDraftAction, type DraftAction, type DraftRow } from '@/lib/ops/agents/draft-actions'
import type { Contact } from '@/lib/crm/contact'

// Act on one draft: edit, approve, reject (with a reason), or mark sent. Marking
// sent also updates the CRM (stage, last touch, next follow-up, activity log).
// This route never sends anything: the human sends, then records it here.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })

  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  const action = typeof b?.action === 'string' ? b.action : ''
  let parsed: DraftAction
  if (action === 'edit') parsed = { action, body: String(b?.body ?? '') }
  else if (action === 'reject') parsed = { action, reason: String(b?.reason ?? '') }
  else if (action === 'approve' || action === 'sent') parsed = { action }
  else return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { data: draft, error: dErr } = await admin.from('ops_agent_drafts').select('id, agent, contact_id, channel, body, status').eq('id', id).maybeSingle()
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let contact: Contact | null = null
  if (draft.contact_id) {
    const { data } = await admin.from('crm_contacts').select('*').eq('id', draft.contact_id).maybeSingle()
    contact = (data as Contact | null) ?? null
  }

  const r = applyDraftAction(draft as DraftRow, contact, parsed)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })

  const { data: updated, error } = await admin.from('ops_agent_drafts').update(r.draftPatch).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (contact && r.contactPatch) await admin.from('crm_contacts').update(r.contactPatch).eq('id', contact.id)
  if (contact && r.activity) await admin.from('crm_activities').insert({ contact_id: contact.id, kind: r.activity.kind, summary: r.activity.summary, by: 'admin' })
  return NextResponse.json({ draft: updated })
}

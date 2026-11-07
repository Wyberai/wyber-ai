import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { buildPatch } from '@/lib/crm/patch'
import type { Contact } from '@/lib/crm/contact'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: existing, error: loadErr } = await admin.from('crm_contacts').select('*').eq('id', id).maybeSingle()
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = buildPatch(existing as Contact, body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })

  const { data: updated, error } = await admin.from('crm_contacts').update(r.patch).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (r.activity) await admin.from('crm_activities').insert({ contact_id: id, kind: 'system', summary: r.activity, by: 'admin' })
  return NextResponse.json({ contact: updated })
}

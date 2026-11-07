import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { computeTotal, newToken, validateQuoteInput } from '@/lib/quotes/quote'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contactId = req.nextUrl.searchParams.get('contactId')
  let q = admin.from('crm_quotes').select('*').order('created_at', { ascending: false }).limit(200)
  if (contactId) {
    if (!/^[0-9a-f-]{36}$/i.test(contactId)) return NextResponse.json({ error: 'Bad contact id' }, { status: 400 })
    q = q.eq('contact_id', contactId)
  }
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message, tablesMissing: true })
  // Attach contact names for the list.
  const ids = [...new Set((data ?? []).map((x: { contact_id: string | null }) => x.contact_id).filter(Boolean))] as string[]
  const names = new Map<string, string>()
  if (ids.length) {
    const c = await admin.from('crm_contacts').select('id, name, company').in('id', ids)
    for (const r of (c.data ?? []) as { id: string; name: string; company: string | null }[]) names.set(r.id, r.company ? `${r.name} (${r.company})` : r.name)
  }
  return NextResponse.json({ quotes: (data ?? []).map((x: { contact_id: string | null }) => ({ ...x, contact_name: x.contact_id ? names.get(x.contact_id) ?? null : null })) })
}

export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const v = validateQuoteInput(b)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  let contactId: string | null = null
  if (b.contact_id) {
    if (!/^[0-9a-f-]{36}$/i.test(String(b.contact_id))) return NextResponse.json({ error: 'Bad contact id' }, { status: 400 })
    contactId = String(b.contact_id)
  }

  const { data, error } = await admin.from('crm_quotes').insert({
    token: newToken(), contact_id: contactId, ...v.value, total: computeTotal(v.value.items), status: 'draft',
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quote: data })
}

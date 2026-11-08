import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { computeTotal, newToken, validateQuoteInput } from '@/lib/quotes/quote'
import { loadQuotesList } from '@/lib/quotes/load'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contactId = req.nextUrl.searchParams.get('contactId')
  if (contactId && !/^[0-9a-f-]{36}$/i.test(contactId)) return NextResponse.json({ error: 'Bad contact id' }, { status: 400 })
  const r = await loadQuotesList(admin, contactId ?? undefined)
  return NextResponse.json('tablesMissing' in r ? { error: r.error, tablesMissing: true } : r)
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

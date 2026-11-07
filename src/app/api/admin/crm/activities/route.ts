import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { validateActivity } from '@/lib/crm/patch'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contactId = req.nextUrl.searchParams.get('contactId') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(contactId)) return NextResponse.json({ error: 'Bad contact id' }, { status: 400 })
  const { data, error } = await admin.from('crm_activities').select('id, created_at, kind, summary, by').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activities: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const v = validateActivity(await req.json().catch(() => ({})))
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const { data, error } = await admin.from('crm_activities').insert({ contact_id: v.contactId, kind: v.kind, summary: v.summary, by: 'admin' }).select('id, created_at, kind, summary, by').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // A call, message or meeting counts as a touch; a private note does not.
  if (v.kind !== 'note' && v.kind !== 'system') {
    const now = new Date().toISOString()
    await admin.from('crm_contacts').update({ last_touch_at: now, updated_at: now }).eq('id', v.contactId)
  }
  return NextResponse.json({ activity: data })
}

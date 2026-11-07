import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { planReply, validateActivity } from '@/lib/crm/patch'

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
  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  // "They replied": record it, move the deal to Replied, set the next action, and honour a request to stop.
  if (body.reply === true) {
    const id = String(body.contactId ?? '')
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad contact id' }, { status: 400 })
    const { data: c, error: cErr } = await admin.from('crm_contacts').select('id, stage, tags').eq('id', id).maybeSingle()
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const plan = planReply(c as { stage: string; tags: string[] | null }, String(body.summary ?? ''), body.channel === 'email' ? 'email' : 'whatsapp')
    if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 })
    const { data: act, error: aErr } = await admin.from('crm_activities').insert({ contact_id: id, kind: plan.kind, summary: plan.summary, by: 'admin' }).select('id, created_at, kind, summary, by').single()
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })
    await admin.from('crm_contacts').update(plan.patch).eq('id', id)
    return NextResponse.json({ activity: act, optedOut: plan.optedOut, stage: plan.patch.stage ?? (c as { stage: string }).stage })
  }

  const v = validateActivity(body)
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

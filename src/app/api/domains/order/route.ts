import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUser, unauthorized } from '@/lib/domains/route-helpers'

// GET /api/domains/order?id=...: where one of the person's own orders is (waiting for payment, setting up, done, or needs
// a person). The screen polls this after the payment page sends them back, so they are never left on a blank page.
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const admin = await createAdminClient()
  const { data } = await admin.from('commerce_orders').select('id,kind,domain,status').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ id: data.id, kind: data.kind, domain: data.domain, status: data.status })
}

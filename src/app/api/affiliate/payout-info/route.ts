import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const payoutEmail = typeof body.payoutEmail === 'string' ? body.payoutEmail.trim().slice(0, 200) : undefined
  const payoutMethod = typeof body.payoutMethod === 'string' ? body.payoutMethod.trim().slice(0, 100) : undefined

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payoutEmail !== undefined) updates.payout_email = payoutEmail || null
  if (payoutMethod !== undefined) updates.payout_method = payoutMethod || null

  const admin = await createAdminClient()
  const { data, error } = await admin.from('affiliates').update(updates).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not an affiliate yet' }, { status: 404 })
  return NextResponse.json({ affiliate: data })
}

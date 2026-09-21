import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Self-serve affiliate application. Creates a `pending` row — no commission
// accrues until an admin approves it (see /api/admin/affiliates/review and
// src/lib/affiliate.ts for why approval is a hard gate, not a formality).
export async function POST() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: existing } = await admin.from('affiliates').select('*').eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ affiliate: existing })

  const { data, error } = await admin.from('affiliates').insert({ user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Reuses existing user_api_keys table pattern
export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const GTM_KEYS = [
    'apollo_api_key', 'zoominfo_api_key', 'lusha_api_key', 'hunter_api_key',
    'smartlead_api_key', 'instantly_api_key', 'outreach_api_key', 'salesloft_api_key',
    'justcall_api_key', 'aircall_api_key', 'hubspot_api_key', 'salesforce_api_key', 'attio_api_key',
  ]

  const { data } = await supabase
    .from('user_api_keys')
    .select('key_name')
    .eq('user_id', user.id)
    .in('key_name', GTM_KEYS)

  const connected: Record<string, boolean> = {}
  for (const row of data || []) connected[row.key_name] = true

  return NextResponse.json({ connected })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key_name, key_value } = await req.json()
  if (!key_name || !key_value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await supabase.from('user_api_keys').upsert(
    { user_id: user.id, key_name, key_value },
    { onConflict: 'user_id,key_name' }
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key_name } = await req.json()
  await supabase.from('user_api_keys').delete().eq('user_id', user.id).eq('key_name', key_name)

  return NextResponse.json({ success: true })
}

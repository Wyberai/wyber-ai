import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data } = await admin.from('profiles').select('notification_prefs').eq('id', user.id).maybeSingle()
  return NextResponse.json({ prefs: data?.notification_prefs ?? {} })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prefs } = await req.json()
  if (!prefs || typeof prefs !== 'object') return NextResponse.json({ error: 'prefs object required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('profiles').update({ notification_prefs: prefs }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

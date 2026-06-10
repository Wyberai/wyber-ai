import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await createAdminClient()
    const { data } = await admin.from('flows').select('*').eq('id', id).eq('user_id', user.id).single()
    return NextResponse.json({ flow: data })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const admin = await createAdminClient()
    
    if (body.run_count_increment) {
      const { data: curr } = await admin.from('flows').select('run_count').eq('id', id).single()
      await admin.from('flows').update({ run_count: (curr?.run_count || 0) + 1, last_run_at: new Date().toISOString() }).eq('id', id)
    } else {
      await admin.from('flows').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    }
    return NextResponse.json({ success: true })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

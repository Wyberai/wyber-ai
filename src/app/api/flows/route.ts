import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await createAdminClient()
    const { data } = await admin.from('flows').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    return NextResponse.json({ flows: data || [] })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, description, nodes, edges } = await req.json()
    const admin = await createAdminClient()
    const { data, error } = await admin.from('flows').insert({
      user_id: user.id, name: name || 'New Automation',
      description: description || '', nodes: nodes || [], edges: edges || [], is_active: false, run_count: 0
    }).select('*').single()
    if (error) throw error
    return NextResponse.json({ flow: data })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

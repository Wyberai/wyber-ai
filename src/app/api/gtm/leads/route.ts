import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const list_id = searchParams.get('list_id')
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200)
  const offset = Number(searchParams.get('offset') || 0)

  let query = supabase
    .from('gtm_leads')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('icp_score', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (list_id) query = query.eq('list_id', list_id)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data || [], total: count || 0 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { first_name, last_name, email, company_name, title, linkedin_url, list_id } = body
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data, error } = await supabase
    .from('gtm_leads')
    .insert({ user_id: user.id, first_name, last_name, email, company_name, title, linkedin_url, list_id, status: 'new', source: 'manual' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['status', 'icp_score', 'notes', 'list_id', 'title', 'company_name']
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  await supabase.from('gtm_leads').update(filtered).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('gtm_leads').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}

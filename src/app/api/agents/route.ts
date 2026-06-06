import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '24')
  const offset = (page - 1) * limit

  try {
    const supabase = await createAdminClient()

    let query = supabase
      .from('agent_workflows')
      .select('id,agent_id,name,category,primary_buyer,problem,outcome,complexity,is_featured,required_tools', { count: 'exact' })

    if (category && category !== 'All') query = query.eq('category', category)
    if (featured === 'true') query = query.eq('is_featured', true)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
      .order('is_featured', { ascending: false })
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ agents: data || [], total: count || 0, page, limit })
  } catch (err) {
    console.error('Agents API error:', String(err))
    return NextResponse.json({ error: String(err), agents: [], total: 0 }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('agent_workflows').select('category')
    if (error) throw error
    const counts: Record<string, number> = {}
    data?.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1 })
    return NextResponse.json({ categories: counts })
  } catch (err) {
    console.error('Agents categories error:', String(err))
    return NextResponse.json({ error: String(err), categories: {} }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/agents/by-agent-id?agentId=WYBER-079
export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  try {
    const supabase = getAdmin()
    const { data, error } = await supabase
      .from('agent_workflows')
      .select('id,agent_id,name,category,primary_buyer,problem,outcome,complexity,is_featured,required_tools')
      .eq('agent_id', agentId)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    return NextResponse.json({ agent: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

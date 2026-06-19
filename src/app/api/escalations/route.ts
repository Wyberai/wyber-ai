import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/escalations?status=pending  — list escalations for the current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  const { data, error } = await supabase
    .from('employee_escalations')
    .select(`
      id, question, context, status, decision, created_at, resolved_at,
      employee_id, run_id,
      ai_employees!employee_id(name, emoji, role)
    `)
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escalations: data })
}

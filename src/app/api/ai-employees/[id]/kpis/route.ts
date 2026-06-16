import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify ownership
  const { data: emp } = await db.from('ai_employees').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: logs } = await db
    .from('ai_employee_kpi_logs')
    .select('kpi_name, value, logged_at, run_id')
    .eq('employee_id', id)
    .order('logged_at', { ascending: false })
    .limit(200)

  return NextResponse.json({ logs: logs ?? [] })
}

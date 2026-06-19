import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/escalations/[id]  — approve or reject an escalation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { action: 'approved' | 'rejected'; decision?: string }
  if (!['approved', 'rejected'].includes(body.action)) {
    return NextResponse.json({ error: 'action must be approved or rejected' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('employee_escalations')
    .update({
      status: body.action,
      decision: body.decision ?? '',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found or already resolved' }, { status: 404 })
  return NextResponse.json({ escalation: data })
}

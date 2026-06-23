import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// The window into an employee's brain: its self-model, rolling narrative, the
// entity graph (people/accounts it knows), and recent episodic memories.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify ownership via the employee row, and grab the self-model + narrative.
  const { data: emp } = await db
    .from('ai_employees')
    .select('id, memory_summary, self_model')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: episodes }, { data: entities }] = await Promise.all([
    db.from('employee_episodes')
      .select('summary, learnings, outcome, importance, created_at')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('employee_entities')
      .select('kind, name, notes, state, importance, last_seen_at')
      .eq('employee_id', id)
      .order('last_seen_at', { ascending: false })
      .limit(40),
  ])

  return NextResponse.json({
    memory_summary: emp.memory_summary ?? '',
    self_model: emp.self_model ?? {},
    episodes: episodes ?? [],
    entities: entities ?? [],
  })
}

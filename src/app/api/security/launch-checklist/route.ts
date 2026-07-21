import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeChecklistState } from '@/lib/launch-checklist'
import { rateLimit } from '@/lib/rate-limit'

/** Load the founder's saved checklist state for a project (RLS-scoped to the owner). */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const { data } = await supabase
      .from('launch_checklist')
      .select('items, updated_at')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({ items: data?.items ?? {}, updatedAt: data?.updated_at ?? null })
  } catch {
    // Migration not applied yet — treat as an empty, unsaved checklist rather than erroring.
    return NextResponse.json({ items: {}, updatedAt: null })
  }
}

/** Save the founder's self-certified checklist state. No scanning — this is a human judgment call. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = rateLimit(`launch-checklist:${user.id}`, 60, 600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many updates in a short time. Please wait a moment.' }, { status: 429 })

  const { projectId, items } = await req.json().catch(() => ({}))
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const clean = sanitizeChecklistState(items)
  try {
    const { error } = await supabase
      .from('launch_checklist')
      .upsert({ project_id: projectId, user_id: user.id, items: clean, updated_at: new Date().toISOString() }, { onConflict: 'project_id' })
    if (error) throw error
    return NextResponse.json({ ok: true, items: clean })
  } catch (e) {
    return NextResponse.json({ error: 'Save failed: ' + String(e).slice(0, 200) }, { status: 500 })
  }
}

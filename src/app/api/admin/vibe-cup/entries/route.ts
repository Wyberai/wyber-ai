import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('vibe_cup_entries')
    .select('id, name, email, app_name, description, demo_url, project_url, vote_count, is_approved, award, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { id?: string; is_approved?: boolean; award?: string | null }
  const { id, ...patch } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db.from('vibe_cup_entries').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

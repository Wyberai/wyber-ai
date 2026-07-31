import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const APPETIZE_WEBHOOK_SECRET = process.env.APPETIZE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-appetize-secret')
  if (!APPETIZE_WEBHOOK_SECRET || secret !== APPETIZE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    projectId?: string
    appetizeBuildId?: string
    error?: string
  }
  const { projectId, appetizeBuildId, error } = body

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const admin = await createAdminClient()

  if (error || !appetizeBuildId) {
    await admin
      .from('projects')
      .update({ appetize_build_status: 'error' })
      .eq('id', projectId)
    return NextResponse.json({ ok: true })
  }

  await admin
    .from('projects')
    .update({
      appetize_build_id:     appetizeBuildId,
      appetize_build_status: 'ready',
    })
    .eq('id', projectId)

  return NextResponse.json({ ok: true })
}

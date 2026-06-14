import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface LearnProgress {
  completedSteps: string[]
  completedTracks: string[]
  certificateAt: string | null
  userName: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ progress: null }, { status: 401 })

    const admin = await createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('learn_progress, full_name')
      .eq('id', user.id)
      .single()

    if (!data) return NextResponse.json({ progress: null })

    const progress: LearnProgress = data.learn_progress ?? {
      completedSteps: [],
      completedTracks: [],
      certificateAt: null,
      userName: data.full_name ?? null,
    }
    // Always keep userName in sync with profile
    if (data.full_name && !progress.userName) {
      progress.userName = data.full_name
    }

    return NextResponse.json({ progress })
  } catch {
    return NextResponse.json({ progress: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const progress: LearnProgress = body.progress

    if (!progress || !Array.isArray(progress.completedSteps)) {
      return NextResponse.json({ error: 'Invalid progress data' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Attach the user's real name if not set
    if (!progress.userName) {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) progress.userName = profile.full_name
    }

    const { error } = await admin
      .from('profiles')
      .update({ learn_progress: progress, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      // Column may not exist yet — fail silently so localStorage still works
      console.warn('[learn/progress] DB update failed (column may be missing):', error.message)
      return NextResponse.json({ ok: true, warn: 'db_column_missing' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

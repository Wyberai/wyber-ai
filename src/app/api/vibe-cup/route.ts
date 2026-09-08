import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    name?: string; email?: string; app_name?: string
    demo_url?: string; project_url?: string; description?: string
  }

  const { name, email, app_name, demo_url, project_url, description } = body
  if (!name?.trim() || !email?.trim() || !app_name?.trim() || !demo_url?.trim() || !project_url?.trim()) {
    return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
  }
  if (!/^https?:\/\/.+/.test(demo_url.trim())) {
    return NextResponse.json({ error: 'Demo URL must start with http:// or https://' }, { status: 400 })
  }
  if (!/^https?:\/\/.+/.test(project_url.trim())) {
    return NextResponse.json({ error: 'Project URL must start with http:// or https://' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: existing } = await db
    .from('vibe_cup_entries')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This email has already been entered.' }, { status: 409 })
  }

  const { error } = await db.from('vibe_cup_entries').insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    app_name: app_name.trim(),
    demo_url: demo_url.trim(),
    project_url: project_url.trim(),
    description: description?.trim() || null,
    city: 'Worldwide',
  })

  if (error) {
    console.error('[vibe-cup] insert error:', error)
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

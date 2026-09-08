import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Other']

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    name?: string; email?: string; city?: string; project_url?: string; description?: string
  }

  const { name, email, city, project_url, description } = body
  if (!name?.trim() || !email?.trim() || !city || !project_url?.trim()) {
    return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
  }
  if (!CITIES.includes(city)) {
    return NextResponse.json({ error: 'Invalid city.' }, { status: 400 })
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
    city,
    project_url: project_url.trim(),
    description: description?.trim() || null,
  })

  if (error) {
    console.error('[vibe-cup] insert error:', error)
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

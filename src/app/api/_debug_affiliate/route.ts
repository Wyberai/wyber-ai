import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// TEMPORARY diagnostic route — deleted immediately after use tonight.
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'no user', userErr })

  const result = await supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ userId: user.id, email: user.email, data: result.data, error: result.error, status: result.status, statusText: result.statusText })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

// Direct admin client - works in all contexts
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    // Auth via cookie-based client
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const amount = body.amount ?? 1
    const reason = body.reason ?? 'generation'

    const admin = getAdmin()

    const { data: profile, error: fetchErr } = await admin
      .from('profiles')
      .select('credits, plan')
      .eq('id', user.id)
      .single()

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.credits < amount) {
      return NextResponse.json({ error: 'Insufficient credits', credits: profile.credits }, { status: 402 })
    }

    const newCredits = profile.credits - amount

    const { data: updated, error: updateErr } = await admin
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('credits')
      .single()

    if (updateErr || !updated) {
      return NextResponse.json({ error: 'Deduction failed' }, { status: 500 })
    }

    // Fire and forget usage log
    admin.from('credit_usage').insert({
      user_id: user.id,
      amount,
      reason,
      credits_before: profile.credits,
      credits_after: updated.credits,
    }).then(() => {}).catch(() => {})

    return NextResponse.json({ success: true, credits: updated.credits, deducted: amount })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = getAdmin()
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, plan')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ credits: profile?.credits ?? 0, plan: profile?.plan ?? 'free' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

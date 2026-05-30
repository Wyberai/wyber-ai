import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { amount = 1, reason = 'generation' } = await req.json()

    const admin = await createAdminClient()

    // Fetch current credits
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

    // Atomically deduct credits
    const { data: updated, error: updateErr } = await admin
      .from('profiles')
      .update({ credits: profile.credits - amount })
      .eq('id', user.id)
      .eq('credits', profile.credits) // optimistic lock — prevents double spend
      .select('credits')
      .single()

    if (updateErr || !updated) {
      return NextResponse.json({ error: 'Credit deduction failed — try again' }, { status: 500 })
    }

    // Log usage
    await admin.from('credit_usage').insert({
      user_id: user.id,
      amount,
      reason,
      credits_before: profile.credits,
      credits_after: updated.credits,
      created_at: new Date().toISOString(),
    }).then(() => {}) // fire and forget

    return NextResponse.json({
      success: true,
      credits: updated.credits,
      deducted: amount,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = await createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, plan')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      credits: profile?.credits ?? 0,
      plan: profile?.plan ?? 'free',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

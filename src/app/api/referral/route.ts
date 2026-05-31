import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - get user's referral code and stats
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = await createAdminClient()
    const { data: profile } = await admin.from('profiles')
      .select('referral_code, referral_count, referral_credits_earned')
      .eq('id', user.id).single()

    // Generate referral code if none exists
    if (!profile?.referral_code) {
      const code = user.id.slice(0, 8).toUpperCase()
      await admin.from('profiles')
        .update({ referral_code: code })
        .eq('id', user.id)
      return NextResponse.json({ code, count: 0, creditsEarned: 0 })
    }

    return NextResponse.json({
      code: profile.referral_code,
      count: profile.referral_count ?? 0,
      creditsEarned: profile.referral_credits_earned ?? 0,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST - redeem a referral code
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    const admin = await createAdminClient()

    // Find referrer
    const { data: referrer } = await admin.from('profiles')
      .select('id, credits, referral_count, referral_credits_earned')
      .eq('referral_code', code.toUpperCase()).single()

    if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    if (referrer.id === user.id) return NextResponse.json({ error: 'Cannot use your own code' }, { status: 400 })

    // Check not already redeemed
    const { data: me } = await admin.from('profiles')
      .select('referred_by, credits').eq('id', user.id).single()
    if (me?.referred_by) return NextResponse.json({ error: 'Already redeemed a referral code' }, { status: 400 })

    // Give 20 bonus credits to new user, 50 to referrer
    await admin.from('profiles').update({
      credits: (me?.credits ?? 0) + 20,
      referred_by: referrer.id,
    }).eq('id', user.id)

    await admin.from('profiles').update({
      credits: (referrer.credits ?? 0) + 50,
      referral_count: (referrer.referral_count ?? 0) + 1,
      referral_credits_earned: (referrer.referral_credits_earned ?? 0) + 50,
    }).eq('id', referrer.id)

    return NextResponse.json({ success: true, bonusCredits: 20 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

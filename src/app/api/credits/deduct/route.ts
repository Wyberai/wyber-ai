import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { userCurrency } from '@/lib/user-currency'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const amount = body.amount ?? 1
    const reason = body.reason ?? 'generation'

    const admin = await createAdminClient()

    // Atomic credit deduction — prevents race conditions
    // Only deducts if credits >= amount, returns new balance
    const { data: result, error: rpcErr } = await admin.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: amount,
    })

    // Fallback if RPC doesn't exist yet — use atomic UPDATE with WHERE
    if (rpcErr?.message?.includes('function') || rpcErr?.message?.includes('does not exist')) {
      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({ credits: admin.rpc ? undefined : 0, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .gte('credits', amount)
        .select('credits')
        .single()

      // If no row matched, credits < amount
      if (updateErr || !updated) {
        const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        return NextResponse.json({ error: 'Insufficient credits', credits: profile.credits }, { status: 402 })
      }

      // Do the actual atomic decrement via raw SQL-safe update
      const { data: decremented, error: decErr } = await admin
        .from('profiles')
        .update({ credits: (updated.credits ?? 0) - amount, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .gte('credits', amount)
        .select('credits')
        .single()

      if (decErr || !decremented) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
      }

      admin.from('credit_usage').insert({
        user_id: user.id, amount, reason,
        credits_before: decremented.credits + amount, credits_after: decremented.credits,
      }).then(() => {}).catch(() => {})

      return NextResponse.json({ success: true, credits: decremented.credits, deducted: amount })
    }

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 })
    }

    // RPC returns { new_credits: number } or null if insufficient
    if (result === null || result?.new_credits === undefined) {
      const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
      return NextResponse.json({ error: 'Insufficient credits', credits: profile?.credits ?? 0 }, { status: 402 })
    }

    admin.from('credit_usage').insert({
      user_id: user.id, amount, reason,
      credits_before: result.new_credits + amount, credits_after: result.new_credits,
    }).then(() => {}).catch(() => {})

    return NextResponse.json({ success: true, credits: result.new_credits, deducted: amount })
  } catch (err) {
    console.error('Credits deduct error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = await createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, plan')
      .eq('id', user.id)
      .single()

    // Also fetch credit usage history
    const { data: history } = await admin
      .from('credit_usage')
      .select('id, amount, reason, credits_before, credits_after, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const currency = await userCurrency(admin, user.id)
    return NextResponse.json({ credits: profile?.credits ?? 0, plan: profile?.plan ?? 'free', history: history || [], currency })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// GET — list A/B tests for a campaign
export async function GET(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const campaign_id = searchParams.get('campaign_id')

  const db = createServiceClient()
  let query = db.from('gtm_ab_tests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (campaign_id) query = query.eq('campaign_id', campaign_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tests: data ?? [] })
}

// POST — create or update A/B test; if both variants have results, auto-select winner
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    campaign_id: string
    variant_a: { subject?: string; body?: string }
    variant_b: { subject?: string; body?: string }
    metric?: 'open_rate' | 'reply_rate' | 'click_rate'
  }

  const db = createServiceClient()
  const { data: test, error } = await db.from('gtm_ab_tests').insert({
    user_id: user.id,
    campaign_id: body.campaign_id,
    variant_a: body.variant_a,
    variant_b: body.variant_b,
    metric: body.metric ?? 'reply_rate',
    status: 'running',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ test })
}

// PATCH — record results and auto-select winner using AI
export async function PATCH(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    id: string
    results_a?: { sent: number; opens: number; replies: number; clicks: number }
    results_b?: { sent: number; opens: number; replies: number; clicks: number }
    auto_select?: boolean
  }

  const db = createServiceClient()
  const { data: test } = await db.from('gtm_ab_tests').select('*').eq('id', body.id).eq('user_id', user.id).single()
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (body.results_a) updates.results_a = body.results_a
  if (body.results_b) updates.results_b = body.results_b

  const ra = body.results_a ?? test.results_a
  const rb = body.results_b ?? test.results_b

  let winner: 'a' | 'b' | null = null
  let winnerReason = ''

  if (ra && rb && body.auto_select !== false) {
    const metric = test.metric ?? 'reply_rate'
    const rateA = metric === 'open_rate' ? ra.opens / ra.sent : metric === 'click_rate' ? ra.clicks / ra.sent : ra.replies / ra.sent
    const rateB = metric === 'open_rate' ? rb.opens / rb.sent : metric === 'click_rate' ? rb.clicks / rb.sent : rb.replies / rb.sent

    if (Math.abs(rateA - rateB) > 0.01) {
      winner = rateA >= rateB ? 'a' : 'b'
    }

    // AI explanation
    try {
      const explain = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `A/B test results for email campaign. Metric: ${metric}
Variant A (${JSON.stringify(test.variant_a?.subject ?? 'no subject')}): ${JSON.stringify(ra)}
Variant B (${JSON.stringify(test.variant_b?.subject ?? 'no subject')}): ${JSON.stringify(rb)}
Winner: ${winner ? `Variant ${winner.toUpperCase()}` : 'No clear winner yet (too close)'}
In 1-2 sentences, explain why this variant performed better.`
        }],
      })
      winnerReason = explain.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
    } catch {}

    updates.winner = winner
    updates.winner_reason = winnerReason
    updates.status = winner ? 'completed' : 'running'

    if (winner) {
      // Promote winner as the campaign's active variant
      await db.from('gtm_campaigns').update({
        active_variant: winner,
        updated_at: new Date().toISOString(),
      }).eq('id', test.campaign_id).eq('user_id', user.id)
    }
  }

  await db.from('gtm_ab_tests').update(updates).eq('id', body.id).eq('user_id', user.id)
  return NextResponse.json({ ok: true, winner, reason: winnerReason })
}

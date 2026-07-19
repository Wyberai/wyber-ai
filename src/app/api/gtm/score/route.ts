import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Score all leads for a user against their ICP definition
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    icp?: { industry?: string; company_size?: string; title_keywords?: string[]; funding_stage?: string }
    lead_ids?: string[]
  }

  const db = createServiceClient()

  // Load leads (batch up to 50)
  let query = db.from('gtm_leads').select('*').eq('user_id', user.id).limit(50)
  if (body.lead_ids?.length) query = query.in('id', body.lead_ids)

  const { data: leads } = await query
  if (!leads?.length) return NextResponse.json({ scored: 0, results: [] })

  const icp = body.icp ?? {}

  const prompt = `You are a B2B lead scoring engine. Score each lead against the ICP criteria.

ICP (Ideal Customer Profile):
${JSON.stringify(icp, null, 2)}

Leads:
${JSON.stringify(leads.map(l => ({ id: l.id, email: l.email, company: l.company_name, title: l.title, enrichment: l.enrichment_data })), null, 2)}

Return a JSON array:
[{ "id": "uuid", "score": 0-100, "tier": "A|B|C|D", "reason": "one-sentence reason" }]

Score rubric:
- 80-100: Perfect ICP fit → Tier A
- 60-79: Good fit, minor gaps → Tier B
- 40-59: Partial fit → Tier C
- 0-39: Poor fit → Tier D`

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  let scores: Array<{ id: string; score: number; tier: string; reason: string }> = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) scores = JSON.parse(match[0])
  } catch {}

  // Persist scores
  for (const s of scores) {
    await db.from('gtm_leads').update({
      icp_fit_score: s.score,
      score_tier: s.tier,
      score_reason: s.reason,
      scored_at: new Date().toISOString(),
    }).eq('id', s.id).eq('user_id', user.id)
  }

  return NextResponse.json({ scored: scores.length, results: scores })
}

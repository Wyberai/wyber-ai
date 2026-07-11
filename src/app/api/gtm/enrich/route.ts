import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Waterfall enrichment: try each source in order, stop at first success
async function enrichWithAI(lead: Record<string, unknown>): Promise<Record<string, unknown>> {
  const prompt = `You are a B2B data enrichment engine. Given the following lead details, infer and fill in missing fields using your knowledge of the company and person.

Lead data: ${JSON.stringify(lead)}

Return a JSON object with these enriched fields (only include fields you're confident about, omit uncertain ones):
{
  "company_size": "1-10|11-50|51-200|201-1000|1001-5000|5000+",
  "company_industry": "SaaS|Fintech|Healthcare|E-commerce|Agency|Manufacturing|...",
  "company_funding_stage": "Bootstrapped|Pre-seed|Seed|Series A|Series B|Series C+|Public",
  "company_tech_stack": ["React", "AWS", "Stripe"],
  "company_description": "one-sentence description",
  "estimated_revenue": "$1M-$10M",
  "job_seniority": "C-Level|VP|Director|Manager|IC",
  "department": "Engineering|Marketing|Sales|Product|Finance|Operations",
  "linkedin_connections": 500,
  "buying_signals": ["recently hired 10 engineers", "raised Series A"],
  "icp_score_reason": "why this lead fits ICP",
  "enriched_at": "${new Date().toISOString()}"
}`

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return {}
}

function calculateIcpScore(enriched: Record<string, unknown>, lead: Record<string, unknown>): number {
  let score = 50
  const size = (enriched.company_size as string) ?? ''
  if (['51-200', '201-1000'].includes(size)) score += 20
  else if (['11-50', '1001-5000'].includes(size)) score += 10
  const seniority = (enriched.job_seniority as string) ?? ''
  if (['C-Level', 'VP'].includes(seniority)) score += 20
  else if (['Director', 'Manager'].includes(seniority)) score += 10
  const signals = (enriched.buying_signals as string[]) ?? []
  score += Math.min(signals.length * 5, 15)
  if (lead.email && !(lead.email as string).includes('gmail') && !(lead.email as string).includes('hotmail')) score += 5
  return Math.min(Math.max(score, 0), 100)
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { lead_ids?: string[]; lead_id?: string }
  const ids = body.lead_ids ?? (body.lead_id ? [body.lead_id] : [])
  if (!ids.length) return NextResponse.json({ error: 'lead_ids required' }, { status: 400 })

  const db = createServiceClient()
  const { data: leads } = await db
    .from('gtm_leads')
    .select('*')
    .in('id', ids)
    .eq('user_id', user.id)

  if (!leads?.length) return NextResponse.json({ error: 'No leads found' }, { status: 404 })

  const results: Array<{ id: string; enriched: boolean; icp_score: number }> = []

  for (const lead of leads) {
    try {
      const enriched = await enrichWithAI(lead as Record<string, unknown>)
      const icp_score = calculateIcpScore(enriched, lead as Record<string, unknown>)

      await db.from('gtm_leads').update({
        enrichment_data: enriched,
        icp_fit_score: icp_score,
        status: lead.status === 'new' ? 'enriched' : lead.status,
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id).eq('user_id', user.id)

      results.push({ id: lead.id, enriched: true, icp_score })
    } catch {
      results.push({ id: lead.id, enriched: false, icp_score: lead.icp_fit_score ?? 0 })
    }
  }

  return NextResponse.json({ results, enriched_count: results.filter(r => r.enriched).length })
}

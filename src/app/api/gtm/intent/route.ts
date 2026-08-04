import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Intent signal detection via job postings (public signal for buying intent)
// Uses Jina.ai reader to fetch job pages, then AI to extract signals
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    companies?: string[]  // company names to check
    lead_ids?: string[]   // or derive from lead data
    intent_keywords?: string[]  // e.g. ["Head of Sales", "Revenue Operations", "CRM Admin"]
  }

  const db = createServiceClient()

  let companies: Array<{ name: string; domain?: string; leadId?: string }> = []

  if (body.companies?.length) {
    companies = body.companies.map(name => ({ name }))
  } else if (body.lead_ids?.length) {
    const { data: leads } = await db.from('gtm_leads').select('id, company_name, company_website').in('id', body.lead_ids).eq('user_id', user.id)
    companies = (leads ?? []).map(l => ({ name: l.company_name, domain: l.company_website, leadId: l.id }))
  }

  if (!companies.length) return NextResponse.json({ error: 'companies or lead_ids required' }, { status: 400 })

  const keywords = body.intent_keywords ?? ['Head of Sales', 'VP Sales', 'Revenue Operations', 'CRM', 'Sales Enablement', 'Account Executive']
  const results: Array<{ company: string; signals: string[]; intent_score: number; lead_id?: string }> = []

  for (const co of companies.slice(0, 10)) {  // cap at 10 to avoid timeout
    try {
      // Fetch job postings via Jina reader (free, no API key)
      const searchUrl = `https://r.jina.ai/https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(co.name + ' ' + keywords[0])}&f_TPR=r604800`
      const jRes = await fetch(searchUrl, { headers: { 'Accept': 'text/plain' }, signal: AbortSignal.timeout(8000) })
      const jobText = jRes.ok ? (await jRes.text()).slice(0, 3000) : ''

      const prompt = `Analyse these job postings for company "${co.name}". Identify buying signals that suggest they need tools or services related to: ${keywords.join(', ')}.

Job postings text:
${jobText || '(no data found)'}

Return JSON: { "signals": ["signal 1", "signal 2"], "intent_score": 0-100, "reasoning": "..." }
- signals: specific hiring patterns indicating buying intent
- intent_score: 0 (no signal) to 100 (very strong intent)
- Keep signals to max 3, be specific (e.g. "Hiring 5 AEs suggests rapid sales team expansion")`

      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = aiRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
      const match = text.match(/\{[\s\S]*\}/)
      const parsed = match ? JSON.parse(match[0]) : { signals: [], intent_score: 0 }

      results.push({ company: co.name, signals: parsed.signals ?? [], intent_score: parsed.intent_score ?? 0, lead_id: co.leadId })

      // Update lead intent score if we have a leadId
      if (co.leadId && parsed.intent_score > 0) {
        await db.from('gtm_leads').update({
          intent_score: parsed.intent_score,
          intent_signals: parsed.signals,
          intent_detected_at: new Date().toISOString(),
        }).eq('id', co.leadId).eq('user_id', user.id)
      }
    } catch {
      results.push({ company: co.name, signals: [], intent_score: 0, lead_id: co.leadId })
    }
  }

  const high_intent = results.filter(r => r.intent_score >= 60)
  return NextResponse.json({ results, high_intent_count: high_intent.length, high_intent })
}

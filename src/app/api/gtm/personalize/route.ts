import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// AI personalization at scale
// Fetches LinkedIn profile + company news via Jina, then generates hyper-personalized email/message

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    lead_ids?: string[]
    leads?: Array<{ first_name: string; last_name: string; company_name: string; title?: string; linkedin_url?: string; email?: string }>
    template: string
    sender_name?: string
    value_prop?: string
  }

  if (!body.template) return NextResponse.json({ error: 'template required' }, { status: 400 })

  const db = createServiceClient()
  let leads = body.leads ?? []

  if (body.lead_ids?.length) {
    const { data } = await db.from('gtm_leads')
      .select('id, first_name, last_name, company_name, title, linkedin_url, email')
      .in('id', body.lead_ids)
      .eq('user_id', user.id)
    leads = (data ?? []) as typeof leads
  }

  if (!leads.length) return NextResponse.json({ error: 'No leads provided' }, { status: 400 })

  const results: Array<{ lead_name: string; email?: string; personalized_subject: string; personalized_body: string; signals_used: string[] }> = []

  for (const lead of leads.slice(0, 20)) {
    const signals: string[] = []
    let context = ''

    // Fetch LinkedIn profile via Jina reader
    if (lead.linkedin_url) {
      try {
        const liRes = await fetch(`https://r.jina.ai/${lead.linkedin_url}`, {
          headers: { Accept: 'text/plain' },
          signal: AbortSignal.timeout(8000),
        })
        if (liRes.ok) {
          const liText = (await liRes.text()).slice(0, 2000)
          context += `\nLinkedIn profile:\n${liText}\n`
          signals.push('LinkedIn profile')
        }
      } catch { /* skip */ }
    }

    // Fetch company news via Jina search
    if (lead.company_name) {
      try {
        const newsRes = await fetch(`https://s.jina.ai/${encodeURIComponent(lead.company_name + ' news 2026')}`, {
          headers: { Accept: 'text/plain' },
          signal: AbortSignal.timeout(8000),
        })
        if (newsRes.ok) {
          const newsText = (await newsRes.text()).slice(0, 1500)
          context += `\nRecent company news:\n${newsText}\n`
          signals.push('company news')
        }
      } catch { /* skip */ }
    }

    const prompt = `Personalize this email template for a specific prospect. Use the signals below to make the email feel 1:1, not mass-sent.

PROSPECT:
Name: ${lead.first_name} ${lead.last_name}
Title: ${lead.title ?? 'unknown'}
Company: ${lead.company_name}
${context}

TEMPLATE TO PERSONALIZE:
${body.template}

SENDER: ${body.sender_name ?? 'the team'}
VALUE PROP: ${body.value_prop ?? 'our product'}

Rules:
- Replace {{first_name}} with "${lead.first_name}"
- Reference at least one specific thing from their LinkedIn or company news
- Keep it under 120 words
- Sound human, not salesy
- Return JSON: { "subject": "...", "body": "...", "opening_hook": "the specific signal you referenced" }`

    try {
      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = aiRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
      const match = text.match(/\{[\s\S]*\}/)
      const parsed = match ? JSON.parse(match[0]) : { subject: '', body: '' }

      results.push({
        lead_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        personalized_subject: parsed.subject ?? '',
        personalized_body: parsed.body ?? '',
        signals_used: signals,
      })
    } catch {
      results.push({
        lead_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        personalized_subject: '',
        personalized_body: body.template.replace(/\{\{first_name\}\}/g, lead.first_name),
        signals_used: [],
      })
    }
  }

  return NextResponse.json({ personalized: results, count: results.length })
}

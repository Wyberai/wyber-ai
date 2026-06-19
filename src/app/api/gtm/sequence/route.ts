import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, step_label, profile } = await req.json()

  if (type === 'email') {
    const icpContext = profile
      ? `Company: ${profile.company_name || 'unknown'}. ICP: ${profile.icp_seniorities?.join(', ')} at ${profile.icp_industries?.join(', ')} companies (${profile.icp_company_sizes?.join(', ')} employees). Value prop: ${profile.value_proposition || ''}.`
      : `Step: ${step_label}`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Write a short cold outreach email for this context: ${icpContext}. Return JSON with fields: subject (string, under 60 chars), body (string, 3 short paragraphs, under 150 words, uses {{first_name}} placeholder). Return only valid JSON.`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] || '{}')
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ subject: 'Quick question, {{first_name}}', body: 'Hi {{first_name}},\n\nI noticed you work at {{company}} and wanted to reach out.\n\nWould love to share how we help similar companies. Worth a quick chat?' })
    }
  }

  if (type === 'call') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a cold call opening script for ${step_label}. 3-4 sentences. Start with a permission-based opener. Include a clear value hook. End with a qualifying question. Return JSON: { script: string }. Only valid JSON.`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] || '{}')
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ script: "Hi {{first_name}}, this is [your name] — caught you at a bad time? Great, I'll be quick. We help [ICP] companies [value prop] in under 30 days. Are you the right person to talk to about [pain point]?" })
    }
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

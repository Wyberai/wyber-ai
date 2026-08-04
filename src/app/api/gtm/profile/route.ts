import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('gtm_profiles').select('*').eq('user_id', user.id).single()
  return NextResponse.json({ profile: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // AI scrape mode
  if (body.action === 'scrape') {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyse this company URL and extract GTM profile data: ${body.url}

Return ONLY valid JSON with these fields (no markdown, no explanation):
{
  "company_name": "...",
  "company_description": "2-3 sentence description of what they do",
  "value_proposition": "1 sentence value prop",
  "differentiation": "what makes them different",
  "icp_industries": ["industry1", "industry2"],
  "icp_company_sizes": ["11-50", "51-200"],
  "icp_seniorities": ["VP", "Director"],
  "icp_pain_points": ["pain1", "pain2", "pain3"]
}`
        }]
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      const profile = JSON.parse(text)
      return NextResponse.json({ profile })
    } catch (e) {
      return NextResponse.json({ profile: {} })
    }
  }

  // Save mode
  const { action, ...profileData } = body
  const { error } = await supabase.from('gtm_profiles').upsert({
    user_id: user.id,
    ...profileData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

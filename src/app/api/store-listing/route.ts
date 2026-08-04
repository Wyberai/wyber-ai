import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectName, description, codeSnippet } = await req.json() as {
      projectName: string
      description?: string
      codeSnippet?: string
    }

    const prompt = `You are an App Store optimization expert. Generate a complete app store listing for a mobile app.

App name: ${projectName}
${description ? `Description from developer: ${description}` : ''}
${codeSnippet ? `Key features from code:\n${codeSnippet.slice(0, 1200)}` : ''}

Return ONLY valid JSON with exactly this shape (no prose, no markdown fences):
{
  "title": "App name, max 30 chars",
  "subtitle": "Short value prop, max 30 chars",
  "description": "Full description 200-300 words, highlight 5 key features",
  "keywords": ["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7","keyword8","keyword9","keyword10"],
  "category": "One of: Productivity, Business, Utilities, Finance, Health & Fitness, Social Networking, Education, Entertainment, Lifestyle, Shopping",
  "privacyPolicyUrl": "https://yourapp.com/privacy",
  "supportUrl": "https://yourapp.com/support",
  "whatIsNew": "First release. Fresh off the build. 🚀",
  "easConfig": {
    "cli": { "version": ">= 7.0.0" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal" },
      "preview": { "distribution": "internal" },
      "production": {}
    },
    "submit": {
      "production": {}
    }
  }
}`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { text: string }).text.trim()
    // Strip markdown fences if model added them
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
    const listing = JSON.parse(clean)

    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

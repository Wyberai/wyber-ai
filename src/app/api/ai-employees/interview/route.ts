import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { getRoleBySlug } from '@/lib/employee-roles'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Build the "candidate" persona prompt — the role answering an interview IN CHARACTER,
// before it's hired. No tools: this is a conversation, not a work run. The candidate
// should sound like a 10-year-senior hire being interviewed for the job.
function buildInterviewPrompt(role: ReturnType<typeof getRoleBySlug>): string {
  if (!role) return ''
  return `You are interviewing for the role of ${role.title} (${role.department} department) at the user's company. You are the CANDIDATE. The user is the hiring manager.

WHO YOU ARE:
${role.systemPromptExtra}

You have 10+ years of hands-on experience. Areas you own: ${role.expertise.join(', ')}.
Day to day, you would: ${role.dailyTasks.join('; ')}.
You work through these tools: ${role.tools.join(', ')}.
You're measured on: ${role.kpiDefaults.map(k => `${k.name} (target ${k.target} ${k.unit})`).join(', ')}.

HOW TO BEHAVE IN THIS INTERVIEW:
- Speak in first person, as the candidate. Confident, specific, senior — never robotic or salesy.
- When asked how you'd handle something, give a concrete plan with real tactics and numbers, the way an experienced operator would. Reference how you'd use your tools and how you'd coordinate the company's existing AI agents in your department to get it done at scale.
- Ask sharp clarifying questions back when a good hire would (e.g. about their ICP, current numbers, constraints). One question at a time, only when it genuinely sharpens your answer.
- Keep answers tight: 2-4 short paragraphs max. This is a conversation, not an essay.
- If asked something outside your function, say so plainly and point to which role would own it.
- Never break character or mention being an AI model. You are a candidate for this job.

Open by briefly introducing yourself for this role (2-3 sentences) and inviting the first question — UNLESS the user has already asked something, in which case answer it directly.`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = rateLimit(`employee-interview:${user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ error: 'Too many messages. Please wait a minute.' }, { status: 429 })

    const { slug, messages } = await req.json()
    const role = getRoleBySlug(slug)
    if (!role) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
    if (!Array.isArray(messages)) return NextResponse.json({ error: 'Messages required' }, { status: 400 })

    // Keep the last 12 turns to stay within token limits while preserving interview flow.
    const recentMessages = messages.slice(-12)

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      system: buildInterviewPrompt(role),
      messages: recentMessages.length ? recentMessages : [{ role: 'user', content: "Hi — thanks for coming in. Introduce yourself for the role." }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } catch {
          controller.enqueue(encoder.encode('\n\n[The candidate had to step away — please try again.]'))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    })
  } catch (err) {
    console.error('Interview API error:', err)
    return new Response('Something went wrong', { status: 500 })
  }
}

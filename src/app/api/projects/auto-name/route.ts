import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

/**
 * Name a project from its creation prompt, at creation time.
 *
 * This replaces the old approach of renaming inside the generate route's
 * after() hook, which was chained to first-build detection (isNewBuild) — a
 * flag that flips permanently the moment ANY files land in the DB (scaffold
 * saves, partial builds), so in practice the rename frequently never fired
 * and projects kept the raw 40-char prompt slice as their name. Naming here
 * depends on nothing but the prompt itself.
 *
 * Only renames while the current name is still auto-generated (the prompt
 * slice or the "New Project HH:MM" default) — a manual rename always wins.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, prompt } = await req.json()
    const promptStr = String(prompt ?? '').trim()
    if (!projectId || !promptStr) {
      return NextResponse.json({ error: 'projectId and prompt required' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, initial_prompt')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const autoNames = [
      promptStr.slice(0, 40).trim(),
      String(project.initial_prompt ?? '').slice(0, 40).trim(),
    ].filter(Boolean)
    const stillAuto = autoNames.includes(project.name) || /^New Project /.test(project.name ?? '')
    if (!stillAuto) return NextResponse.json({ name: project.name, skipped: true })

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system: `Name an app based on what the user asked to build. 2-4 words, title case, no quotes, no punctuation, not the word "app" unless it's part of a proper name. Output ONLY the name, nothing else.`,
      messages: [{ role: 'user', content: promptStr.slice(0, 500) }],
    })
    const name = res.content
      .filter(b => b.type === 'text')
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
      .slice(0, 60)
    if (!name) return NextResponse.json({ name: project.name })

    await supabase.from('projects').update({ name }).eq('id', projectId).eq('user_id', user.id)
    return NextResponse.json({ name })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

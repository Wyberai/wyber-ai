import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

// Clients map category -> their own icon/emoji; the model never picks icons.
const CATEGORIES = ['commerce', 'booking', 'portfolio', 'productivity', 'social', 'content', 'food', 'events'] as const
type Category = (typeof CATEGORIES)[number]

export interface Suggestion {
  title: string
  prompt: string
  category: Category
}

// Served whenever generation isn't possible (no auth context failure — those
// still 401 — but missing key, model error, bad JSON, missing table, etc.).
// Mirrors the mobile STARTERS / dashboard QUICK_PROMPTS so the UI never blanks.
const FALLBACK: Suggestion[] = [
  { title: 'Booking site', prompt: 'A booking website for my salon with services, prices, and an appointment form', category: 'booking' },
  { title: 'Portfolio', prompt: 'A personal portfolio with my projects, an about section, and a contact form', category: 'portfolio' },
  { title: 'Online store', prompt: 'An online store for handmade candles with a product grid, cart, and checkout form', category: 'commerce' },
  { title: 'Habit tracker', prompt: 'A habit tracker with daily streaks, progress charts, and reminders', category: 'productivity' },
  { title: 'Restaurant', prompt: 'A restaurant website with the menu, photos, opening hours, and a reservation form', category: 'food' },
  { title: 'Event page', prompt: 'An event landing page with schedule, speakers, and an RSVP form', category: 'events' },
]

function validate(raw: unknown): Suggestion[] | null {
  if (!Array.isArray(raw)) return null
  const out: Suggestion[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { title, prompt, category } = item as Record<string, unknown>
    if (typeof title !== 'string' || typeof prompt !== 'string') continue
    if (!title.trim() || !prompt.trim()) continue
    out.push({
      title: title.trim().slice(0, 40),
      prompt: prompt.trim().slice(0, 200),
      category: CATEGORIES.includes(category as Category) ? (category as Category) : 'productivity',
    })
  }
  return out.length >= 4 ? out.slice(0, 6) : null
}

// "Today's ideas": 6 personalized app ideas per user per day, generated once
// by Haiku and cached in daily_suggestions. Fail-soft by design — any failure
// returns the static fallback with 200 so home screens never break on this.
export async function GET() {
  let userId: string
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const day = new Date().toISOString().slice(0, 10)
  const db = createServiceClient()

  try {
    const { data: cached } = await db
      .from('daily_suggestions')
      .select('suggestions')
      .eq('user_id', userId)
      .eq('day', day)
      .maybeSingle()
    const hit = validate(cached?.suggestions)
    if (hit) return NextResponse.json({ suggestions: hit, generated: true })
  } catch { /* table missing pre-migration — fall through to generate/fallback */ }

  try {
    const { data: projects } = await db
      .from('projects')
      .select('name, project_type, initial_prompt')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    const seed = (projects ?? [])
      .map(p => `- ${String(p.name ?? '').slice(0, 60)} (${p.project_type ?? 'web'}): ${String(p.initial_prompt ?? '').slice(0, 120)}`)
      .join('\n')
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: `You suggest app ideas a user could build today with an AI app builder. Return ONLY a JSON array of exactly 6 objects: {"title": "2-3 words", "prompt": "one concrete build instruction under 25 words", "category": one of ${JSON.stringify(CATEGORIES)}}. Ideas must be buildable as a small web or mobile app (forms, lists, dashboards, booking, stores — no hardware, no crypto). Vary the categories. If past projects are given, make 2-3 ideas feel like natural next apps for that person; the rest fresh. No markdown, no prose, JSON array only.`,
      messages: [{
        role: 'user',
        content: seed
          ? `It's ${weekday}. My past projects:\n${seed}`
          : `It's ${weekday}. I'm brand new — suggest a fun, varied starter set.`,
      }],
    })

    const text = res.content
      .filter(b => b.type === 'text')
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    const suggestions = start >= 0 && end > start ? validate(JSON.parse(text.slice(start, end + 1))) : null
    if (!suggestions) throw new Error('bad model output')

    try {
      await db.from('daily_suggestions').upsert({ user_id: userId, day, suggestions })
    } catch { /* cache write is best-effort */ }

    return NextResponse.json({ suggestions, generated: true })
  } catch {
    return NextResponse.json({ suggestions: FALLBACK, fallback: true })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { CHEAP_MODEL, CHEAP_THINKING } from '@/lib/models'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

/**
 * Launch Kit: ready-to-post copy about the USER'S app (not about WyberAi) for
 * WhatsApp, LinkedIn, X, Instagram and Product Hunt, written from what the
 * app actually is. Opened from the Publish & Share modal (LaunchKit.tsx).
 *
 * One CHEAP_MODEL call (well under a cent), no credits — it exists to get
 * published apps shared. Free-plan owners get a short "Built with WyberAi"
 * credit appended in code (same rule as the published-page badge); paid
 * owners get clean copy.
 */

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['whatsapp', 'linkedin', 'x', 'instagram', 'productHuntTagline', 'productHuntDescription'],
  properties: {
    whatsapp: { type: 'string' },
    linkedin: { type: 'string' },
    x: { type: 'string' },
    instagram: { type: 'string' },
    productHuntTagline: { type: 'string' },
    productHuntDescription: { type: 'string' },
  },
} as const

const SYSTEM = `You write launch posts for a small app someone just built and published. The person posting is the maker.

Write about THIS app: what it does, who it is for, and one concrete thing it lets them do. Use the details given; never invent features, prices, numbers, users or testimonials. Never invent a personal story or experience for the maker ("I kept failing interviews…") — describe the problem in general terms instead.

Voice: plain, specific, human. Short sentences. Sound like a person sharing something they made, not an ad.
Never use: "revolutionary", "game-changer", "game changing", "seamless", "unlock", "elevate", "supercharge", "cutting-edge", "next-level", "in today's fast-paced world", "say goodbye to", "look no further", "excited to announce", "thrilled".
At most one emoji per post, and none in LinkedIn or Product Hunt.
Put the link exactly where the placeholder {LINK} appears — write {LINK} literally, once per post (not in the Product Hunt fields).

Formats:
- whatsapp: 2-3 short lines for sending to friends or customers, ending with {LINK}.
- linkedin: 60-120 words in 2-3 short paragraphs. Open with the problem it solves, then what it does, then {LINK} and a one-line ask for feedback.
- x: under 230 characters including {LINK}. No hashtags.
- instagram: a 2-4 line caption ending with {LINK} (never say "link in bio"). Then a blank line and 4-6 relevant lowercase hashtags.
- productHuntTagline: under 60 characters, says what it is, no period.
- productHuntDescription: under 260 characters, what it does and who it's for.`

// Product Hunt rejects longer fields; the model sometimes runs over.
// Cuts at the last full sentence, else before a ":" / " — " clause, else at a
// word boundary — never mid-phrase if it can help it.
function fit(s: string, n: number): string {
  const t = s.replace(/\{LINK\}/g, '').replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  const cut = t.slice(0, n + 1)
  const sentence = cut.lastIndexOf('. ')
  if (sentence > n * 0.5) return cut.slice(0, sentence + 1)
  const clause = Math.max(cut.lastIndexOf(': '), cut.lastIndexOf(' — '))
  if (clause > n * 0.35) return cut.slice(0, clause).trim()
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;—–-]+$/, '')
}

function credit(text: string, channel: 'linkedin' | 'x'): string {
  return channel === 'x' ? `${text} #BuiltOnWyber` : `${text}\n\nBuilt with WyberAi`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = rateLimit(`launch-kit:${user.id}`, 10, 60 * 60 * 1000)
  if (!allowed) return NextResponse.json({ error: 'You can write new launch posts again in a little while.' }, { status: 429 })

  const { projectId } = await req.json().catch(() => ({}))
  if (!projectId || typeof projectId !== 'string') return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, initial_prompt, first_prompt, subdomain, is_public, user_id, custom_domain, custom_domain_verified')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!project.is_public || !project.subdomain) return NextResponse.json({ error: 'Publish your app first.' }, { status: 400 })

  const url = project.custom_domain && project.custom_domain_verified
    ? `https://${project.custom_domain}`
    : `https://wyberai.com/app/${project.subdomain}`

  // The published page's own title/description are the best summary of what
  // the app is; the original prompt fills in who it's for.
  const admin = await createServiceClient()
  let pageTitle = '', pageDesc = ''
  try {
    const { data: file } = await admin.storage.from('published-apps').download(`${project.id}/index.html`)
    if (file) {
      const html = await file.text()
      pageTitle = html.match(/<title>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? ''
      pageDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i)?.[1]?.trim() ?? ''
    }
  } catch { /* fall back to project fields */ }

  let ownerPlan = 'free'
  try {
    const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).single()
    if (profile?.plan) ownerPlan = String(profile.plan)
  } catch { /* free */ }

  const brief = [
    `App name: ${project.name}`,
    pageTitle && `Page title: ${pageTitle}`,
    (pageDesc || project.description) && `Description: ${pageDesc || project.description}`,
    `What the maker asked for when building it: ${String(project.initial_prompt || project.first_prompt || '').slice(0, 1500)}`,
  ].filter(Boolean).join('\n')

  try {
    const res = await client.messages.create({
      model: CHEAP_MODEL,
      thinking: CHEAP_THINKING,
      max_tokens: 1500,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: brief }],
    })
    const text = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text
    if (!text) throw new Error('empty')
    const raw = JSON.parse(text) as Record<keyof typeof SCHEMA.properties, string>
    const link = (s: string) => (s.includes('{LINK}') ? s.split('{LINK}').join(url) : `${s.trim()}\n${url}`)
    const free = ownerPlan === 'free'
    return NextResponse.json({
      url,
      posts: {
        whatsapp: link(raw.whatsapp),
        linkedin: free ? credit(link(raw.linkedin), 'linkedin') : link(raw.linkedin),
        x: free ? credit(link(raw.x), 'x') : link(raw.x),
        instagram: link(raw.instagram),
      },
      productHunt: {
        tagline: fit(raw.productHuntTagline, 60).replace(/\.$/, ''),
        description: fit(raw.productHuntDescription, 260),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not write your launch posts right now — try again in a moment.' }, { status: 502 })
  }
}

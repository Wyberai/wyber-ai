import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

const anthropic = new Anthropic()

const PRICING = `
WyberAi credit costs (August 2026):
- Web or mobile app build from scratch: 75 credits
- Plan Mode (architecture): 13 credits
- Edit / iteration: 2 credits
- Complex edit (new feature module): 5 credits

Monthly plans (annual billing):
- Spark ₹399/mo → 50 cr/mo → ₹10/cr
- Starter ₹1,199/mo → 150 cr/mo → ₹10/cr
- Builder ₹3,199/mo → 500 cr/mo → ₹8/cr

One-time packs: 200cr ₹399 | 600cr ₹999 | 2,000cr ₹1,999

Done-For-You (50% off through Aug 15 2026):
- Simple $199 → $99 now (₹8,300) — no auth/db, landing page / tool
- Medium $399 → $199 now (₹16,700) — SaaS with auth + database, 3-6 screens
- Complex $799 → $399 now (₹33,500) — payments + integrations, 6+ screens, external APIs

USD/INR: ₹84
`

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: m, error } = await admin
    .from('consultation_meetings')
    .select('attendee_name, attendee_email, scheduled_start, intake_answers, notes')
    .eq('id', id)
    .single()

  if (error || !m) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const intakeText = m.intake_answers
    ? Object.entries(m.intake_answers as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : 'None provided'

  const slot = new Date(m.scheduled_start).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  })

  const prompt = `You are writing a pre-call brief for Sumeet Sutar, founder of WyberAi (wyberai.com — AI app builder for web + mobile). He has a 15-minute paid consultation scoping call.

PROSPECT: ${m.attendee_name || 'Unknown'} (${m.attendee_email})
SLOT: ${slot} IST
WHAT THEY SAID:
${intakeText}

WYBERAI PRICING:
${PRICING}

CONTEXT: August 2026. AI app builders (Lovable, Bolt, v0, Replit, WyberAi) are mainstream. Indian founders are budget-aware but time-starved. The market has matured — most verticals (dating, edtech, ecommerce, try-on, messaging) have established players. A new entrant needs a specific wedge, not just "build an app."

Write a JSON brief with EXACTLY this shape (no markdown, no explanation, just raw JSON):

{
  "summary": "2-3 sentences — what they want to build, one key observation about market reality or their specific angle",
  "questions": [
    "5-7 sharp questions for the call. Not generic. Each question should probe one real risk or unknown: differentiation, go-to-market, technical constraints, budget, or August 2026 market context (e.g. post-BYJU collapse for edtech, A2P regulations for SMS, try-on API maturity for fashion). Questions should be direct enough that a vague answer tells Sumeet the prospect hasn't thought it through."
  ],
  "direction": "2-3 sentences on how to steer the call — what Sumeet should establish early, what the real conversation should be about, and what signal to look for that determines whether to quote or not",
  "self_serve": {
    "credits": <realistic total credits: build + plan mode + estimated iterations>,
    "credit_cost_inr": <credits × 10>,
    "plan": "<Starter|Builder>",
    "plan_cost_inr": <monthly plan cost>,
    "months_to_build": <realistic months for non-technical Indian founder>,
    "total_practical_inr": <credit cost + plan × months>,
    "hard_part": "One sentence on what's genuinely hard to self-serve for this specific project"
  },
  "dfy": {
    "tier": "<Simple|Medium|Complex>",
    "price_inr_full": <full price in INR>,
    "price_inr_now": <50% off price in INR>,
    "timeline": "<24 hours|3 working days|1 week>",
    "includes": "What's delivered",
    "external_costs": "<any ongoing external service costs they pay separately, or null>"
  },
  "concerns": ["2-3 real risks — market, execution, regulatory, cold-start, monetisation"],
  "opportunities": ["1-2 angles — WearOn beta if relevant, AI add-on, mobile tier, referral"],
  "close_angle": "One sentence on the single strongest reason this person should say yes on this call"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  let brief: Record<string, unknown>
  try {
    const jsonStr = raw.startsWith('{') ? raw : (raw.match(/\{[\s\S]*\}/) ?? [''])[0]
    brief = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw }, { status: 500 })
  }

  brief.generated_at = new Date().toISOString()

  await admin
    .from('consultation_meetings')
    .update({ ai_brief: brief, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, brief })
}

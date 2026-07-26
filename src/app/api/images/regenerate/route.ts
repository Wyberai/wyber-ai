import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAndPersistImage } from '@/lib/generate-image-persist'
import { ratioToSize } from '@/lib/image-directives'
import { rateLimit } from '@/lib/rate-limit'
import { creditCost } from '@/lib/credits'

// Regenerate one image for the Images panel: fresh nonce variant + force so
// the idempotent cache can never hand back the old picture. Returns a NEW
// permanent URL; the client swaps it into the project source (pin semantics),
// so preview and publish both ship it with no further generation.
export const maxDuration = 120

// BILLING (pending Sumeet's sign-off — flagged in the Session C PR): each
// regenerate is a real OpenAI call (~$0.04–0.06 COGS), charged at 1 credit.
// Uploads are free (no model call). Set to 0 to make regens free.
const REGEN_CREDIT_COST = 1
// Hero-quality path (quality: 'high' — real COGS ~$0.19/image on gpt-image-2)
// prices from the shared table in credits.ts, not a local constant, so it
// stays the one place that pricing decision lives.
const HERO_CREDIT_COST = creditCost('hero-image-gen')

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(`img-regen:${user.id}`, 15, 10 * 60 * 1000)
    if (!limited.allowed) return NextResponse.json({ error: 'Too many regenerations — try again in a few minutes.' }, { status: 429 })

    const { projectId, prompt, ratio, transparent, quality } = await req.json()
    if (!projectId || !prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'projectId and prompt are required' }, { status: 400 })
    }
    const isHero = quality === 'high'
    const cost = isHero ? HERO_CREDIT_COST : REGEN_CREDIT_COST
    // Ownership: RLS-scoped read — someone else's projectId returns nothing.
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Image generation is not configured' }, { status: 503 })

    const admin = createServiceClient()

    // Balance gate up front so we never burn an OpenAI call we can't charge.
    if (cost > 0) {
      const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
      if ((profile?.credits ?? 0) < cost) {
        return NextResponse.json({ error: `Not enough credits — this needs ${cost}.` }, { status: 402 })
      }
    }

    const nonce = Math.random().toString(36).slice(2, 10)
    const { url } = await generateAndPersistImage(admin, prompt.slice(0, 800), ratioToSize(ratio), projectId, {
      force: true,
      variant: nonce,
      transparent: !!transparent,
      quality: isHero ? 'high' : 'medium',
    })
    if (!url) return NextResponse.json({ error: 'Image generation failed — you were not charged. Try again.' }, { status: 502 })

    // Charge only after a successful generation (atomic RPC; failure to charge
    // is logged but never voids the image the user is already looking at).
    let credits: number | null = null
    if (cost > 0) {
      try {
        const { data: result } = await admin.rpc('deduct_credits', { p_user_id: user.id, p_amount: cost })
        credits = result?.new_credits ?? null
        admin.from('credit_usage').insert({
          user_id: user.id, amount: cost, reason: isHero ? 'hero-image-gen' : 'image-regenerate',
          credits_before: credits !== null ? credits + cost : null, credits_after: credits,
        }).then(() => {}).catch(() => {})
      } catch (e) {
        console.error('[img-regen] charge failed (image already delivered):', e)
      }
    }

    return NextResponse.json({ url, creditsCharged: cost, credits })
  } catch (err) {
    console.error('[img-regen] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

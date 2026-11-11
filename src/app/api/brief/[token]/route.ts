import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { QUESTIONS, validateBrief } from '@/lib/agency/brief'
import { sendClientEventAlert } from '@/lib/email'
import { requestIp } from '@/lib/agency/portal'

// The public intake form. The token in the link is the only access; a lead or paused client can still send their
// brief (that is the point of sending it early), an archived one cannot.
async function clientForToken(token: string) {
  if (!token || token.length < 10 || token.length > 80) return null
  const admin = await createAdminClient()
  const { data } = await admin.from('clients').select('id, owner_id, name, logo_url, brand_color, status, brief').eq('brief_token', token).maybeSingle()
  if (!data || data.status === 'archived') return null
  return { admin, client: data as { id: string; owner_id: string; name: string; logo_url: string | null; brand_color: string; status: string; brief: Record<string, string> | null } }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const found = await clientForToken(token)
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { client } = found
  return NextResponse.json({ name: client.name, logoUrl: client.logo_url, brandColor: client.brand_color, questions: QUESTIONS, answers: client.brief ?? null })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!rateLimit(`brief:${requestIp(req)}:${token.slice(0, 12)}`, 10, 60 * 60_000).allowed) {
    return NextResponse.json({ error: 'Too many tries. Wait a while and try again.' }, { status: 429 })
  }
  const found = await clientForToken(token)
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const v = validateBrief(body.answers)
  if (!v.ok) return NextResponse.json({ error: 'Some answers are missing', errors: v.errors }, { status: 400 })

  const { admin, client } = found
  const { error } = await admin.from('clients').update({ brief: v.answers, brief_submitted_at: new Date().toISOString() }).eq('id', client.id)
  if (error) return NextResponse.json({ error: 'Could not save that. Try again.' }, { status: 500 })

  // Best effort: tell the freelancer.
  try {
    const { data: owner } = await admin.from('profiles').select('email').eq('id', client.owner_id).maybeSingle()
    if (owner?.email) await sendClientEventAlert({ to: owner.email, clientName: client.name, event: 'brief', detail: v.answers.business })
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true })
}

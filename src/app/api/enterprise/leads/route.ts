import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendAdminEnterpriseLeadAlert } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Public capture point for the /enterprise contact form — replaces the old
// mailto: link, which left every enquiry untracked in the founder's inbox.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = rateLimit(`enterprise-lead:${ip}`, 5, 60_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests, try again shortly' }, { status: 429 })

  let body: { name?: string; email?: string; company?: string; teamSize?: string; message?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const name = String(body.name ?? '').trim().slice(0, 200)
  const email = String(body.email ?? '').trim().slice(0, 200)
  const company = String(body.company ?? '').trim().slice(0, 200)
  const teamSize = String(body.teamSize ?? '').trim().slice(0, 50)
  const message = String(body.message ?? '').trim().slice(0, 2000)

  if (!name || !EMAIL_RE.test(email) || !company) {
    return NextResponse.json({ error: 'Name, a valid email, and company are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('enterprise_leads').insert({
    name, email, company, team_size: teamSize || null, message: message || null, source: 'enterprise_page',
  })
  if (error) return NextResponse.json({ error: 'Failed to submit — email hello@wyberai.com directly' }, { status: 500 })

  sendAdminEnterpriseLeadAlert({ name, email, company, teamSize, message }).catch(() => {})

  return NextResponse.json({ ok: true })
}

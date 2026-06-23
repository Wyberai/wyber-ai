import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { buildEmailIdentity } from '@/lib/ai-employees/email-identity'

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

// Dodo uses the Standard Webhooks spec (HMAC-SHA256, whsec_ secret) — same scheme
// as Svix. Verify over the raw body using webhook-id/timestamp/signature headers.
function verifyStandardWebhook(raw: string, headers: Headers, secret: string): boolean {
  try {
    const id = headers.get('webhook-id')
    const ts = headers.get('webhook-timestamp')
    const sigHeader = headers.get('webhook-signature')
    if (!id || !ts || !sigHeader) return false
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false
    const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest('base64')
    return sigHeader.split(' ').some(part => {
      const sig = part.split(',')[1]
      if (!sig || sig.length !== expected.length) return false
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    })
  } catch {
    return false
  }
}

// Provision the actual employee from a paid hire request.
async function provision(db: ReturnType<typeof createServiceClient>, hr: {
  id: string; user_id: string; role_slug: string; employee_name: string; requester_email?: string
}) {
  const role = getRoleBySlug(hr.role_slug)
  if (!role) return
  let employeeId: string | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const identity = buildEmailIdentity(hr.employee_name)
    const { data: emp, error } = await db.from('ai_employees').insert({
      user_id: hr.user_id,
      name: hr.employee_name,
      role: role.title,
      emoji: role.emoji,
      instructions: `${role.description}\n\n${role.systemPromptExtra}`,
      tools: role.tools.map(t => t.toUpperCase()),
      kpis: role.kpiDefaults,
      schedule_type: 'manual',
      email_local: identity.email_local,
      email_domain: identity.email_domain,
      email_address: identity.email_address,
      handle: identity.handle,
    }).select('id').single()
    if (!error && emp) { employeeId = emp.id; break }
    if (error && (error as { code?: string }).code !== '23505') return
  }

  await db.from('employee_hire_requests').update({
    status: 'active', decided_at: new Date().toISOString(), employee_id: employeeId,
  }).eq('id', hr.id)

  if (hr.requester_email) {
    resend.emails.send({
      from: 'WyberAi <hello@wyberai.com>', to: hr.requester_email,
      subject: `${hr.employee_name} is hired! 🎉`,
      text: `Payment received — ${hr.employee_name}, your ${role.title}, is ready.\n\nSet them up here: ${APP_URL}/ai-employees/${employeeId}/onboard`,
    }).then(() => {}, () => {})
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()

  // Reuse the existing DODO_WEBHOOK_SECRET. If you give the employee app its own
  // Dodo webhook endpoint (which gets its own signing secret), set
  // DODO_EMPLOYEES_WEBHOOK_SECRET and it takes precedence.
  const secret = process.env.DODO_EMPLOYEES_WEBHOOK_SECRET ?? process.env.DODO_WEBHOOK_SECRET
  if (secret && !verifyStandardWebhook(raw, req.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let evt: Record<string, unknown>
  try { evt = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const type = String(evt.type ?? '')
  const ACTIVATE = ['payment.succeeded', 'subscription.active']
  const DEACTIVATE = ['subscription.cancelled', 'subscription.canceled', 'subscription.on_hold', 'subscription.expired']
  if (!ACTIVATE.includes(type) && !DEACTIVATE.includes(type)) {
    return NextResponse.json({ ok: true, ignored: type })
  }

  const data = (evt.data ?? {}) as Record<string, unknown>
  const metadata = (data.metadata ?? {}) as Record<string, unknown>
  const refId = String(metadata.hire_request_id ?? '')
  const email = String(data.customer_email ?? (data.customer as { email?: string })?.email ?? '')

  const db = createServiceClient()

  // ── Cancellation / non-payment: pause the employee ─────────────────────────
  if (DEACTIVATE.includes(type)) {
    let target: { id: string; employee_id?: string } | null = null
    if (refId) {
      const { data: r } = await db.from('employee_hire_requests').select('id, employee_id').eq('id', refId).maybeSingle()
      target = r
    }
    if (!target && email) {
      const { data: r } = await db.from('employee_hire_requests')
        .select('id, employee_id').ilike('requester_email', email).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      target = r
    }
    if (target?.employee_id) {
      await db.from('ai_employees').update({ is_active: false }).eq('id', target.employee_id)
      await db.from('employee_hire_requests').update({ status: 'cancelled' }).eq('id', target.id)
    }
    return NextResponse.json({ ok: true, deactivated: !!target?.employee_id })
  }

  // Find the pending request: by our reference id first, else most-recent
  // pending_payment for this customer email.
  let hr: { id: string; user_id: string; role_slug: string; employee_name: string; requester_email?: string; status: string } | null = null
  if (refId) {
    const { data: r } = await db.from('employee_hire_requests').select('*').eq('id', refId).single()
    hr = r
  }
  if (!hr && email) {
    const { data: r } = await db.from('employee_hire_requests')
      .select('*').ilike('requester_email', email).eq('status', 'pending_payment')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    hr = r
  }

  if (!hr) return NextResponse.json({ ok: true, matched: false })
  if (hr.status === 'active') return NextResponse.json({ ok: true, alreadyActive: true }) // idempotent

  await provision(db, hr)
  return NextResponse.json({ ok: true, provisioned: true })
}

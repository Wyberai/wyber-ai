import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { computeDynamicPrice, formatPrice } from '@/lib/ai-employees/pricing'
import { buildEmailIdentity } from '@/lib/ai-employees/email-identity'

const resend = new Resend(process.env.RESEND_API_KEY!)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'admin@reconsignal.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

async function priceFor(db: ReturnType<typeof createServiceClient>, slug: string, title: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [{ count: active }, { count: recent }] = await Promise.all([
    db.from('ai_employees').select('id', { count: 'exact', head: true }).ilike('role', title).eq('is_active', true),
    db.from('ai_employees').select('id', { count: 'exact', head: true }).ilike('role', title).gte('created_at', since),
  ])
  return computeDynamicPrice(slug, { activeHires: active ?? 0, recentHires: recent ?? 0 })
}

// ── Create a hire request (any authenticated user) ────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roleSlug, employeeName, company, note } = await req.json()
  const role = getRoleBySlug(roleSlug)
  if (!role) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  if (!employeeName?.trim()) return NextResponse.json({ error: 'Please name your employee' }, { status: 400 })

  const db = createServiceClient()
  const price = await priceFor(db, roleSlug, role.title)

  const { data: request, error } = await db.from('employee_hire_requests').insert({
    user_id: user.id,
    role_slug: roleSlug,
    role_title: role.title,
    employee_name: employeeName.trim(),
    requester_email: user.email,
    company: company ?? null,
    note: note ?? null,
    quoted_price_cents: price.priceCents,
    status: 'pending',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the owner that there's a hire to approve.
  resend.emails.send({
    from: 'WyberAi <hello@wyberai.com>',
    to: OWNER_EMAIL,
    subject: `New hire request: ${role.title} ("${employeeName.trim()}") — ${formatPrice(price.priceCents)}/mo`,
    text: `${user.email}${company ? ` (${company})` : ''} wants to hire a ${role.title}, named "${employeeName.trim()}", at ${formatPrice(price.priceCents)}/mo.\n\n${note ? `Note: ${note}\n\n` : ''}Approve or reject: ${APP_URL}/ai-employees/admin/requests`,
  }).then(() => {}, () => {})

  return NextResponse.json({ request, priceLabel: `${formatPrice(price.priceCents)}/mo` }, { status: 201 })
}

// ── List requests (owner only) ────────────────────────────────────────────────
export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || user.email !== OWNER_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { data } = await db.from('employee_hire_requests').select('*').order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ requests: data ?? [] })
}

// ── Approve / reject (owner only) ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || user.email !== OWNER_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action, finalPriceCents } = await req.json()
  if (!id || !['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const db = createServiceClient()
  const { data: hr } = await db.from('employee_hire_requests').select('*').eq('id', id).single()
  if (!hr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (hr.status !== 'pending') return NextResponse.json({ error: `Already ${hr.status}` }, { status: 409 })

  if (action === 'reject') {
    await db.from('employee_hire_requests').update({ status: 'rejected', decided_by: user.id, decided_at: new Date().toISOString() }).eq('id', id)
    resend.emails.send({
      from: 'WyberAi <hello@wyberai.com>', to: hr.requester_email,
      subject: `Update on your ${hr.role_title} hire request`,
      text: `Thanks for your interest. We're not able to approve this hire right now. Reach out if you'd like to discuss.`,
    }).then(() => {}, () => {})
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // Approve → provision the actual employee for the requester.
  const role = getRoleBySlug(hr.role_slug)
  if (!role) return NextResponse.json({ error: 'Role no longer exists' }, { status: 400 })

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
    if (error && (error as { code?: string }).code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  await db.from('employee_hire_requests').update({
    status: 'approved', decided_by: user.id, decided_at: new Date().toISOString(),
    final_price_cents: finalPriceCents ?? hr.quoted_price_cents, employee_id: employeeId,
  }).eq('id', id)

  resend.emails.send({
    from: 'WyberAi <hello@wyberai.com>', to: hr.requester_email,
    subject: `${hr.employee_name} is hired! 🎉`,
    text: `Great news — ${hr.employee_name}, your ${hr.role_title}, is approved and ready.\n\nSet them up here: ${APP_URL}/ai-employees/${employeeId}/onboard`,
  }).then(() => {}, () => {})

  return NextResponse.json({ ok: true, status: 'approved', employeeId })
}

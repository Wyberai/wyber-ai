import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { getRolePrice } from '@/lib/ai-employees/pricing'

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'hello@wyberai.com'

// Append query params to a checkout URL (handles existing query string).
function withParams(url: string, params: Record<string, string>): string {
  const u = new URL(url)
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v)
  return u.toString()
}

// ── Create a hire request → return the Dodo checkout link ──────────────────────
// Payment is the gate (no manual approval). We persist the chosen instance name
// as a pending_payment request; the Dodo webhook provisions the employee on
// successful payment, correlating by metadata id (and email/role as fallback).
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roleSlug, employeeName, company, note } = await req.json()
  const role = getRoleBySlug(roleSlug)
  if (!role) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  if (!employeeName?.trim()) return NextResponse.json({ error: 'Please name your employee' }, { status: 400 })

  const db = createServiceClient()
  const price = getRolePrice(roleSlug)

  const { data: request, error } = await db.from('employee_hire_requests').insert({
    user_id: user.id,
    role_slug: roleSlug,
    role_title: role.title,
    employee_name: employeeName.trim(),
    requester_email: user.email,
    company: company ?? null,
    note: note ?? null,
    quoted_price_cents: price.priceCents,
    status: 'pending_payment',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hand back the Dodo checkout link with our reference + customer email attached
  // so the webhook can tie the payment back to this exact request.
  const checkoutUrl = price.checkoutUrl
    ? withParams(price.checkoutUrl, {
        metadata_hire_request_id: request.id,
        email: user.email ?? '',
      })
    : null

  return NextResponse.json({ request, checkoutUrl, priceLabel: price.priceLabel }, { status: 201 })
}

// ── Owner visibility into hires (read-only) ───────────────────────────────────
export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || user.email !== OWNER_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { data } = await db.from('employee_hire_requests').select('*').order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ requests: data ?? [] })
}

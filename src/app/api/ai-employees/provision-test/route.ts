import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { buildEmailIdentity } from '@/lib/ai-employees/email-identity'

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'hello@wyberai.com'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com').replace(/\/$/, '')

/**
 * OWNER-ONLY test provisioning. Spins up a real AI-employee instance for the
 * owner's own account WITHOUT the Dodo payment flow, so we can test the run
 * engine before launch. Gated strictly to OWNER_EMAIL. Mirrors the insert shape
 * used by the paid provisioning path in dodo-webhook.
 *
 * GET  → provision (default: marketing-manager) and redirect to the employee page
 *        — so you can test by just visiting the URL in the browser.
 * POST → same, returns JSON { id, url }.  Optional body: { slug, name }.
 */
async function provisionFor(userId: string, slug: string, name?: string) {
  const role = getRoleBySlug(slug)
  if (!role) return { error: `Unknown role: ${slug}` as string }
  const employeeName = name?.trim() || role.title.split(' ')[0] || 'Test'
  const identity = buildEmailIdentity(employeeName)
  const db = createServiceClient()
  const { data: emp, error } = await db.from('ai_employees').insert({
    user_id: userId,
    name: employeeName,
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
  if (error) return { error: error.message }
  return { id: emp.id as string, name: employeeName, role: role.title }
}

async function requireOwner() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  if (user.email !== OWNER_EMAIL) return { error: 'Forbidden', status: 403 as const }
  return { userId: user.id }
}

export async function GET(req: NextRequest) {
  const owner = await requireOwner()
  if ('error' in owner) return NextResponse.json({ error: owner.error }, { status: owner.status })
  const slug = new URL(req.url).searchParams.get('slug') || 'marketing-manager'
  const res = await provisionFor(owner.userId, slug)
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 500 })
  return NextResponse.redirect(`${APP_URL}/ai-employees/${res.id}`)
}

export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  if ('error' in owner) return NextResponse.json({ error: owner.error }, { status: owner.status })
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const res = await provisionFor(owner.userId, (body.slug as string) || 'marketing-manager', body.name as string)
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 500 })
  return NextResponse.json({ ...res, url: `/ai-employees/${res.id}` })
}

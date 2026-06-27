import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { buildEmailIdentity } from '@/lib/ai-employees/email-identity'

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'hello@wyberai.com'

/**
 * OWNER-ONLY test provisioning. Spins up a real AI-employee instance for the
 * owner's own account WITHOUT going through the Dodo payment flow, so we can test
 * the run engine before launch. Gated strictly to OWNER_EMAIL. Mirrors the insert
 * shape used by the paid provisioning path in dodo-webhook.
 */
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.email !== OWNER_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const slug = (body.slug as string) || 'marketing-manager'
  const role = getRoleBySlug(slug)
  if (!role) return NextResponse.json({ error: `Unknown role: ${slug}` }, { status: 400 })

  const name = (body.name as string) || role.title.split(' ')[0] || 'Test'
  const identity = buildEmailIdentity(name)

  const db = createServiceClient()
  const { data: emp, error } = await db.from('ai_employees').insert({
    user_id: user.id,
    name,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: emp.id, name, role: role.title, url: `/ai-employees/${emp.id}` })
}

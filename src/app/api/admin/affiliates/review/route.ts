import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

// Approve / reject / suspend an affiliate application. Admin-gated +
// service-role, mirrors /api/admin/marketplace/review — an applicant can
// never self-approve into commission eligibility.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, action } = await req.json().catch(() => ({})) as { id?: string; action?: 'approve' | 'reject' | 'suspend' }
  if (!id || !action || !['approve', 'reject', 'suspend'].includes(action)) {
    return NextResponse.json({ error: 'id and a valid action are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: affiliate } = await db.from('affiliates').select('id, status').eq('id', id).maybeSingle()
  if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const statusFor: Record<string, string> = { approve: 'approved', reject: 'rejected', suspend: 'suspended' }
  const newStatus = statusFor[action]

  const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
  if (newStatus === 'approved' && affiliate.status !== 'approved') updates.approved_at = new Date().toISOString()

  const { error } = await db.from('affiliates').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status: newStatus })
}

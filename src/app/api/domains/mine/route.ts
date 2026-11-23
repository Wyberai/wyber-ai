import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { connectionStatus, type ConnectionStatus } from '@/lib/domains/vercel'
import { requireUser, unauthorized } from '@/lib/domains/route-helpers'
import { daysBetween } from '@/lib/domains/dates'

// GET /api/domains/mine: the person's domains with a live connection status (DNS pending, certificate pending, live),
// plus workspace subscriptions and any paid order that still needs attention.
export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()
  const admin = await createAdminClient()
  const [{ data: domains }, { data: workspaces }, { data: orders }] = await Promise.all([
    admin.from('managed_domains').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    admin.from('workspace_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    admin.from('commerce_orders').select('id,kind,domain,status,total_cents,error,created_at').eq('user_id', user.id).in('status', ['awaiting_payment', 'registering', 'needs_attention']).order('created_at', { ascending: false }).limit(20),
  ])
  const now = new Date()
  const rows = await Promise.all((domains ?? []).map(async (d: Record<string, unknown>) => {
    const status: ConnectionStatus = !d.vercel_attached || !d.dns_written ? 'needs_attention' : await connectionStatus(String(d.domain))
    const exp = d.expires_at ? new Date(String(d.expires_at)) : null
    return { ...d, connection: status === 'needs_attention' ? (d.dns_written ? 'needs_attention' : 'dns_pending') : status, daysLeft: exp ? daysBetween(now, exp) : null }
  }))
  const ws = (workspaces ?? []).map((w: Record<string, unknown>) => ({ ...w, daysLeft: w.expires_at ? daysBetween(now, new Date(String(w.expires_at))) : null }))
  return NextResponse.json({ domains: rows, workspaces: ws, orders: orders ?? [] })
}

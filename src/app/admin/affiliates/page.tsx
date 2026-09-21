import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { AdminAffiliatesClient, type AdminAffiliate } from './AdminAffiliatesClient'

export const dynamic = 'force-dynamic'

export default async function AdminAffiliatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/dashboard')

  const db = createServiceClient()

  let affiliates: AdminAffiliate[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('affiliates')
      .select('id, user_id, status, payout_email, payout_method, applied_at, approved_at')
      .order('status', { ascending: true })
      .order('applied_at', { ascending: false })
    if (error) throw error

    const ids = Array.from(new Set((data ?? []).map(a => a.user_id).filter(Boolean))) as string[]
    const profileById: Record<string, { email: string; affiliate_pending_usd: number; affiliate_paid_usd: number; referral_code: string | null }> = {}
    if (ids.length) {
      const { data: profiles } = await db.from('profiles').select('id, email, affiliate_pending_usd, affiliate_paid_usd, referral_code').in('id', ids)
      profiles?.forEach(p => { profileById[p.id] = { email: p.email, affiliate_pending_usd: Number(p.affiliate_pending_usd || 0), affiliate_paid_usd: Number(p.affiliate_paid_usd || 0), referral_code: p.referral_code } })
    }

    affiliates = (data ?? []).map(a => ({
      ...a,
      email: profileById[a.user_id]?.email ?? '—',
      referral_code: profileById[a.user_id]?.referral_code ?? null,
      pending_usd: profileById[a.user_id]?.affiliate_pending_usd ?? 0,
      paid_usd: profileById[a.user_id]?.affiliate_paid_usd ?? 0,
    }))
  } catch {
    tableReady = false // migration not applied yet
  }

  return <AdminAffiliatesClient affiliates={affiliates} tableReady={tableReady} />
}

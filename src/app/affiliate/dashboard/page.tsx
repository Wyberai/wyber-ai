import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AffiliateClient, type Commission } from './AffiliateClient'

export const dynamic = 'force-dynamic'

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/affiliate/dashboard')

  const { data: affiliate } = await supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle()

  let commissions: Commission[] = []
  if (affiliate) {
    const { data } = await supabase
      .from('affiliate_commissions')
      .select('id, dodo_event_type, plan_key, charge_usd, commission_usd, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(100)
    commissions = data ?? []
  }

  const { data: profile } = await supabase.from('profiles').select('affiliate_pending_usd, affiliate_paid_usd').eq('id', user.id).maybeSingle()

  return (
    <AffiliateClient
      affiliate={affiliate}
      commissions={commissions}
      pendingUsd={Number(profile?.affiliate_pending_usd || 0)}
      paidUsd={Number(profile?.affiliate_paid_usd || 0)}
    />
  )
}

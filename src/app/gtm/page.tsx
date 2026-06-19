import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GTMDashboardClient from './GTMDashboardClient'

export const metadata = { title: 'GTM — WyberAi', description: 'Find customers, run outreach, close deals. Your complete go-to-market in one place.' }

export default async function GTMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, campaignsRes, leadsRes] = await Promise.all([
    supabase.from('gtm_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('gtm_campaigns').select('id,name,status,type,stats,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('gtm_leads').select('id,status', { count: 'exact', head: false }).eq('user_id', user.id).limit(1),
  ])

  return (
    <GTMDashboardClient
      user={user}
      profile={profileRes.data}
      campaigns={campaignsRes.data || []}
      totalLeads={leadsRes.count || 0}
    />
  )
}

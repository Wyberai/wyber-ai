import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellClient } from './SellClient'

export const metadata: Metadata = {
  title: 'Sell your app — WyberAi Marketplace',
  description: 'List an app you built on WyberAi for sale at whatever price you set.',
}

export const dynamic = 'force-dynamic'

export default async function SellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/marketplace/sell')

  const [{ data: projects }, { data: listings }] = await Promise.all([
    supabase.from('projects').select('id, name, framework').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('marketplace_listings').select('id, title, category, price_usd, status, sales_count, created_at').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  return <SellClient projects={projects ?? []} listings={listings ?? []} />
}

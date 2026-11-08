import { createClient, createAdminClient } from '@/lib/supabase/server'
import { growthSnapshot } from '@/lib/ops/marketing/snapshot'
import { istDay } from '@/lib/ops/schedule'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CompanyNav from '@/components/admin/CompanyNav'
import GrowthClient from './GrowthClient'

export const metadata: Metadata = { title: 'Growth — admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminGrowthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/growth')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  const initial = await growthSnapshot(createAdminClient(), new Date(), istDay(new Date()))
  return <><CompanyNav /><GrowthClient initial={JSON.parse(JSON.stringify(initial))} /></>
}

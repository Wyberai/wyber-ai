import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { currentWplMonth } from '@/lib/challenge'
import { AdminChallengeClient, type AdminEntry } from './AdminChallengeClient'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['hello@wyberai.com', 'sumit@reconsignal.com', 'sumit.sutar259@gmail.com', 'admin@reconsignal.com']

export default async function AdminChallengePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) redirect('/dashboard')

  const { period: periodParam } = await searchParams
  const period = periodParam || currentWplMonth()
  const db = createServiceClient()

  let entries: AdminEntry[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('challenge_entries')
      .select('id, user_id, title, description, handle, live_url, video_url, vote_count, status, award, awarded_usd, created_at')
      .eq('period', period)
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    // Attach builder emails.
    const ids = Array.from(new Set((data ?? []).map(e => e.user_id)))
    const emailById: Record<string, string> = {}
    if (ids.length) {
      const { data: profiles } = await db.from('profiles').select('id, email').in('id', ids)
      profiles?.forEach(p => { emailById[p.id] = p.email })
    }
    entries = (data ?? []).map(e => ({ ...e, email: emailById[e.user_id] ?? '—' }))
  } catch {
    tableReady = false // migration not applied yet
  }

  return <AdminChallengeClient period={period} entries={entries} tableReady={tableReady} />
}

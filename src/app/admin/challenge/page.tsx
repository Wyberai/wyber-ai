import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { currentChallengeWeek } from '@/lib/challenge'
import { AdminChallengeClient, type AdminEntry } from './AdminChallengeClient'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['hello@wyberai.com', 'sumit@reconsignal.com', 'sumit.sutar259@gmail.com', 'admin@reconsignal.com']

export default async function AdminChallengePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) redirect('/dashboard')

  const { week: weekParam } = await searchParams
  const week = weekParam || currentChallengeWeek()
  const db = createServiceClient()

  let entries: AdminEntry[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('challenge_entries')
      .select('id, user_id, title, description, handle, live_url, vote_count, status, award, awarded_credits, created_at')
      .eq('week', week)
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

  return <AdminChallengeClient week={week} entries={entries} tableReady={tableReady} />
}

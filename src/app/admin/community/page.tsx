import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { AdminCommunityClient, type AdminSubmission } from './AdminCommunityClient'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/dashboard')

  const db = createServiceClient()

  let submissions: AdminSubmission[] = []
  let tableReady = true
  try {
    const { data, error } = await db
      .from('community_program_submissions')
      .select('id, user_id, program, proof_url, proof_text, bonus_type, status, granted_credits, created_at')
      // pending first, then most recent
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error

    const ids = Array.from(new Set((data ?? []).map(s => s.user_id)))
    const emailById: Record<string, string> = {}
    if (ids.length) {
      const { data: profiles } = await db.from('profiles').select('id, email').in('id', ids)
      profiles?.forEach(p => { emailById[p.id] = p.email })
    }
    submissions = (data ?? []).map(s => ({ ...s, email: emailById[s.user_id] ?? '—' }))
  } catch {
    tableReady = false
  }

  return <AdminCommunityClient submissions={submissions} tableReady={tableReady} />
}

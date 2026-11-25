import type { SupabaseClient } from '@supabase/supabase-js'
import { ANNOUNCEMENT_KIND, type AudienceInput, type ProfileRow } from './audiences'

// Reads everything the audience rules need. Read-only. Pages through results so a growing user table is not cut off.
async function pageAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function loadAudienceInput(admin: SupabaseClient): Promise<AudienceInput> {
  const profiles = await pageAll<ProfileRow>((a, b) =>
    admin.from('profiles').select('id, email, full_name, plan, subscription_status, email_opt_out').order('created_at', { ascending: true }).range(a, b))

  // A "real build" is one that cost credits. Rows that only log a model call ("call:<route>") do not count.
  const charged = await pageAll<{ user_id: string | null; action_type: string }>((a, b) =>
    admin.from('generation_usage_log').select('user_id, action_type').gt('credits_charged', 0).range(a, b))
  const builderIds = new Set(charged.filter(r => r.user_id && !String(r.action_type).startsWith('call:')).map(r => r.user_id as string))

  const owners = await pageAll<{ user_id: string | null }>((a, b) => admin.from('projects').select('user_id').not('files', 'is', null).range(a, b))
  const projectOwnerIds = new Set(owners.map(r => r.user_id).filter((x): x is string => !!x))

  const { data: sentRows, error } = await admin.from('email_events').select('user_id').eq('kind', ANNOUNCEMENT_KIND)
  if (error) throw new Error(`email_events: ${error.message}`) // without the send log we must not send: people could get it twice
  const alreadySent = new Set((sentRows ?? []).map((r: { user_id: string }) => r.user_id))

  return { profiles, builderIds, projectOwnerIds, alreadySent }
}

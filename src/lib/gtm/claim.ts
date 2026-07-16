// Ownership transfer for GTM campaign demos. Shared by the /api/gtm/claim route
// and the dashboard server component so a founder's personalized demo becomes
// theirs on their first authenticated load.

type AdminClient = { from: (t: string) => any }

export interface ClaimedDemo { id: string; name: string; url: string | null }

/**
 * Reassign unclaimed demo projects to `userId`, matching EITHER a claim token
 * (from the outreach link — works regardless of which email they signed up
 * with) OR the target email (case-insensitive fallback). Clears the demo flags.
 * Idempotent and never throws — returns [] on error so a claim attempt can't
 * break the dashboard render.
 */
export async function claimDemos(
  admin: AdminClient,
  userId: string,
  opts: { email?: string | null; token?: string | null },
): Promise<ClaimedDemo[]> {
  const email = (opts.email || '').trim().toLowerCase()
  const token = (opts.token || '').trim()
  if (!email && !token) return []
  try {
    // Collect matches by token and by email, then de-dupe.
    const found = new Map<string, any>()
    if (token) {
      const { data } = await admin.from('projects').select('id, name, published_url').eq('is_demo', true).eq('claim_token', token)
      for (const d of data || []) found.set(d.id, d)
    }
    if (email) {
      const { data } = await admin.from('projects').select('id, name, published_url').eq('is_demo', true).ilike('target_email', email)
      for (const d of data || []) found.set(d.id, d)
    }
    const demos = [...found.values()]
    if (demos.length === 0) return []

    const { error } = await admin
      .from('projects')
      .update({ user_id: userId, is_demo: false, target_email: null, claim_token: null, updated_at: new Date().toISOString() })
      .in('id', demos.map((d) => d.id))
    if (error) return []

    return demos.map((d) => ({ id: d.id, name: d.name, url: d.published_url ?? null }))
  } catch {
    return []
  }
}

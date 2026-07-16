// Ownership transfer for GTM campaign demos. Shared by the /api/gtm/claim route
// and the dashboard server component so a founder's personalized demo becomes
// theirs on their first authenticated load.

type AdminClient = { from: (t: string) => any }

export interface ClaimedDemo { id: string; name: string; url: string | null }

/**
 * Reassign any unclaimed demo projects built for `email` to `userId`, clearing
 * the demo flags. Case-insensitive email match. Idempotent: a no-op once the
 * user has no matching unclaimed demos. Never throws — returns [] on error so a
 * claim attempt can't break the dashboard render.
 */
export async function claimDemosForEmail(
  admin: AdminClient,
  userId: string,
  email: string,
): Promise<ClaimedDemo[]> {
  const e = (email || '').trim().toLowerCase()
  if (!e) return []
  try {
    const { data: demos } = await admin
      .from('projects')
      .select('id, name, published_url')
      .eq('is_demo', true)
      .ilike('target_email', e)
    if (!demos || demos.length === 0) return []

    const ids = demos.map((d: any) => d.id)
    const { error } = await admin
      .from('projects')
      .update({ user_id: userId, is_demo: false, target_email: null, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) return []

    return demos.map((d: any) => ({ id: d.id, name: d.name, url: d.published_url ?? null }))
  } catch {
    return []
  }
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

/** Signed-in admin + a service-role client, or nulls. Every /api/admin/crm route starts here. */
export async function getCrmAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return { user: null, admin: null }
  const admin = await createAdminClient()
  return { user, admin }
}

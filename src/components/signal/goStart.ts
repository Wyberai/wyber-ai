'use client'

/** Where "start building" should land: the dashboard if they are signed in (it picks up the pending prompt), sign-up if not. */
export async function startPath(): Promise<'/dashboard' | '/signup'> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getUser()
    return data.user ? '/dashboard' : '/signup'
  } catch {
    return '/signup'
  }
}

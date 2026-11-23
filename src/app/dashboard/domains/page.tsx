import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import DomainsManager from '@/components/domains/DomainsManager'

export const metadata: Metadata = { title: 'Domains and email' }

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">Domains and email</h1>
      <DomainsManager />
    </main>
  )
}

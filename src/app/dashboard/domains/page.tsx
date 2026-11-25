import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import DomainsManager from '@/components/domains/DomainsManager'

export const metadata: Metadata = { title: 'Domains and email' }

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--ide-text)', padding: '32px 24px 64px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--ide-text2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          &larr; Back to dashboard
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Domains and email</h1>
        <p style={{ fontSize: 14, color: 'var(--ide-text2)', margin: '0 0 28px', maxWidth: '60ch', lineHeight: 1.6 }}>
          Buy a domain for your site and we connect it for you, or add Google Workspace email on your own domain.
        </p>
        <DomainsManager />
      </div>
    </div>
  )
}

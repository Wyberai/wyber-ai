import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export default async function OrgLandingPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const { domain } = await searchParams
  if (!domain) notFound()

  const db = createServiceClient()
  const { data: org } = await db
    .from('organizations')
    .select('*, ai_employees(id, name, emoji, role, slug, is_active)')
    .eq('custom_domain', domain)
    .single()

  if (!org) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#52525b' }}>
        <div style={{ fontSize: 32 }}>🤖</div>
        <p style={{ fontSize: 16 }}>No AI employees found for {domain}</p>
        <Link href="https://wyberai.com" style={{ color: '#0EA5E9', fontSize: 14 }}>Powered by WyberAi</Link>
      </div>
    )
  }

  const employees = org.ai_employees?.filter((e: { is_active: boolean }) => e.is_active) ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{org.name}</div>
        <a href="https://wyberai.com" style={{ fontSize: 11, color: '#3f3f46', textDecoration: 'none' }}>Powered by WyberAi</a>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px' }}>
          {org.name}'s AI Team
        </h1>
        <p style={{ color: '#52525b', fontSize: 15, margin: '0 0 40px' }}>
          {employees.length} AI employee{employees.length !== 1 ? 's' : ''} working for {org.name}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {employees.map((emp: { id: string; slug: string; emoji: string; name: string; role: string }) => (
            <Link key={emp.id} href={`/${emp.slug ?? emp.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: '#1a1a22', border: '1px solid #2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{emp.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{emp.role}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

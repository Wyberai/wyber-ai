import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Support — find a project', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ q?: string }> }

// Support-mode entry point: a customer shares their project name (or ID) and
// an allowlisted admin finds it here, then opens it in the editor in support
// mode. Server-rendered, admin-gated, plain GET form — nothing to break.
export default async function AdminSupportPage({ searchParams }: Props) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/support')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const query = (q ?? '').trim()
  let results: { id: string; name: string; updated_at: string; is_public: boolean; owner_email: string }[] = []
  if (query) {
    const admin = await createAdminClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)
    const base = admin.from('projects').select('id, name, user_id, updated_at, is_public').limit(20).order('updated_at', { ascending: false })
    const { data: projects } = isUuid
      ? await base.eq('id', query)
      : await base.ilike('name', `%${query}%`)
    if (projects?.length) {
      const ownerIds = [...new Set(projects.map(p => p.user_id))]
      const { data: owners } = await admin.from('profiles').select('id, email').in('id', ownerIds)
      const emailById = new Map((owners ?? []).map(o => [o.id, o.email as string]))
      results = projects.map(p => ({
        id: p.id, name: p.name || 'Untitled', updated_at: p.updated_at,
        is_public: !!p.is_public, owner_email: emailById.get(p.user_id) ?? 'unknown',
      }))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🛠 Support — find a customer project</h1>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>Search by project name (what the customer sees in their top bar) or paste a project ID. Opening a result puts the editor in support mode — saves and publishes apply to the customer&apos;s account.</p>
        <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            name="q" defaultValue={query} placeholder="Project name or ID…" autoFocus
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#18181b', color: '#fafafa', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Search</button>
        </form>

        {query && results.length === 0 && (
          <p style={{ fontSize: 13, color: '#a1a1aa' }}>No projects match “{query}”. Ask the customer for the exact name in their editor top bar, or their project URL.</p>
        )}
        {results.map(p => (
          <a key={p.id} href={`/project/${p.id}`} style={{ display: 'block', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113', marginBottom: 10, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{p.name}</span>
              <span style={{ fontSize: 11, color: '#52525b' }}>{new Date(p.updated_at).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
              {p.owner_email} · {p.is_public ? 'published' : 'private'} · <code style={{ fontSize: 11, color: '#71717a' }}>{p.id}</code>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

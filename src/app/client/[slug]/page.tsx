import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

interface DeliverableRow {
  id: string
  headline: string | null
  description: string | null
  sort_order: number
  is_visible: boolean
  projects: {
    id: string
    name: string
    thumbnail_url: string | null
    deployed_url: string | null
    published_url: string | null
    custom_domain: string | null
  } | null
}

function liveUrlFor(p: NonNullable<DeliverableRow['projects']>): string | null {
  if (p.custom_domain) return `https://${p.custom_domain}`
  return p.published_url || p.deployed_url || null
}

// Public, unauthenticated client delivery page — see src/proxy.ts for the
// matching allowlist entry. Reads via the service-role client (RLS on
// `clients`/`client_deliverables` is owner-only; there's deliberately no
// public select policy), same posture as src/app/org-landing/page.tsx.
export default async function ClientDeliveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const { data: client } = await db
    .from('clients')
    .select('name, logo_url, brand_color, intro_text, status, client_deliverables(id, headline, description, sort_order, is_visible, projects(id, name, thumbnail_url, deployed_url, published_url, custom_domain))')
    .eq('slug', slug)
    .maybeSingle()

  // Paused/archived clients 404 outright, not just "hidden" — a link that
  // used to work for a client shouldn't quietly keep resolving after an
  // engagement ends.
  if (!client || client.status !== 'active') notFound()

  const deliverables = ((client.client_deliverables ?? []) as unknown as DeliverableRow[])
    .filter(d => d.is_visible && d.projects)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display, system-ui)', color: '#e4e4e7' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        {client.logo_url && <img src={client.logo_url} alt={client.name} style={{ height: 28, width: 'auto' }} />}
        <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{client.name}</div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 80px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 12px' }}>
          Your build{deliverables.length !== 1 ? 's' : ''}
        </h1>
        {client.intro_text && (
          <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.7, margin: '0 0 40px', maxWidth: 640 }}>{client.intro_text}</p>
        )}

        {deliverables.length === 0 ? (
          <p style={{ color: '#52525b', fontSize: 14 }}>Nothing shared yet — check back soon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {deliverables.map(d => {
              const project = d.projects!
              const liveUrl = liveUrlFor(project)
              return (
                <div key={d.id} style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.thumbnail_url && (
                    <img src={project.thumbnail_url} alt={project.name} style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 9, border: '1px solid #1e1e26', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{d.headline || project.name}</div>
                    {d.description && <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{d.description}</p>}
                  </div>
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', borderRadius: 9, background: client.brand_color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      View live →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { readableOn } from '@/lib/color-contrast'
import { isUnlocked, unlockCookieName } from '@/lib/agency/passcode'
import { loadAgencyProfile, publicProfile } from '@/lib/agency/profile'
import { PasscodeGate, ReviewControls, ViewBeacon, QuoteCard, type FeedbackItem, type QuoteView } from './PortalClient'

interface DeliverableRow {
  id: string
  headline: string | null
  description: string | null
  sort_order: number
  is_visible: boolean
  review_status: string | null
  delivered_at: string | null
  handover_note: string | null
  preview_token: string | null
  preview_enabled: boolean | null
  preview_built_at: string | null
  projects: {
    id?: string
    name: string
    thumbnail_url: string | null
    deployed_url: string | null
    published_url: string | null
    custom_domain: string | null
  } | null
}

// A private delivery link sent to one client: keep it out of search results and give it a title that is not the homepage's.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your project',
  robots: { index: false, follow: false },
}

function liveUrlFor(p: NonNullable<DeliverableRow['projects']>): string | null {
  if (p.custom_domain) return `https://${p.custom_domain}`
  return p.published_url || p.deployed_url || null
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SAFE_COLOR = /^#[0-9a-fA-F]{6}$/

// Public, unauthenticated client delivery page — see src/proxy.ts for the
// matching allowlist entry. Reads via the service-role client (RLS on
// `clients`/`client_deliverables` is owner-only; there's deliberately no
// public select policy), same posture as src/app/org-landing/page.tsx.
export default async function ClientDeliveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const { data: client } = await db
    .from('clients')
    .select('id, owner_id, org_id, name, logo_url, brand_color, intro_text, status, portal_passcode_hash, client_deliverables(id, headline, description, sort_order, is_visible, review_status, delivered_at, handover_note, preview_token, preview_enabled, preview_built_at, projects(name, thumbnail_url, deployed_url, published_url, custom_domain))')
    .eq('slug', slug)
    .maybeSingle()

  // Paused/archived clients 404 outright, not just "hidden" — a link that
  // used to work for a client shouldn't quietly keep resolving after an
  // engagement ends.
  if (!client || client.status !== 'active') notFound()

  const brand = SAFE_COLOR.test(client.brand_color ?? '') ? client.brand_color : '#0EA5E9'
  const ink = readableOn(brand)
  const unlocked = isUnlocked(slug, client.portal_passcode_hash, (await cookies()).get(unlockCookieName(slug))?.value)

  // The business behind this client (the workspace's profile, or the freelancer's own). Its name and logo show on the
  // locked page too; contact and tax details only once the page is unlocked.
  const profile = publicProfile(await loadAgencyProfile(db, { owner_id: client.owner_id, org_id: client.org_id }))

  const header = (
    <nav style={{ borderBottom: '1px solid #14202e', background: '#0a1018', borderTop: `3px solid ${brand}`, padding: '0 32px', minHeight: 64, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {client.logo_url && <img src={client.logo_url} alt="" style={{ height: 28, width: 'auto' }} />}
      <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{client.name}</div>
      {profile?.business_name && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8797ab' }}>
          {profile.logo_url && <img src={profile.logo_url} alt="" style={{ height: 20, width: 'auto' }} />}
          <span>Delivered by <strong style={{ color: '#c7d1de', fontWeight: 600 }}>{profile.business_name}</strong></span>
        </div>
      )}
    </nav>
  )

  const footer = profile && (profile.business_name || profile.support_email || profile.website) ? (
    <footer style={{ borderTop: '1px solid #14202e', padding: '24px 32px 40px', textAlign: 'center', fontSize: 12, color: '#8797ab', lineHeight: 1.8 }}>
      {profile.business_name && <div style={{ color: '#c7d1de', fontWeight: 600 }}>{profile.business_name}</div>}
      <div>
        {[profile.website && <a key="w" href={profile.website} target="_blank" rel="noreferrer noopener" style={{ color: '#8797ab' }}>{profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>,
          profile.support_email && <a key="e" href={`mailto:${profile.support_email}`} style={{ color: '#8797ab' }}>{profile.support_email}</a>,
          profile.phone && <span key="p">{profile.phone}</span>].filter(Boolean).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ' · ', el] : [el]), [])}
      </div>
      {profile.address && <div style={{ whiteSpace: 'pre-line' }}>{profile.address}</div>}
      {profile.tax_id && <div>{profile.tax_label || 'Tax ID'}: {profile.tax_id}</div>}
    </footer>
  ) : null

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', background: '#05080d', fontFamily: 'var(--font-display, system-ui)', color: '#e8eef7' }}>
        {header}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '72px 32px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', textAlign: 'center', margin: '0 0 8px' }}>This page is protected</h1>
          <p style={{ color: '#9aa8bb', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>Enter the passcode you were given to see your project.</p>
          <PasscodeGate slug={slug} brand={brand} ink={ink} />
        </main>
      </div>
    )
  }

  const deliverables = ((client.client_deliverables ?? []) as unknown as DeliverableRow[])
    .filter(d => d.is_visible && d.projects)
    .sort((a, b) => a.sort_order - b.sort_order)

  const ids = deliverables.map(d => d.id)
  const [{ data: updates }, { data: feedback }, { data: quotes }] = await Promise.all([
    db.from('client_updates').select('id, body, created_at').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
    ids.length
      ? db.from('client_feedback').select('id, deliverable_id, kind, author_name, body, created_at, resolved').eq('client_id', client.id).in('deliverable_id', ids).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ id: string; deliverable_id: string } & FeedbackItem> }),
    // Drafts are never shown. Payment details only travel once the client has accepted.
    db.from('client_quotes').select('id, number, title, currency, items, total, note, terms, recurrence, status, responded_by, payment_instructions, payment_url').eq('client_id', client.id).in('status', ['sent', 'accepted', 'paid', 'declined']).order('created_at', { ascending: false }),
  ])
  const byDeliverable = new Map<string, FeedbackItem[]>()
  for (const f of (feedback ?? []) as Array<{ deliverable_id: string } & FeedbackItem>) {
    const list = byDeliverable.get(f.deliverable_id) ?? []
    list.push({ id: f.id, kind: f.kind, author_name: f.author_name, body: f.body, created_at: f.created_at, resolved: f.resolved })
    byDeliverable.set(f.deliverable_id, list)
  }
  const approved = deliverables.filter(d => d.review_status === 'approved').length

  return (
    <div style={{ minHeight: '100vh', background: '#05080d', fontFamily: 'var(--font-display, system-ui)', color: '#e8eef7' }}>
      <ViewBeacon slug={slug} />
      {header}

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 80px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 12px' }}>
          Your build{deliverables.length !== 1 ? 's' : ''}
        </h1>
        {client.intro_text && (
          <p style={{ color: '#9aa8bb', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px', maxWidth: 640 }}>{client.intro_text}</p>
        )}
        {deliverables.length > 1 && (
          <p style={{ color: '#8797ab', fontSize: 13, margin: '0 0 32px' }}>{approved} of {deliverables.length} approved</p>
        )}

        {(updates ?? []).length > 0 && (
          <section aria-labelledby="portal-updates" style={{ margin: '0 0 40px' }}>
            <h2 id="portal-updates" style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Latest updates</h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '1px solid #1b2a3b', paddingLeft: 18 }}>
              {(updates ?? []).map(u => (
                <li key={u.id}>
                  <div style={{ fontSize: 12, color: '#5d6d82', marginBottom: 2 }}>{day(u.created_at)}</div>
                  <div style={{ fontSize: 14, color: '#c7d1de', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{u.body}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(quotes ?? []).length > 0 && (
          <section aria-labelledby="portal-quotes" style={{ margin: '0 0 40px' }}>
            <h2 id="portal-quotes" style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>{(quotes ?? []).length > 1 ? 'Quotes' : 'Quote'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(quotes as unknown as QuoteView[]).map(q => (
                <QuoteCard key={q.id} slug={slug} business={profile} clientName={client.name} quote={{ ...q, total: Number(q.total), payment_instructions: q.status === 'sent' || q.status === 'declined' ? null : q.payment_instructions, payment_url: q.status === 'sent' || q.status === 'declined' ? null : q.payment_url }} brand={brand} ink={ink} />
              ))}
            </div>
          </section>
        )}

        {deliverables.length === 0 ? (
          <p style={{ color: '#8797ab', fontSize: 14 }}>Nothing shared yet — check back soon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {deliverables.map(d => {
              const project = d.projects!
              const liveUrl = liveUrlFor(project)
              return (
                <div key={d.id} style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {project.thumbnail_url && (
                    <img src={project.thumbnail_url} alt="" style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 9, border: '1px solid #1b2a3b', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      {d.headline || project.name}
                      {d.delivered_at && <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Delivered {day(d.delivered_at)}</span>}
                    </div>
                    {d.description && <p style={{ fontSize: 13, color: '#8797ab', lineHeight: 1.6, margin: 0 }}>{d.description}</p>}
                    {d.delivered_at && d.handover_note && client.portal_passcode_hash && (
                      <div style={{ marginTop: 12, padding: '12px 14px', background: '#0a1018', border: '1px solid #14202e', borderRadius: 9 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Handover notes</div>
                        <div style={{ fontSize: 14, color: '#c7d1de', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{d.handover_note}</div>
                      </div>
                    )}
                  </div>
                  {d.preview_enabled && d.preview_token && (
                    <a href={`/preview/${d.preview_token}`} target="_blank" rel="noopener" style={{ padding: '10px 20px', borderRadius: 9, background: liveUrl ? 'transparent' : brand, color: liveUrl ? '#e8eef7' : ink, border: liveUrl ? '1px solid #1b2a3b' : 'none', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      View preview →
                    </a>
                  )}
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', borderRadius: 9, background: brand, color: ink, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      View live →
                    </a>
                  )}
                  <ReviewControls slug={slug} deliverableId={d.id} status={d.review_status ?? 'pending'} feedback={byDeliverable.get(d.id) ?? []} brand={brand} ink={ink} />
                </div>
              )
            })}
          </div>
        )}
      </main>
      {footer}
    </div>
  )
}

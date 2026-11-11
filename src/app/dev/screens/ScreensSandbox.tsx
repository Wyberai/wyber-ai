'use client'
import { Suspense, useEffect, useState } from 'react'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { ClientsPageClient } from '@/app/clients/ClientsPageClient'
import OnboardingPage from '@/app/onboarding/page'

const iso = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const profile = {
  id: 'sandbox', email: 'sandbox@example.test', full_name: 'Sample User', avatar_url: null, plan: 'free' as const, credits: 30,
  credits_reset_at: iso(-30), stripe_customer_id: null, github_token: null, created_at: iso(20), updated_at: iso(1),
}
const projects = [
  { id: 'p1', name: 'Invoice tracker', description: null, framework: 'react-vite' as const, project_type: 'app', thumbnail_url: null, updated_at: iso(1), created_at: iso(6), is_public: false },
  { id: 'p2', name: 'Salon bookings', description: null, framework: 'react-vite' as const, project_type: 'website', thumbnail_url: null, updated_at: iso(3), created_at: iso(9), is_public: true },
  { id: 'p3', name: 'Stock counter', description: null, framework: 'react-vite' as const, project_type: 'mobile', thumbnail_url: null, updated_at: iso(7), created_at: iso(12), is_public: false },
]
const clients = [
  { id: 'c1', name: 'Northwind Interiors', slug: 'northwind-interiors', company_name: 'Northwind Interiors', contact_email: 'hello@northwind.test', contact_name: 'Asha', logo_url: null, brand_color: '#0d9488', intro_text: "Here's what we've built for you so far.", status: 'active' as const, notes: null,
    client_deliverables: [{ id: 'd1', headline: 'Booking portal', description: 'Clients book site visits online.', sort_order: 0, is_visible: true, project_id: 'p1', projects: { id: 'p1', name: 'Invoice tracker', thumbnail_url: null } }] },
  { id: 'c2', name: 'Harbor Foods', slug: 'harbor-foods', company_name: null, contact_email: null, contact_name: null, logo_url: null, brand_color: '#f97316', intro_text: null, status: 'paused' as const, notes: null, client_deliverables: [] },
]

// The agency dashboard's newer fields (stage, review state, quotes, brief, handover), added on top of the fake clients above.
const agencyClients = clients.map((c, i) => ({ ...c, org_id: null, owner_id: 'me', created_at: iso(10 - i), has_passcode: i === 0, view_count: i === 0 ? 4 : 0, last_viewed_at: i === 0 ? iso(0) : null, credits_used: i === 0 ? 142 : 0,
  brief_token: i === 0 ? 'b_demo' : null, brief: i === 0 ? { kind: 'Website', business: 'Northwind Interiors', about: 'We design homes for young families.', goal: 'Get enquiries' } : null, brief_submitted_at: i === 0 ? iso(9) : null,
  _role: 'owner', _canEdit: true, _canDelete: true,
  client_feedback: i === 0 ? [{ id: 'f1', deliverable_id: 'd1', kind: 'changes_requested', author_name: 'Asha', body: 'Can the booking button be larger on phones?', resolved: false, created_at: iso(0) }] : [],
  client_updates: i === 0 ? [{ id: 'u1', body: 'Booking flow is live on staging. Have a look and tell us what you think.', created_at: iso(1), emailed_at: iso(1) }] : [],
  client_quotes: i === 0 ? [{ id: 'q1', number: 'Q-001', title: 'Website build', currency: 'INR', items: [{ description: 'Design and build', qty: 1, unit: 45000 }], total: 45000, note: null, payment_instructions: 'UPI: asha@upi', payment_url: null, status: 'accepted', sent_at: iso(8), responded_at: iso(7), responded_by: 'Asha Rao', decline_reason: null, paid_at: null, created_at: iso(8) }] : [],
  client_deliverables: c.client_deliverables.map(d => ({ ...d, review_status: d.id === 'd1' ? 'changes_requested' : 'pending', reviewed_at: null, delivered_at: null, handover_note: null })) }))

/** Fake data only. ?s=dashboard (default) | clients | clients-empty | dashboard-empty | onboarding */
export function ScreensSandbox() {
  const [s, setS] = useState<string | null>(null)
  useEffect(() => { setS(new URLSearchParams(location.search).get('s') || 'dashboard') }, [])
  if (!s) return null
  return (
    <Suspense fallback={null}>
      {s === 'clients' && <ClientsPageClient initialClients={agencyClients as never} projects={projects.map(p => ({ id: p.id, name: p.name, thumbnail_url: null }))} workspaces={[]} pins={[{ id: 'pin1', project_id: 'p1', page_path: '/contact', body: 'Typo in the header', author_name: 'Raj', resolved: false, created_at: iso(0) }] as never} feedbackModes={{ p1: true }} />}
      {s === 'clients-empty' && <ClientsPageClient initialClients={[]} projects={[]} workspaces={[]} />}
      {s === 'onboarding' && <OnboardingPage />}
      {s === 'dashboard-empty' && <DashboardClient profile={profile} projects={[]} />}
      {s === 'dashboard' && <DashboardClient profile={profile} projects={projects} />}
    </Suspense>
  )
}

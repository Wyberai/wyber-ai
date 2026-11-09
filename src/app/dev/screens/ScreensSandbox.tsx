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

/** Fake data only. ?s=dashboard (default) | clients | clients-empty | dashboard-empty | onboarding */
export function ScreensSandbox() {
  const [s, setS] = useState<string | null>(null)
  useEffect(() => { setS(new URLSearchParams(location.search).get('s') || 'dashboard') }, [])
  if (!s) return null
  return (
    <Suspense fallback={null}>
      {s === 'clients' && <ClientsPageClient initialClients={clients} projects={projects.map(p => ({ id: p.id, name: p.name, thumbnail_url: null }))} />}
      {s === 'clients-empty' && <ClientsPageClient initialClients={[]} projects={[]} />}
      {s === 'onboarding' && <OnboardingPage />}
      {s === 'dashboard-empty' && <DashboardClient profile={profile} projects={[]} />}
      {s === 'dashboard' && <DashboardClient profile={profile} projects={projects} />}
    </Suspense>
  )
}

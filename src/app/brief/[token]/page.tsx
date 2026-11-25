import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { QUESTIONS } from '@/lib/agency/brief'
import { readableOn } from '@/lib/color-contrast'
import { BriefForm } from './BriefForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Project brief', robots: { index: false, follow: false } }

const SAFE_COLOR = /^#[0-9a-fA-F]{6}$/

// Public intake form for one client, reached from a link the freelancer sends. The token is the only access.
export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || token.length < 10 || token.length > 80) notFound()
  const db = createServiceClient()
  const { data: client } = await db.from('clients').select('name, logo_url, brand_color, status, brief').eq('brief_token', token).maybeSingle()
  if (!client || client.status === 'archived') notFound()

  const brand = SAFE_COLOR.test(client.brand_color ?? '') ? client.brand_color : '#0EA5E9'
  return (
    <div style={{ minHeight: '100vh', background: '#05080d', fontFamily: 'var(--font-display, system-ui)', color: '#e8eef7' }}>
      <nav style={{ borderBottom: '1px solid #14202e', background: '#0a1018', borderTop: `3px solid ${brand}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        {client.logo_url && <img src={client.logo_url} alt="" style={{ height: 28, width: 'auto' }} />}
        <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{client.name}</div>
      </nav>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px' }}>Tell us about your project</h1>
        <p style={{ color: '#9aa8bb', fontSize: 15, lineHeight: 1.65, margin: '0 0 32px' }}>A few short questions so we start in the right place. It takes about five minutes, and short answers are fine.</p>
        <BriefForm token={token} questions={QUESTIONS} initial={(client.brief as Record<string, string> | null) ?? {}} brand={brand} ink={readableOn(brand)} />
      </main>
    </div>
  )
}

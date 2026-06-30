import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import GTMInboxClient from './GTMInboxClient'

export default async function GTMInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = user ? await supabase
    .from('gtm_analytics_events')
    .select(`
      id, event_type, created_at, metadata, lead_id,
      gtm_leads(first_name, last_name, email, company_name, title)
    `)
    .eq('user_id', user.id)
    .in('event_type', ['email_replied', 'reply', 'REPLIED', 'call_completed', 'meeting_booked'])
    .order('created_at', { ascending: false })
    .limit(100) : { data: [] }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>← GTM</Link>
      </nav>
      <GTMInboxClient initialEvents={events || []} />

    </div>
  )
}

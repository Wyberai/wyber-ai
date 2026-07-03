import { createAdminClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Unsubscribe — WyberAi', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ e?: string; t?: string }> }

// Every marketing email footer links here with a signed ?e=&t= pair — one
// click sets the opt-out, no login required. Transactional email (receipts,
// auth links, payment failures) is unaffected; only nudges/drips stop.
export default async function UnsubscribePage({ searchParams }: Props) {
  const { e, t } = await searchParams
  const email = (e ?? '').trim().toLowerCase()

  let state: 'done' | 'invalid' | 'missing' = 'missing'
  if (email && t) {
    if (verifyUnsubscribeToken(email, t)) {
      try {
        const admin = await createAdminClient()
        await admin.from('profiles').update({ email_opt_out: true }).eq('email', email)
        state = 'done'
      } catch {
        state = 'invalid'
      }
    } else {
      state = 'invalid'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0f', color: '#f0f0f4', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: 'center', background: '#141416', border: '1px solid #2e2e38', borderRadius: 14, padding: '40px 32px' }}>
        {state === 'done' && (
          <>
            <div style={{ fontSize: 32 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 8px' }}>You&apos;re unsubscribed</h1>
            <p style={{ fontSize: 14, color: '#8888a0', lineHeight: 1.6 }}>{email} won&apos;t receive marketing or reminder emails from WyberAi anymore. You&apos;ll still get essential account emails — receipts, login links, and payment issues.</p>
            <p style={{ fontSize: 13, color: '#555566', marginTop: 16 }}>Changed your mind? Email <a href="mailto:hello@wyberai.com" style={{ color: '#0EA5E9' }}>hello@wyberai.com</a> and we&apos;ll switch it back on.</p>
          </>
        )}
        {state === 'invalid' && (
          <>
            <div style={{ fontSize: 32 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 8px' }}>That link didn&apos;t check out</h1>
            <p style={{ fontSize: 14, color: '#8888a0', lineHeight: 1.6 }}>The unsubscribe link looks incomplete or altered. Email <a href="mailto:hello@wyberai.com" style={{ color: '#0EA5E9' }}>hello@wyberai.com</a> from the address you want removed and we&apos;ll do it by hand.</p>
          </>
        )}
        {state === 'missing' && (
          <>
            <div style={{ fontSize: 32 }}>📭</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 8px' }}>Unsubscribe</h1>
            <p style={{ fontSize: 14, color: '#8888a0', lineHeight: 1.6 }}>Use the unsubscribe link at the bottom of any WyberAi email, or email <a href="mailto:hello@wyberai.com" style={{ color: '#0EA5E9' }}>hello@wyberai.com</a> from the address you want removed.</p>
          </>
        )}
      </div>
    </div>
  )
}

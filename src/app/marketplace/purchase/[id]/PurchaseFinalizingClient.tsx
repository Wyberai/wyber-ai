'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const ACCENT = '#0EA5E9'
const POLL_MS = 1500
const MAX_POLLS = 40 // ~60s — the webhook clones a project, which is fast; this is a generous ceiling for a slow delivery

export function PurchaseFinalizingClient({ purchaseId }: { purchaseId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'pending' | 'failed' | 'timeout'>('pending')
  const [listingTitle, setListingTitle] = useState<string | null>(null)
  const pollCount = useRef(0)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const res = await fetch(`/api/marketplace/purchase/${purchaseId}`)
        const data = await res.json()
        if (cancelled) return

        if (data.listingTitle) setListingTitle(data.listingTitle)

        if (data.status === 'fulfilled' && data.deliveredProjectId) {
          router.replace(`/project/${data.deliveredProjectId}?justDelivered=1`)
          return
        }
        if (data.status === 'failed') {
          setState('failed')
          return
        }
      } catch { /* transient — keep polling */ }

      pollCount.current++
      if (pollCount.current >= MAX_POLLS) {
        setState('timeout')
        return
      }
      setTimeout(poll, POLL_MS)
    }

    poll()
    return () => { cancelled = true }
  }, [purchaseId, router])

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center' }}>
        <WyberLogo markSize={24} wordmarkSize={13} />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          {state === 'pending' && (
            <>
              <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Finalizing your purchase{listingTitle ? ` of ${listingTitle}` : ''}…
              </div>
              <div style={{ fontSize: 13, color: '#71717a' }}>Dropping a fully editable copy into your account. This only takes a moment.</div>
              <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            </>
          )}

          {state === 'failed' && (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Something went wrong delivering your app</div>
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>Your payment went through, but we hit an error setting up the project. Contact support and we'll sort it out.</div>
              <Link href="/contact" style={{ padding: '10px 20px', borderRadius: 10, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Contact support →</Link>
            </>
          )}

          {state === 'timeout' && (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Still working on it</div>
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>This is taking longer than usual. Check your dashboard in a minute — your project will be there.</div>
              <Link href="/dashboard" style={{ padding: '10px 20px', borderRadius: 10, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Go to dashboard →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

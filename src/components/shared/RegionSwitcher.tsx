'use client'
import { useRouter, usePathname } from 'next/navigation'
import type { Currency } from '@/lib/currency'

// Owner-only floating toggle to preview the US and India storefronts with one
// click. Renders ONLY when `show` (server-verified admin) is true, so regular
// visitors never see it and the India operation stays hidden from US traffic.
export function RegionSwitcher({ current, show }: { current: Currency; show: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  if (!show) return null

  const viewingIndia = current === 'INR'
  const target = viewingIndia ? 'us' : 'in'

  return (
    <div style={{ position: 'fixed', bottom: 18, left: 18, zIndex: 2147483000 }}>
      <button
        onClick={() => router.push(`${pathname}?region=${target}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', borderRadius: 999,
          background: 'rgba(9,9,11,0.9)', border: '1px solid rgba(255,255,255,0.18)',
          color: '#fafafa', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font-sans, system-ui)', boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
        }}
        title="Owner preview — switch storefront"
      >
        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Owner</span>
        <span>{viewingIndia ? '🇮🇳 India' : '🇺🇸 US'}</span>
        <span style={{ color: '#0EA5E9' }}>→ {viewingIndia ? '🇺🇸 US' : '🇮🇳 India'}</span>
      </button>
    </div>
  )
}

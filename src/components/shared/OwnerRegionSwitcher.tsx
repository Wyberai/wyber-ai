'use client'

import { useEffect, useState } from 'react'
import type { Currency } from '@/lib/currency'

// Floating US/IN toggle shown ONLY on a browser the owner has unlocked. The
// parent renders this exclusively when isOwnerPreview() is true server-side, so
// normal visitors never receive it. Toggling hits /api/owner-preview, which is
// authorized by the owner cookie (no key needed after unlock).
export function OwnerRegionSwitcher({ current }: { current: Currency }) {
  const [path, setPath] = useState('/')
  useEffect(() => setPath(window.location.pathname), [])

  const go = (region: 'US' | 'IN' | 'off') =>
    `/api/owner-preview?region=${region}&to=${encodeURIComponent(path)}`

  const btn = (label: string, active: boolean, region: 'US' | 'IN') => (
    <a
      href={go(region)}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 700,
        textDecoration: 'none',
        color: active ? '#fff' : '#a1a1aa',
        background: active ? '#0EA5E9' : 'transparent',
        transition: 'all .15s',
      }}
    >
      {label}
    </a>
  )

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'rgba(9,9,11,0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#52525b', padding: '0 6px 0 8px' }}>
        OWNER
      </span>
      {btn('🇺🇸 US', current === 'USD', 'US')}
      {btn('🇮🇳 IN', current === 'INR', 'IN')}
      <a
        href={go('off')}
        title="Back to IP-based (see what real visitors see)"
        style={{ fontSize: 11, color: '#52525b', textDecoration: 'none', padding: '0 8px 0 4px' }}
      >
        auto
      </a>
    </div>
  )
}

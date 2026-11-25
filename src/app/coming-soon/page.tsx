'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ComingSoonPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div style={{ minHeight: '100vh', background: '#05080d', color: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)' }}>
      <p style={{ fontSize: 14, color: '#8797ab' }}>Redirecting...</p>
    </div>
  )
}

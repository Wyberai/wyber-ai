'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ComingSoonPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
      <p style={{ fontSize: 14, color: '#71717a' }}>Redirecting...</p>
    </div>
  )
}

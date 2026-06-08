'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface App {
  id: string
  name: string
  description: string
  category: string
  keywords: string[]
  preview_color: string
}

export default function TemplatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [app, setApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/prebuilt-apps/${id}`)
      .then(r => r.json())
      .then(d => { setApp(d.app || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const buildThis = async () => {
    setBuilding(true)
    setError(null)
    try {
      const res = await fetch('/api/build-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: id }),
      })
      const data = await res.json()
      if (res.status === 401) { router.push('/login?next=/templates/' + id); return }
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.prompt && data.projectId) {
        sessionStorage.setItem(`wyber_prompt_${data.projectId}`, data.prompt)
      }
      router.push(`/project/${data.projectId}`)
    } catch (err: any) {
      setError(err.message)
      setBuilding(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!app) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fafafa', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div style={{ color: '#71717a', marginBottom: 24 }}>Template not found</div>
        <button onClick={() => router.push('/gallery')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Back to Gallery</button>
      </div>
    </div>
  )

  const color = app.preview_color || '#0EA5E9'

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/gallery')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Gallery
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ fontSize: 13, color: '#a1a1aa' }}>{app.name}</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        {/* Category badge */}
        <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: `${color}12`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 20 }}>
          {app.category}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>
          Build a {app.name} with AI
        </h1>
        <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 32, maxWidth: 600 }}>{app.description}</p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 48 }}>
          <button
            onClick={buildThis}
            disabled={building}
            style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: building ? '#27272a' : '#0EA5E9', color: building ? '#71717a' : '#fff', fontSize: 15, fontWeight: 700, cursor: building ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: building ? 'none' : '0 4px 20px rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {building ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating project...</>
            ) : 'Build this app free →'}
          </button>
          <button onClick={() => router.push('/pricing')} style={{ padding: '14px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            See pricing
          </button>
        </div>

        {error && <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, marginBottom: 24 }}>{error}</div>}

        {/* What you get */}
        <div style={{ padding: 28, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 18 }}>What you get instantly</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {['Production-ready React code', 'Live preview URL', 'One-click Vercel deploy', 'Full source code export', 'AI chat to customize further', 'Built in under 30 seconds'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#a1a1aa' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Keywords */}
        {app.keywords?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {app.keywords.map((k: string) => (
              <span key={k} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#52525b' }}>#{k}</span>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface App {
  id: string; name: string; category: string;
  description: string; keywords: string[]
}

export default function TemplatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [app, setApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/prebuilt_apps?id=eq.${id}&select=*`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      }
    })
      .then(r => r.json())
      .then(data => { setApp(data?.[0] || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const buildApp = async () => {
    setBuilding(true)
    try {
      const res = await fetch('/api/build-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: id })
      })
      const data = await res.json()
      if (data.projectId) {
        // Store prompt so editor auto-starts generation
        sessionStorage.setItem(`wyber_prompt_${data.projectId}`, data.prompt)
        router.push(`/project/${data.projectId}`)
      } else if (res.status === 401) {
        // Not logged in — go to signup with template param
        router.push(`/signup?template=${id}`)
      } else {
        alert('Failed to create project: ' + (data.error || 'Unknown error'))
        setBuilding(false)
      }
    } catch {
      setBuilding(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!app) return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Template not found</div>
      <Link href="/gallery" style={{ color: '#0EA5E9', textDecoration: 'none' }}>← Back to gallery</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, textDecoration: 'none', color: '#fafafa' }}>Wyber AI</Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/gallery" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>← Gallery</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ fontSize: 12, color: '#52525b', marginBottom: 28 }}>
          <Link href="/" style={{ color: '#52525b', textDecoration: 'none' }}>Home</Link>
          {' → '}
          <Link href="/gallery" style={{ color: '#52525b', textDecoration: 'none' }}>Gallery</Link>
          {' → '}
          <span style={{ color: '#a1a1aa' }}>{app.name}</span>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{app.category}</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>Build a {app.name} with AI</h1>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 32 }}>{app.description || `Build a production-ready ${app.name} instantly with Wyber AI.`}</p>

          <button onClick={buildApp} disabled={building}
            style={{ padding: '14px 32px', borderRadius: 10, background: building ? '#052e3f' : '#0EA5E9', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: building ? 'wait' : 'pointer', boxShadow: '0 4px 20px rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
            {building ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Creating your project...
              </>
            ) : '⚡ Build this app free →'}
          </button>
        </div>

        <div style={{ padding: 24, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>What you get instantly</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {['Production-ready React code', 'Live preview URL', 'GitHub repo sync', 'Supabase database ready', 'One-click Vercel deploy', 'Full source code export'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        {app.keywords?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {app.keywords.map((k: string) => (
              <span key={k} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#71717a' }}>#{k}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

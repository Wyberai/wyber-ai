'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TemplatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Loading template...')

  useEffect(() => {
    if (!id) return

    async function buildFromTemplate() {
      try {
        setStatus('Creating your project...')
        const res = await fetch('/api/build-from-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: id }),
        })

        const data = await res.json()

        if (!res.ok) {
          // Not logged in — redirect to login then back
          if (res.status === 401) {
            router.push('/login?next=/templates/' + id)
            return
          }
          throw new Error(data.error || 'Failed to create project')
        }

        // Store the prompt so ChatPanel auto-generates on load
        if (data.prompt && data.projectId) {
          sessionStorage.setItem(`wyber_prompt_${data.projectId}`, data.prompt)
        }

        setStatus('Opening editor...')
        router.push(`/project/${data.projectId}`)
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    }

    buildFromTemplate()
  }, [id, router])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, color: '#ef4444', marginBottom: 24 }}>{error}</div>
          <button onClick={() => router.push('/gallery')}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Back to Gallery
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <div style={{ fontSize: 15, color: '#71717a' }}>{status}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

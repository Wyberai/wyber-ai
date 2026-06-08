'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TemplatePage() {
  const { id } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!id) return
    fetch('/api/build-from-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: id }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.projectId) {
        if (data.prompt) sessionStorage.setItem('wyber_prompt_' + data.projectId, data.prompt)
        router.push('/project/' + data.projectId)
      } else if (data.error?.includes('nauthorized')) {
        router.push('/login?next=/templates/' + id)
      } else {
        router.push('/gallery')
      }
    })
    .catch(() => router.push('/gallery'))
  }, [id, router])

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 14, color: '#52525b', fontFamily: 'Inter,sans-serif' }}>Setting up your project...</div>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  )
}

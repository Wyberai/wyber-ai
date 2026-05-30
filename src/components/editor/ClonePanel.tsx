'use client'
import { useState } from 'react'
import { useEditorStore } from '@/store/editor'

export function ClonePanel({ onClose }: { onClose?: () => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setFiles, addMessage, setIsGenerating, setHasGeneratedFiles } = useEditorStore()

  const clone = async () => {
    if (!url.trim() || loading) return
    const cleanUrl = url.startsWith('http') ? url : 'https://' + url
    setLoading(true)
    setError('')
    onClose?.()

    const msgId = Math.random().toString(36).slice(2)
    addMessage({ id: msgId, role: 'user', content: `Clone website: ${cleanUrl}`, timestamp: 0, status: 'done' })
    const aId = Math.random().toString(36).slice(2)
    addMessage({ id: aId, role: 'assistant', content: `🔍 Scraping ${cleanUrl}...`, timestamp: 0, status: 'streaming' })
    setIsGenerating(true)

    try {
      const res = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Parse files from response
      const { parseGenerationOutput } = await import('@/lib/file-parser')
      const { files: newFiles } = parseGenerationOutput(data.code)

      if (newFiles.length > 0) {
        const fileMap: Record<string, any> = {}
        for (const f of newFiles) {
          const ext = f.path.split('.').pop() ?? ''
          const langMap: Record<string, string> = { tsx: 'typescript', ts: 'typescript', css: 'css', js: 'javascript' }
          fileMap[f.path] = { path: f.path, content: f.content, language: langMap[ext] ?? 'plaintext' }
        }
        setFiles(fileMap)
        setHasGeneratedFiles(true)
      }

      addMessage({ id: aId, role: 'assistant', content: `✓ Cloned ${cleanUrl} — ${newFiles.length} files generated. Customize it freely.`, timestamp: 0, status: 'done', filesChanged: newFiles.map(f => f.path) })
    } catch (err: any) {
      setError(err.message || 'Clone failed')
      addMessage({ id: aId, role: 'assistant', content: `Failed to clone: ${err.message}`, timestamp: 0, status: 'error' })
    }

    setIsGenerating(false)
    setLoading(false)
  }

  return (
    <div style={{ padding: 16, background: 'var(--bg-base)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Clone a Website</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
        Paste any URL — Wyber AI scrapes it and builds a React clone in seconds.
      </p>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && clone()}
        placeholder="stripe.com/pricing"
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 10 }}
      />
      {error && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{error}</div>}
      <button onClick={clone} disabled={!url.trim() || loading}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: url.trim() && !loading ? 'var(--accent)' : 'var(--bg-elevated)', color: url.trim() && !loading ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: url.trim() && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
        {loading ? '🔍 Cloning...' : '⚡ Clone it'}
      </button>
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Works with any public website. Requires Firecrawl API key.
      </div>
    </div>
  )
}

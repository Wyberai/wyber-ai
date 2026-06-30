'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = { bg: '#0b0d12', card: '#111115', border: '#1e1e26', text: '#e4e4e7', muted: '#71717a', dim: '#3f3f46' }
const SKY = '#0EA5E9', GREEN = '#22c55e'

interface Doc { title: string; source?: string; chunks: number; embedded: number; created_at: string }

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/ai-employees/knowledge')
    if (res.ok) { const d = await res.json(); setDocs(d.documents ?? []) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    const r = new FileReader(); r.onload = ev => setContent(String(ev.target?.result ?? '')); r.readAsText(f)
  }

  const save = async () => {
    if (!title.trim() || !content.trim()) { setMsg('Add a title and some content.'); return }
    setSaving(true); setMsg(null)
    const res = await fetch('/api/ai-employees/knowledge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content }),
    })
    const d = await res.json()
    if (res.ok) { setMsg(`Saved — ${d.chunks} chunks${d.note ? ` (${d.note})` : ', fully embedded'}.`); setTitle(''); setContent(''); load() }
    else setMsg(d.error ?? 'Failed to save')
    setSaving(false)
  }

  const del = async (t: string) => {
    await fetch(`/api/ai-employees/knowledge?title=${encodeURIComponent(t)}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ borderBottom: `1px solid ${s.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/ai-employees" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/ai-employees" style={{ fontSize: 12, color: s.muted, textDecoration: 'none' }}>← AI Employees</Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Company knowledge</h1>
        <p style={{ fontSize: 14, color: s.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
          Upload your brand book, product docs, ICP, past campaigns — anything about your business. <strong style={{ color: s.text }}>Every employee you hire learns from this</strong> and grounds their work in it. Add it once; they all know it.
        </p>

        {/* Add form */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title — e.g. Brand guidelines, ICP, Product overview" style={inp} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your content here, or upload a file below…" rows={7} style={{ ...inp, marginTop: 10, resize: 'vertical', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <label style={{ fontSize: 12.5, color: SKY, cursor: 'pointer' }}>
              <input type="file" accept=".txt,.md,.csv,.json" onChange={onFile} style={{ display: 'none' }} />📎 Upload a file
            </label>
            <span style={{ fontSize: 11, color: s.dim }}>{content.length.toLocaleString()} chars</span>
            <button onClick={save} disabled={saving} style={{ marginLeft: 'auto', padding: '10px 22px', borderRadius: 9, background: saving ? '#1a1a22' : SKY, border: 'none', color: saving ? s.dim : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Add to knowledge'}</button>
          </div>
          {msg && <p style={{ fontSize: 12.5, color: msg.startsWith('Saved') ? GREEN : '#ef4444', margin: '12px 0 0' }}>{msg}</p>}
        </div>

        {/* Docs */}
        <div style={{ fontSize: 12, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your knowledge ({docs.length})</div>
        {loading ? <p style={{ color: s.dim }}>Loading…</p> : docs.length === 0 ? (
          <p style={{ color: s.dim, fontSize: 14 }}>Nothing yet. Add your first document above — your employees will start using it on their next run.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(d => (
              <div key={d.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: s.card, border: `1px solid ${s.border}`, borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: s.dim, marginTop: 2 }}>{d.chunks} chunks · {d.embedded === d.chunks ? 'semantic recall ready' : `${d.embedded}/${d.chunks} embedded`}</div>
                </div>
                <button onClick={() => del(d.title)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0d0d11', border: '1px solid #2a2a35', borderRadius: 9, padding: '11px 13px', fontSize: 13.5, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit' }

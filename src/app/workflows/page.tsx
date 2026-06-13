'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WORKFLOW_GALLERY, WORKFLOW_CATEGORIES } from '@/lib/templates/workflow-gallery'
import { WyberLogo } from '@/components/shared/WyberLogo'

export default function WorkflowsPage() {
  const router = useRouter()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [launching, setLaunching] = useState<string | null>(null)
  const [useError, setUseError] = useState<string | null>(null)

  const filtered = WORKFLOW_GALLERY.filter(t => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleUse = async (template: typeof WORKFLOW_GALLERY[0]) => {
    if (launching) return
    setUseError(null)
    setLaunching(template.id)

    // Client-side auth check first — avoids the redirect loop where unauthenticated
    // users get sent to /signup and end up back at dashboard → workflows → repeat.
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/workflows')
      return
    }

    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          nodes: template.nodes,
          edges: template.edges,
        }),
      })
      if (res.status === 401) {
        router.push('/login?next=/workflows')
        return
      }
      const data = await res.json()
      if (data.flow?.id) {
        router.push('/flows/' + data.flow.id)
      } else {
        setUseError(data.error || 'Failed to create workflow. Please try again.')
        setLaunching(null)
      }
    } catch {
      setUseError('Network error. Please check your connection and try again.')
      setLaunching(null)
    }
  }

  const NODE_TYPE_COLOR: Record<string, string> = {
    trigger: '#f59e0b',
    ai: '#8b5cf6',
    action: '#0EA5E9',
    condition: '#22c55e',
    end: '#52525b',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', background: '#0d0d0f' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <WyberLogo markSize={24} wordmarkSize={13} />
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Workflow Templates</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/flows" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>My Automations</Link>
            <Link href="/dashboard" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 700 }}>Dashboard →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#22c55e', marginBottom: 16, fontWeight: 700 }}>
            ⚡ {WORKFLOW_GALLERY.length} Automation Templates
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>
            Automate any business process<br />
            <span style={{ color: '#0EA5E9' }}>with one click</span>
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.65 }}>
            {WORKFLOW_GALLERY.length} pre-built automation workflows across 7 business categories. Click any template to open it in the canvas builder with nodes pre-wired.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workflows..."
              style={{ flex: 1, padding: '10px 16px', background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fafafa', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Inline error banner */}
        {useError && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
            {useError}
          </div>
        )}

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
          {WORKFLOW_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: category === cat ? '#0EA5E9' : 'transparent',
                borderColor: category === cat ? '#0EA5E9' : 'rgba(255,255,255,0.08)',
                color: category === cat ? 'white' : '#71717a',
                transition: 'all 0.15s',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ marginBottom: 20, fontSize: 12, color: '#52525b' }}>
          {filtered.length} workflow{filtered.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}
          {search ? ` matching "${search}"` : ''}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#52525b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>No workflows found</div>
            <div style={{ fontSize: 13 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {filtered.map(t => (
              <div key={t.id}
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(14,165,233,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#52525b' }}>{t.category} · {t.nodes.length} steps</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.55, margin: '0 0 14px', flex: 1 }}>
                  {t.description}
                </p>

                {/* Node flow preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                  {t.nodes.map((node, i) => (
                    <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
                        background: `${NODE_TYPE_COLOR[node.type]}12`,
                        color: NODE_TYPE_COLOR[node.type],
                        border: `1px solid ${NODE_TYPE_COLOR[node.type]}25`,
                        whiteSpace: 'nowrap',
                      }}>
                        {node.tool}
                      </span>
                      {i < t.nodes.length - 1 && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5h6M6 3l2 2-2 2" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ⚡ {t.nodes.length} steps
                  </span>
                  <button
                    onClick={() => handleUse(t)}
                    disabled={launching === t.id}
                    style={{
                      fontSize: 12, fontWeight: 700,
                      color: launching === t.id ? '#52525b' : '#0EA5E9',
                      border: `1px solid ${launching === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(14,165,233,0.3)'}`,
                      borderRadius: 8,
                      background: launching === t.id ? 'transparent' : 'rgba(14,165,233,0.08)',
                      padding: '6px 14px',
                      cursor: launching === t.id ? 'wait' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    {launching === t.id
                      ? <><div style={{ width: 10, height: 10, border: '1.5px solid rgba(14,165,233,0.3)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Opening...</>
                      : 'Open in Canvas →'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 56, padding: '36px', background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Build from scratch</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Need a custom automation?</div>
          <div style={{ fontSize: 14, color: '#71717a', marginBottom: 20 }}>Start with a blank canvas and drag in triggers, AI steps, and actions.</div>
          <Link href="/flows" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Create blank flow →
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: #52525b }
      `}</style>
    </div>
  )
}

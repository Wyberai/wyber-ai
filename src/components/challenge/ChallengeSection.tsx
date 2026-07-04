'use client'

import { useCallback, useEffect, useState } from 'react'

const BRAND = '#0EA5E9'

type Entry = {
  id: string
  title: string
  description: string
  handle: string | null
  live_url: string | null
  thumbnail_url: string | null
  vote_count: number
  created_at: string
}

// A deterministic soft gradient for entries without a thumbnail, so the wall
// still looks alive instead of a grid of grey boxes.
function gradientFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return `linear-gradient(135deg, hsl(${h} 70% 22%), hsl(${(h + 60) % 360} 70% 16%))`
}

export function ChallengeSection({ enabled }: { enabled: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/challenge/entries', { cache: 'no-store' })
      const data = await res.json()
      setEntries(data.entries ?? [])
      setVoted(new Set<string>(data.votedIds ?? []))
    } catch { /* leave empty */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const upvote = useCallback(async (id: string) => {
    const wasVoted = voted.has(id)
    // Optimistic.
    setVoted(prev => { const n = new Set(prev); wasVoted ? n.delete(id) : n.add(id); return n })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, vote_count: e.vote_count + (wasVoted ? -1 : 1) } : e))

    const res = await fetch('/api/challenge/vote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: id }),
    })
    if (!res.ok) { load(); return } // reconcile on failure (voting is open — no login needed)
    const data = await res.json()
    setEntries(prev => prev.map(e => e.id === id ? { ...e, vote_count: data.count } : e))
    setVoted(prev => { const n = new Set(prev); data.voted ? n.add(id) : n.delete(id); return n })
  }, [voted, load])

  return (
    <section style={{ padding: '20px clamp(20px,4vw,48px) 60px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>This week&apos;s builds</h2>
          <p style={{ fontSize: 14, color: '#71717a', margin: '6px 0 0' }}>Opt-in only — upvote your favourites. The most-upvoted wins the community prize.</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ padding: '12px 22px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 24px rgba(14,165,233,0.25)' }}>
          Submit your build →
        </button>
      </div>

      {!enabled && (
        <p style={{ fontSize: 12, color: '#a16207', background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.25)', borderRadius: 8, padding: '8px 12px', margin: '12px 0 0', display: 'inline-block' }}>
          Owner preview — gallery is dark for the public until the flag is flipped.
        </p>
      )}

      <div style={{ marginTop: 28 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#52525b', fontSize: 14, padding: '40px 0' }}>Loading builds…</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🚀</div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>No builds yet this week</p>
            <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>Be the first — submit your build and start collecting upvotes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {entries.map(e => (
              <div key={e.id} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 140, background: e.thumbnail_url ? `center/cover no-repeat url(${e.thumbnail_url})` : gradientFor(e.id) }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, flex: 1 }}>{e.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#71717a' }}>
                      {e.handle ? <span>{e.handle}</span> : null}
                      {e.live_url ? <a href={e.live_url} target="_blank" rel="noopener noreferrer" style={{ color: BRAND, textDecoration: 'none', marginLeft: e.handle ? 8 : 0, fontWeight: 700 }}>View live ↗</a> : null}
                    </div>
                    <button onClick={() => upvote(e.id)} aria-pressed={voted.has(e.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, border: `1px solid ${voted.has(e.id) ? BRAND : 'rgba(255,255,255,0.14)'}`, background: voted.has(e.id) ? 'rgba(14,165,233,0.15)' : 'transparent', color: voted.has(e.id) ? BRAND : '#e4e4e7' }}>
                      <span style={{ fontSize: 12 }}>▲</span>{e.vote_count}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && <SubmitModal onClose={() => setOpen(false)} onSubmitted={(entry) => { setEntries(prev => [entry, ...prev]); setOpen(false) }} />}
    </section>
  )
}

function SubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (e: Entry) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [handle, setHandle] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [showLive, setShowLive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/challenge/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, handle, liveUrl: showLive ? liveUrl : '', showLive }),
      })
      if (res.status === 401) { window.location.href = '/login?next=/challenge'; return }
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      onSubmitted(data.entry)
    } catch { setError('Network error — try again.') } finally { setBusy(false) }
  }

  const field: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)', color: '#fafafa', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#a1a1aa', margin: '0 0 6px', display: 'block' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Submit your build</h3>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 20px', lineHeight: 1.5 }}>Only what you enter is ever shown — your other apps stay private. Winners picked Sunday.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>App name <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="e.g. StreakHabit" style={field} />
          </div>
          <div>
            <label style={label}>One-line pitch <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} maxLength={200} placeholder="What does it do?" style={field} />
          </div>
          <div>
            <label style={label}>Your handle (optional)</label>
            <input value={handle} onChange={e => setHandle(e.target.value)} maxLength={60} placeholder="@you" style={field} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#e4e4e7', cursor: 'pointer' }}>
              <input type="checkbox" checked={showLive} onChange={e => setShowLive(e.target.checked)} />
              Include a live demo link (uncheck to enter without exposing a working product)
            </label>
          </div>
          {showLive && (
            <div>
              <label style={label}>Live URL (optional)</label>
              <input value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://…" style={field} />
            </div>
          )}
          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: '#a1a1aa', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={submit} disabled={busy || !title.trim() || !description.trim()} style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: busy || !title.trim() || !description.trim() ? '#1f2937' : BRAND, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Submitting…' : 'Submit entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

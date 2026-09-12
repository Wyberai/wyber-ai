'use client'

import { useState } from 'react'

const BRAND = '#0EA5E9'

export function VoteWidget({ entryId, initialCount, initialVoted }: { entryId: string; initialCount: number; initialVoted: boolean }) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [busy, setBusy] = useState(false)

  const vote = async () => {
    if (busy) return
    setBusy(true)
    const wasVoted = voted
    setVoted(!wasVoted)
    setCount(c => c + (wasVoted ? -1 : 1))
    try {
      const res = await fetch('/api/challenge/vote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId }),
      })
      if (!res.ok) { setVoted(wasVoted); setCount(c => c + (wasVoted ? 1 : -1)); return }
      const data = await res.json()
      setVoted(data.voted); setCount(data.count)
    } catch {
      setVoted(wasVoted); setCount(c => c + (wasVoted ? 1 : -1))
    } finally { setBusy(false) }
  }

  return (
    <button onClick={vote} disabled={busy} aria-pressed={voted} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, cursor: busy ? 'default' : 'pointer',
      fontFamily: 'inherit', fontSize: 15, fontWeight: 800, border: `1px solid ${voted ? BRAND : 'rgba(255,255,255,0.14)'}`,
      background: voted ? 'rgba(14,165,233,0.15)' : 'transparent', color: voted ? BRAND : '#e4e4e7',
    }}>
      <span>▲</span> {voted ? 'Voted' : 'Upvote'} · {count}
    </button>
  )
}

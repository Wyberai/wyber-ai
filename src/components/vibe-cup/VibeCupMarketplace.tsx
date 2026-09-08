'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const BRAND = '#0EA5E9'
const BG = '#05060a'
const BG_RAISED = '#0a0c14'
const BORDER = 'rgba(255,255,255,0.08)'

const AWARD_META: Record<string, { label: string; color: string; emoji: string }> = {
  most_liked:    { label: 'Most Liked',    color: '#0EA5E9', emoji: '♥' },
  most_creative: { label: 'Most Creative', color: '#a78bfa', emoji: '✦' },
  best_design:   { label: 'Best Design',   color: '#f472b6', emoji: '◆' },
  most_useful:   { label: 'Most Useful',   color: '#34d399', emoji: '★' },
}

type Entry = {
  id: string
  name: string
  app_name: string
  description: string | null
  demo_url: string
  vote_count: number
  award: string | null
  created_at: string
}

export function VibeCupMarketplace() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vibe-cup/entries')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setEntries(data.entries ?? [])
      setVoted(new Set(data.votedIds ?? []))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleVote(entry: Entry) {
    const wasVoted = voted.has(entry.id)
    // Optimistic update
    setVoted(prev => {
      const next = new Set(prev)
      wasVoted ? next.delete(entry.id) : next.add(entry.id)
      return next
    })
    setEntries(prev => prev.map(e => e.id === entry.id
      ? { ...e, vote_count: e.vote_count + (wasVoted ? -1 : 1) }
      : e
    ))

    try {
      const res = await fetch('/api/vibe-cup/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entry.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, vote_count: data.count } : e))
        setVoted(prev => {
          const next = new Set(prev)
          data.voted ? next.add(entry.id) : next.delete(entry.id)
          return next
        })
      } else {
        // Revert
        setVoted(prev => {
          const next = new Set(prev)
          wasVoted ? next.add(entry.id) : next.delete(entry.id)
          return next
        })
        setEntries(prev => prev.map(e => e.id === entry.id
          ? { ...e, vote_count: e.vote_count + (wasVoted ? 1 : -1) }
          : e
        ))
      }
    } catch {
      // Revert on network failure
      setVoted(prev => {
        const next = new Set(prev)
        wasVoted ? next.add(entry.id) : next.delete(entry.id)
        return next
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#e6edf6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: BG, zIndex: 10 }}>
        <Link href="/vibe-cup" style={{ color: BRAND, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          ← Wybe Cup
        </Link>
        <Link href="/vibe-cup#enter" style={{ background: BRAND, color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Submit Your App
        </Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Wybe Cup Marketplace
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Vote for Your Favourite Apps
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '14px auto 0' }}>
            Try each app, vote for the ones you love. The most-voted apps win $2,000 · $1,000 · $500.
          </p>
        </div>

        {/* Award legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          {Object.entries(AWARD_META).map(([key, meta]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: `1px solid ${meta.color}30`, background: `${meta.color}12`, fontSize: 12, fontWeight: 600, color: meta.color }}>
              <span>{meta.emoji}</span> {meta.label}
            </span>
          ))}
        </div>

        {/* State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>
            Loading entries…
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#f87171', fontSize: 15 }}>{error}</div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>No entries yet</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Be the first to submit your app.</div>
            <Link href="/vibe-cup#enter" style={{ background: BRAND, color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Enter the Cup →
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && entries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} isVoted={voted.has(entry.id)} onVote={() => handleVote(entry)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EntryCard({ entry, isVoted, onVote }: { entry: Entry; isVoted: boolean; onVote: () => void }) {
  const award = entry.award ? AWARD_META[entry.award] : null

  return (
    <div style={{ background: BG_RAISED, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', transition: 'border-color 0.15s' }}>
      {/* Award badge */}
      {award && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: `${award.color}20`, border: `1px solid ${award.color}40`, fontSize: 11, fontWeight: 700, color: award.color }}>
          {award.emoji} {award.label}
        </div>
      )}

      {/* App name + creator */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', paddingRight: award ? 100 : 0 }}>
          {entry.app_name}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>by {entry.name}</div>
      </div>

      {/* Description */}
      {entry.description && (
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {entry.description}
        </p>
      )}

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <a
          href={entry.demo_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER}`, color: '#e6edf6', fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center', transition: 'background 0.15s' }}
        >
          Try Demo →
        </a>
        <button
          onClick={onVote}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 8, border: `1px solid ${isVoted ? BRAND : BORDER}`,
            background: isVoted ? `${BRAND}20` : 'transparent',
            color: isVoted ? BRAND : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 16 }}>{isVoted ? '♥' : '♡'}</span>
          <span>{entry.vote_count}</span>
        </button>
      </div>
    </div>
  )
}

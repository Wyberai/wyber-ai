'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SKY = '#0EA5E9'
const GOLD = '#f59e0b'
const VIOLET = '#a855f7'

export type AdminEntry = {
  id: string
  user_id: string
  title: string
  description: string
  handle: string | null
  live_url: string | null
  video_url?: string | null
  vote_count: number
  status: string
  award: 'editor' | 'upvoted' | 'creative' | null
  awarded_usd: number | null
  created_at: string
  email: string
}

const AWARD_LABEL = { editor: 'WPL Champion', upvoted: 'Fan Favorite', creative: 'Most Creative' } as const
const PRIZE_USD = { editor: 1000, upvoted: 500, creative: 300 } as const
const AWARD_COLOR = { editor: GOLD, upvoted: SKY, creative: VIOLET } as const

export function AdminChallengeClient({ period, entries, tableReady }: { period: string; entries: AdminEntry[]; tableReady: boolean }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const editorTaken = entries.some(e => e.award === 'editor')
  const upvotedTaken = entries.some(e => e.award === 'upvoted')
  const creativeTaken = entries.some(e => e.award === 'creative')

  const act = async (entryId: string, place: 'editor' | 'upvoted' | 'creative', action: 'award' | 'revoke') => {
    setBusyId(entryId); setMsg(null)
    try {
      const res = await fetch('/api/admin/challenge/award', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, place, action }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ kind: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ kind: 'ok', text: action === 'award' ? `Awarded ${AWARD_LABEL[place]} ($${PRIZE_USD[place].toLocaleString()} — arrange payout manually)` : `Revoked ${AWARD_LABEL[place]}` })
      router.refresh()
    } catch { setMsg({ kind: 'err', text: 'Network error' }) } finally { setBusyId(null) }
  }

  const btn = (bg: string, disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', background: disabled ? '#1f2937' : bg, color: '#fff', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#08080b', color: '#fff', fontFamily: 'var(--font-display), system-ui' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>← Command Center</Link>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>🏆 Wyber Premier League</span>
        </div>
        <span style={{ fontSize: 12, color: '#52525b' }}>Month {period}</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Entries</h1>
          <span style={{ fontSize: 14, color: '#71717a' }}>{entries.length} this month</span>
        </div>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 24px' }}>
          Award <strong style={{ color: GOLD }}>WPL Champion</strong> ($1,000) and <strong style={{ color: VIOLET }}>Most Creative</strong> ($300) to your picks; <strong style={{ color: SKY }}>Fan Favorite</strong> ($500) goes to the community vote leader. These are real cash prizes — awarding does not move any credits, it just records the win; pay out manually via bank transfer/PayPal after. One win per person per month is enforced automatically.
        </p>

        {!tableReady && (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.3)', color: '#eab308', fontSize: 13, marginBottom: 20 }}>
            The WPL tables aren&apos;t on this database yet. Apply migrations <code>20260704120000_challenge_entries_votes.sql</code> and <code>20260910000000_wpl_prizes.sql</code> to see entries here.
          </div>
        )}

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.kind === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${msg.kind === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.kind === 'ok' ? '#34d399' : '#f87171' }}>
            {msg.text}
          </div>
        )}

        {tableReady && entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#52525b', border: '1px dashed #1e1e26', borderRadius: 14 }}>No entries yet this month.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((e, i) => (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderRadius: 12, border: `1px solid ${e.award ? AWARD_COLOR[e.award] + '66' : '#1a1a22'}`, background: e.award ? AWARD_COLOR[e.award] + '10' : '#0d0d11' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#3f3f46', textAlign: 'center' }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{e.title}</span>
                    {e.award && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', background: AWARD_COLOR[e.award] + '22', color: AWARD_COLOR[e.award] }}>{AWARD_LABEL[e.award]}</span>}
                    {e.status === 'hidden' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#3f3f4622', color: '#71717a' }}>HIDDEN</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#a1a1aa', margin: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                  <div style={{ fontSize: 12, color: '#52525b', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>{e.email}</span>
                    {e.handle && <span>{e.handle}</span>}
                    {e.live_url && <a href={e.live_url} target="_blank" rel="noopener noreferrer" style={{ color: SKY, textDecoration: 'none' }}>project ↗</a>}
                    {e.video_url && <a href={e.video_url} target="_blank" rel="noopener noreferrer" style={{ color: VIOLET, textDecoration: 'none' }}>demo video ↗</a>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'center', minWidth: 44 }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>▲ {e.vote_count}</div>
                    <div style={{ fontSize: 10, color: '#52525b' }}>votes</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {e.award ? (
                      <button disabled={busyId === e.id} onClick={() => act(e.id, e.award!, 'revoke')} style={btn('#3f3f46', busyId === e.id)}>Revoke</button>
                    ) : (
                      <>
                        <button disabled={busyId === e.id || editorTaken} onClick={() => act(e.id, 'editor', 'award')} style={btn(GOLD, busyId === e.id || editorTaken)}>🏆 WPL Champion</button>
                        <button disabled={busyId === e.id || upvotedTaken} onClick={() => act(e.id, 'upvoted', 'award')} style={btn(SKY, busyId === e.id || upvotedTaken)}>🥈 Fan Favorite</button>
                        <button disabled={busyId === e.id || creativeTaken} onClick={() => act(e.id, 'creative', 'award')} style={btn(VIOLET, busyId === e.id || creativeTaken)}>🎨 Most Creative</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

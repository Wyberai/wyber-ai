'use client'
// Ask-first autonomy surface: the team found something it WOULD auto-fix, but
// the user set the dial to ask first. Fix runs the same free self-heal pass
// (approved), Dismiss clears the offer. Unlike designSuggestion chips this
// does dispatch directly on click — the pass is free and was explicitly asked
// for by the click itself.

import type { ChatMessage } from '@/store/editor'

export function FixOfferCard({
  fixOffer,
  onFix,
  onDismiss,
}: {
  fixOffer: NonNullable<ChatMessage['fixOffer']>
  onFix: () => void
  onDismiss: () => void
}) {
  return (
    <div style={{
      marginTop: 7, borderRadius: 8, border: '1px solid rgba(244,114,182,0.3)',
      background: 'rgba(244,114,182,0.05)', padding: '9px 11px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6' }}>
        {fixOffer.label}
      </div>
      {fixOffer.error && (
        <pre style={{
          margin: 0, padding: '6px 8px', borderRadius: 6, fontSize: 10,
          fontFamily: 'monospace', lineHeight: 1.5, color: 'var(--ide-text2)',
          background: 'rgba(0,0,0,0.25)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: 90, overflow: 'auto',
        }}>
          {fixOffer.error}
        </pre>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onFix}
          title="Runs a free auto-fix pass — no credits charged"
          style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
        >
          Fix it (free)
        </button>
        <button
          onClick={onDismiss}
          style={{ fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

'use client'
// The anti-runaway surface: self-heal hit the SAME error twice, so instead of
// silently burning more passes, show what's failing and hand the user the
// wheel. Buttons follow the designSuggestion contract — they fill the input,
// never auto-send.

import type { ChatMessage } from '@/store/editor'

export function LoopStopCard({
  loopStop,
  onRetry,
  onDismiss,
}: {
  loopStop: NonNullable<ChatMessage['loopStop']>
  onRetry: (prompt: string) => void
  onDismiss: () => void
}) {
  return (
    <div style={{
      marginTop: 7, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
      background: 'rgba(239,68,68,0.05)', padding: '9px 11px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>
        Auto-fix stopped after {loopStop.attempts} attempt{loopStop.attempts === 1 ? '' : 's'} — same error keeps coming back
      </div>
      <pre style={{
        margin: 0, padding: '6px 8px', borderRadius: 6, fontSize: 10,
        fontFamily: 'monospace', lineHeight: 1.5, color: 'var(--ide-text2)',
        background: 'rgba(0,0,0,0.25)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: 90, overflow: 'auto',
      }}>
        {loopStop.errorSummary}
      </pre>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onRetry(loopStop.retryPrompt)}
          title="Fills the input with a fresh-approach prompt — you still press Send"
          style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
        >
          Try a different approach
        </button>
        <button
          onClick={onDismiss}
          style={{ fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer' }}
        >
          Stop here
        </button>
      </div>
    </div>
  )
}

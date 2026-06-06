'use client'
// Stub component — shows credit cost estimate before generation
export function CreditEstimateBar({ credits, action }: { credits?: number; action?: string }) {
  if (!credits) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      borderRadius: 8,
      background: 'rgba(14,165,233,0.08)',
      border: '1px solid rgba(14,165,233,0.15)',
      fontSize: 12,
      color: '#0EA5E9',
      fontWeight: 600,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#0EA5E9">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
      </svg>
      ~{credits} credit{credits !== 1 ? 's' : ''} {action ? `for ${action}` : ''}
    </div>
  )
}

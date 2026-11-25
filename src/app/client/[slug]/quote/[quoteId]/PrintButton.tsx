'use client'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      Print or save as PDF
    </button>
  )
}

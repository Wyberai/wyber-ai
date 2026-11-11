import type React from 'react'

export const SKY = '#0EA5E9'

export const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0d141e', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e8eef7', outline: 'none', fontFamily: 'inherit',
}
export const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9aa8bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
export const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }
export const ghostBtn: React.CSSProperties = { fontSize: 12, color: '#8797ab', background: 'none', border: '1px solid #1b2a3b', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }
export const primaryBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 9, background: SKY, border: 'none', color: '#03111c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
export const dangerText: React.CSSProperties = { fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }

export function ago(iso: string | null | undefined): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}

/** Sends a tiny JSON request and returns the parsed body with an ok flag. */
export async function api(method: string, url: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, any> }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const res = await fetch(url, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

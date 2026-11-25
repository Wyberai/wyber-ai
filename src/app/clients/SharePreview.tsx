'use client'
import { useState } from 'react'
import { api, ago, ghostBtn, primaryBtn, dangerText } from './ui'
import type { Ctx, Deliverable } from './types'

/**
 * Share a preview: a private link to the latest SAVED version of this project that the client can open without the
 * project being published. Update it whenever you like, switch it off, or make a new link. It never goes public and
 * costs no credits.
 */
export function SharePreview({ ctx, d, onChange }: { ctx: Ctx; d: Deliverable; onChange: (p: Partial<Deliverable>) => void }) {
  const { client, toast, feedbackModes } = ctx
  const can = client._canEdit
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const on = !!(d.preview_enabled && d.preview_token)
  const isMobile = d.projects?.project_type === 'mobile'
  const pinsOn = !!feedbackModes[d.project_id]
  const url = on && typeof window !== 'undefined' ? `${window.location.origin}/preview/${d.preview_token}` : ''
  const mailto = on && client.contact_email
    ? `mailto:${client.contact_email}?subject=${encodeURIComponent(`Preview of ${d.headline || d.projects?.name || 'your project'}`)}&body=${encodeURIComponent(`Hello,\n\nHere is a preview of the latest version. It is a draft, not the final site:\n\n${url}\n\nTell me what you would like changed.`)}`
    : null

  async function run(action: 'create' | 'refresh' | 'off' | 'rotate') {
    if (action === 'rotate' && !confirm('Make a new preview link? The current link stops working straight away, so send the new one to your client.')) return
    setBusy(action); setError('')
    const r = await api('POST', `/api/clients/${client.id}/deliverables/${d.id}/preview`, { action })
    setBusy(null)
    if (!r.ok) { setError(r.data.error ?? 'Something went wrong. Try again.'); return }
    const p = r.data.preview
    onChange(p.enabled ? { preview_enabled: true, preview_token: p.token, preview_built_at: p.built_at } : { preview_enabled: false })
    toast(action === 'off' ? 'Preview link switched off' : action === 'refresh' ? 'Preview updated to your latest saved version' : action === 'rotate' ? 'New preview link ready. The old one no longer works.' : 'Preview link ready. Copy it and send it to your client.')
  }

  const copy = () => navigator.clipboard?.writeText(url).then(() => toast('Preview link copied')).catch(() => toast(url))

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#0d141e', border: '1px solid #14202e', borderRadius: 9 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share a preview</span>
        <span style={{ fontSize: 12, color: on ? '#22c55e' : '#8797ab' }}>{on ? `On${d.preview_built_at ? `, updated ${ago(d.preview_built_at)}` : ''}` : 'Off'}</span>
      </div>

      {!on && (
        <>
          <div style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6 }}>
            Let {client.name} see this before it is live. They get a private link to your latest saved version, separate from the published site. No credits used.
          </div>
          {can && <button type="button" disabled={busy !== null} onClick={() => run('create')} style={{ ...primaryBtn, marginTop: 10, opacity: busy ? 0.6 : 1 }}>{busy === 'create' ? (isMobile ? 'Creating…' : 'Building the preview…') : 'Create preview link'}</button>}
        </>
      )}

      {on && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <code style={{ fontSize: 12, color: '#9aa8bb', background: '#0a1018', border: '1px solid #14202e', borderRadius: 7, padding: '7px 10px', overflowWrap: 'anywhere' }}>{url.replace(/^https?:\/\//, '')}</code>
            <button type="button" onClick={copy} style={ghostBtn}>Copy</button>
            <a href={`/preview/${d.preview_token}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>Open</a>
            {mailto && <a href={mailto} style={{ ...ghostBtn, textDecoration: 'none' }}>Open in my email</a>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {can && !isMobile && <button type="button" disabled={busy !== null} onClick={() => run('refresh')} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy === 'refresh' ? 'Building…' : 'Update to my latest version'}</button>}
            {can && <button type="button" disabled={busy !== null} onClick={() => run('rotate')} style={ghostBtn}>Make a new link</button>}
            {can && <button type="button" disabled={busy !== null} onClick={() => run('off')} style={dangerText}>Turn off</button>}
          </div>
          <div style={{ fontSize: 11, color: '#5d6d82', lineHeight: 1.5 }}>
            {isMobile ? 'Always shows your latest saved version in a phone frame.' : 'Shows the version saved when you last pressed update. Save your changes in the builder first.'}
            {' '}{client.has_passcode ? 'This client\'s page is locked, so the preview only opens in a browser that has entered the passcode.' : 'Anyone with the link can open it. Lock their page with a passcode in Share to restrict it.'}
            {!isMobile && (pinsOn ? ' Your client can drop pins on it.' : ' Switch on pinned comments below if you want them to leave notes on the page itself.')}
          </div>
        </div>
      )}
      {error && <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#F59E0B', lineHeight: 1.5 }}>{error}</div>}
    </div>
  )
}

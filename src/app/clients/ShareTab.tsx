'use client'
import { useState } from 'react'
import { api, ghostBtn, primaryBtn, inputStyle, labelStyle, sectionTitle, dangerText } from './ui'
import type { Ctx } from './types'

export function ShareTab({ ctx }: { ctx: Ctx }) {
  const { client, merge, update, toast, workspaces, removeClient } = ctx
  const can = client._canEdit
  const [code, setCode] = useState('')
  const link = `${typeof window === 'undefined' ? '' : window.location.origin}/client/${client.slug}`
  const copy = () => navigator.clipboard?.writeText(link).then(() => toast('Link copied')).catch(() => toast(link))

  return (
    <fieldset disabled={!can} style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
      <div>
        <div style={sectionTitle}>Their link</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <code style={{ fontSize: 12, color: '#9aa8bb', background: '#0a1018', border: '1px solid #14202e', borderRadius: 7, padding: '7px 10px', overflowWrap: 'anywhere' }}>{link.replace(/^https?:\/\//, '')}</code>
          <button type="button" onClick={copy} style={ghostBtn}>Copy</button>
          <a href={`/client/${client.slug}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>Open as client</a>
          <button type="button" onClick={async () => { if (confirm('Make a new link? The current link stops working straight away, so send the new one to your client.')) await update({ rotateLink: true }, 'New link ready. The old one no longer works.') }} style={ghostBtn}>Make a new link</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input aria-label="Passcode" type="text" value={code} onChange={e => setCode(e.target.value)} placeholder={client.has_passcode ? 'Passcode is on. Type a new one to change it' : 'Optional passcode (4+ characters)'} style={{ ...inputStyle, flex: '1 1 260px' }} autoComplete="off" />
          <button type="button" disabled={code.length < 4} onClick={async () => { if (await update({ passcode: code }, 'Passcode set. Tell your client.')) setCode('') }} style={{ ...primaryBtn, opacity: code.length < 4 ? 0.5 : 1 }}>{client.has_passcode ? 'Change' : 'Set passcode'}</button>
          {client.has_passcode && <button type="button" onClick={() => update({ passcode: null }, 'Passcode removed')} style={ghostBtn}>Remove</button>}
        </div>
      </div>

      <div>
        <div style={sectionTitle}>About the client</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor={`st-${client.id}`}>Status</label>
            <select id={`st-${client.id}`} value={client.status} onChange={e => update({ status: e.target.value })} style={{ ...inputStyle, padding: '10px 12px' }}>
              {['lead', 'active', 'paused', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ fontSize: 11, color: '#5d6d82', marginTop: 4 }}>Only active clients can open their link or get emails.</div>
          </div>
          <div>
            <label style={labelStyle} htmlFor={`bc-${client.id}`}>Brand colour</label>
            <input id={`bc-${client.id}`} aria-label={`Brand colour for ${client.name}`} type="color" value={client.brand_color} onChange={e => merge({ brand_color: e.target.value })} onBlur={e => update({ brandColor: e.target.value })} style={{ width: 56, height: 40, border: '1px solid #2a2a35', borderRadius: 8, background: '#0d141e', cursor: 'pointer' }} />
          </div>
          <div>
            <label style={labelStyle} htmlFor={`lg-${client.id}`}>Logo link</label>
            <input id={`lg-${client.id}`} defaultValue={client.logo_url ?? ''} onBlur={e => e.target.value !== (client.logo_url ?? '') && update({ logoUrl: e.target.value || null })} placeholder="https://…/logo.png" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor={`em-${client.id}`}>Their email</label>
            <input id={`em-${client.id}`} type="email" defaultValue={client.contact_email ?? ''} onBlur={e => e.target.value !== (client.contact_email ?? '') && update({ contactEmail: e.target.value || null })} placeholder="client@company.com" style={inputStyle} />
            <div style={{ fontSize: 11, color: '#5d6d82', marginTop: 4 }}>Used only for emails you choose to send, in your name, with replies to you.</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor={`in-${client.id}`}>Intro text (shown on their page)</label>
            <textarea id={`in-${client.id}`} defaultValue={client.intro_text ?? ''} onBlur={e => e.target.value !== (client.intro_text ?? '') && update({ introText: e.target.value })} rows={2} placeholder="Here's what we've built for you so far." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor={`nt-${client.id}`}>Private notes (only you see these)</label>
            <textarea id={`nt-${client.id}`} defaultValue={client.notes ?? ''} onBlur={e => e.target.value !== (client.notes ?? '') && update({ notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {client._role === 'owner' && workspaces.some(w => w.role !== 'viewer') && (
        <div>
          <div style={sectionTitle}>Share with your team</div>
          <select aria-label="Who can see this client" value={client.org_id ?? ''} onChange={e => update({ orgId: e.target.value || null }, 'Moved')} style={{ ...inputStyle, maxWidth: 320, padding: '8px 12px' }}>
            <option value="">Just me</option>
            {workspaces.filter(w => w.role !== 'viewer').map(w => <option key={w.id} value={w.id}>{w.name} (whole team)</option>)}
          </select>
        </div>
      )}

      {client._canDelete && (
        <button type="button" onClick={async () => {
          if (!confirm('Delete this client? This does not delete their projects.')) return
          const r = await api('DELETE', `/api/clients/${client.id}`)
          if (r.ok) removeClient(); else toast(r.data.error ?? 'Failed to delete', false)
        }} style={{ ...dangerText, alignSelf: 'flex-start' }}>Delete client</button>
      )}
    </fieldset>
  )
}

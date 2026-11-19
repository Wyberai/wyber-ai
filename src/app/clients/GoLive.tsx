'use client'
import { useState } from 'react'
import { dnsRecordFor, dnsInstructionsText } from '@/lib/dns-records'
import { api, ghostBtn, primaryBtn, inputStyle, dangerText } from './ui'
import type { Ctx, Deliverable } from './types'

/**
 * "Go live" for one project: is it published, is the client's domain connected, and what to send the client's IT
 * person. Connecting a domain the client already owns works here; buying a new one opens the editor with the client as
 * the registrant, because whoever is the registrant legally owns the domain.
 */
export function GoLive({ ctx, d, onChange }: { ctx: Ctx; d: Deliverable; onChange: (p: Partial<NonNullable<Deliverable['projects']>>) => void }) {
  const { client, toast } = ctx
  const can = client._canEdit
  const p = d.projects
  const liveUrl = p?.published_url || p?.deployed_url || null
  const domain = p?.custom_domain ?? null
  const verified = !!p?.custom_domain_verified
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  if (!p) return null

  const record = domain ? dnsRecordFor(domain) : null
  const message = domain ? dnsInstructionsText(domain) : ''
  const mailto = client.contact_email && domain
    ? `mailto:${client.contact_email}?subject=${encodeURIComponent(`DNS change to put ${domain} live`)}&body=${encodeURIComponent(message)}`
    : null

  async function connect() {
    const dom = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!dom || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(dom)) { setNote('Type the domain like example.com'); return }
    setBusy(true); setNote('')
    const r = await api('POST', '/api/custom-domain', { projectId: d.project_id, domain: dom })
    setBusy(false)
    if (!r.ok) { setNote(r.data.error ?? 'Could not connect that domain'); return }
    onChange({ custom_domain: dom, custom_domain_verified: false })
    setInput('')
    toast('Domain saved. Send the DNS record to your client, then verify.')
  }

  async function verify() {
    if (!domain) return
    setBusy(true); setNote('')
    const r = await api('POST', '/api/custom-domain', { projectId: d.project_id, domain, action: 'verify' })
    setBusy(false)
    if (r.ok && r.data.verified) { onChange({ custom_domain_verified: true }); toast(`${domain} is live.`); return }
    setNote(r.data.error ?? 'Not pointing at us yet. DNS can take up to 24 hours after the change.')
  }

  async function remove() {
    if (!confirm(`Disconnect ${domain}? The site goes back to its WyberAi address.`)) return
    const r = await api('DELETE', '/api/custom-domain', { projectId: d.project_id })
    if (r.ok) { onChange({ custom_domain: null, custom_domain_verified: false }); toast('Domain disconnected') } else toast(r.data.error ?? 'Could not disconnect', false)
  }

  function buyForClient() {
    const parts = (client.contact_name || '').trim().split(/\s+/)
    const contact = { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' '), email: client.contact_email ?? '' }
    try { sessionStorage.setItem(`wyber_domain_handoff_${d.project_id}`, JSON.stringify({ contact })) } catch { /* storage blocked: the editor opens without the client's details */ }
    window.location.assign(`/project/${d.project_id}`)
  }

  const step = (ok: boolean, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: ok ? '#22c55e' : '#8797ab' }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#22c55e' : '#2a3a4d' }} />{label}
    </span>
  )

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#0d141e', border: '1px solid #14202e', borderRadius: 9 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Go live</span>
        {step(true, 'Built')}
        {step(!!liveUrl, liveUrl ? 'Published' : 'Not published yet')}
        {step(verified, domain ? (verified ? domain : `${domain} (waiting for DNS)`) : 'No custom domain')}
      </div>

      {!liveUrl && <div style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6 }}>Publish it from the builder (the Publish button) to get a live link. Then connect the client's domain here.</div>}

      {liveUrl && !domain && can && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6 }}>
            <strong style={{ color: '#e8eef7' }}>Already own a domain?</strong> Type it and we give you the DNS record to send your client.{' '}
            <strong style={{ color: '#e8eef7' }}>Need one?</strong> Buy it in your client's name, so they legally own it.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input aria-label="Client's domain" value={input} onChange={e => setInput(e.target.value)} placeholder="clientsite.com" style={{ ...inputStyle, flex: '1 1 200px', padding: '8px 12px' }} />
            <button type="button" disabled={busy || !input.trim()} onClick={connect} style={{ ...primaryBtn, opacity: busy || !input.trim() ? 0.5 : 1 }}>Connect domain</button>
            <button type="button" onClick={buyForClient} style={ghostBtn}>Buy a domain for {client.name}…</button>
          </div>
          <div style={{ fontSize: 11, color: '#5d6d82' }}>Connecting your own domain needs a paid plan. A domain bought through WyberAi works on any plan and is billed to you, so add it to the quote.</div>
        </div>
      )}

      {domain && record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {!verified && (
            <div style={{ fontSize: 13, color: '#c7d1de', lineHeight: 1.7 }}>
              Ask whoever manages <strong>{domain}</strong> to add this record: <code style={{ background: '#0a1018', padding: '2px 6px', borderRadius: 5 }}>{record.type}</code> name <code style={{ background: '#0a1018', padding: '2px 6px', borderRadius: 5 }}>{record.name}</code> value <code style={{ background: '#0a1018', padding: '2px 6px', borderRadius: 5 }}>{record.value}</code>. Existing email records stay as they are.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!verified && can && <button type="button" disabled={busy} onClick={verify} style={primaryBtn}>{busy ? 'Checking…' : 'Verify DNS'}</button>}
            {!verified && <button type="button" onClick={() => navigator.clipboard?.writeText(message).then(() => toast('Instructions copied. Paste them into an email to your client.')).catch(() => toast(message))} style={ghostBtn}>Copy instructions for the client</button>}
            {!verified && mailto && <a href={mailto} style={{ ...ghostBtn, textDecoration: 'none' }}>Open in my email</a>}
            {verified && <a href={`https://${domain}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>Open {domain}</a>}
            {can && <button type="button" onClick={remove} style={dangerText}>Disconnect</button>}
          </div>
        </div>
      )}
      {note && <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#F59E0B', lineHeight: 1.5 }}>{note}</div>}
    </div>
  )
}

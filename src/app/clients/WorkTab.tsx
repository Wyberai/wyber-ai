'use client'
import { useState } from 'react'
import { buildFixPrompt, type OpenFeedback } from '@/lib/agency/feedback-prompt'
import { api, ago, ghostBtn, primaryBtn, inputStyle, sectionTitle, dangerText } from './ui'
import { GoLive } from './GoLive'
import { SharePreview } from './SharePreview'
import type { Ctx, Deliverable, Review } from './types'

const REVIEW: Record<Review, { text: string; color: string }> = {
  pending: { text: 'Not reviewed', color: '#8797ab' },
  approved: { text: 'Approved', color: '#22c55e' },
  changes_requested: { text: 'Changes requested', color: '#F59E0B' },
}

/** Opens the builder for a project with the drafted prompt waiting in the chat box. It is never sent for you. */
function openInBuilder(projectId: string, prompt?: string) {
  try { if (prompt) sessionStorage.setItem(`wyber_draft_${projectId}`, prompt) } catch { /* storage blocked: open the builder without it */ }
  window.location.assign(`/project/${projectId}`)
}

export function WorkTab({ ctx }: { ctx: Ctx }) {
  const { client, merge, toast, pins, setPins, feedbackModes, setFeedbackModes, projects } = ctx
  const can = client._canEdit
  const dels = [...client.client_deliverables].sort((a, b) => a.sort_order - b.sort_order)
  const [pick, setPick] = useState('')
  const [copyFrom, setCopyFrom] = useState('')
  const [copying, setCopying] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [emailUpdate, setEmailUpdate] = useState(false)
  const [handing, setHanding] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [emailDelivered, setEmailDelivered] = useState(false)
  const hasEmail = !!client.contact_email
  const attached = new Set(dels.map(d => d.project_id))
  const pickable = projects.filter(p => !attached.has(p.id) && (!client.org_id || p.org_id === client.org_id || !p.org_id))

  const setDel = (id: string, p: Partial<Deliverable>) => merge({ client_deliverables: client.client_deliverables.map(d => (d.id === id ? { ...d, ...p } : d)) })

  async function patchDel(id: string, body: Record<string, unknown>, local?: Partial<Deliverable>) {
    if (local) setDel(id, local)
    const r = await api('PATCH', `/api/clients/${client.id}/deliverables/${id}`, body)
    if (!r.ok) toast(r.data.error ?? 'Could not save', false)
    return r
  }

  async function attach() {
    if (!pick) return
    const r = await api('POST', `/api/clients/${client.id}/deliverables`, { projectId: pick })
    if (!r.ok) { toast(r.data.error ?? 'Could not attach', false); return }
    const project = projects.find(p => p.id === pick) ?? null
    merge({ client_deliverables: [...client.client_deliverables, { review_status: 'pending', reviewed_at: null, delivered_at: null, handover_note: null, ...r.data.deliverable, projects: project }] })
    setPick('')
  }

  // Start from a copy of a past job (a salon site you already built, say): copy it, attach the copy, open it.
  async function copyAndAttach() {
    if (!copyFrom || copying) return
    setCopying(true)
    const dup = await api('POST', '/api/projects/duplicate', { projectId: copyFrom, orgId: client.org_id ?? undefined })
    if (!dup.ok || !dup.data.project?.id) { setCopying(false); toast(dup.data.error ?? 'Could not copy that project', false); return }
    const att = await api('POST', `/api/clients/${client.id}/deliverables`, { projectId: dup.data.project.id })
    if (!att.ok) { setCopying(false); toast(att.data.error ?? 'Copied, but could not attach it', false); return }
    window.location.assign(`/project/${dup.data.project.id}`)
  }

  async function remove(id: string) {
    merge({ client_deliverables: client.client_deliverables.filter(d => d.id !== id) })
    await api('DELETE', `/api/clients/${client.id}/deliverables/${id}`)
  }

  async function markDone(kind: 'client' | 'pin', id: string) {
    if (kind === 'client') {
      const r = await api('PATCH', `/api/clients/${client.id}/feedback/${id}`, { resolved: true })
      if (!r.ok) { toast(r.data.error ?? 'Could not save', false); return }
      merge({ client_feedback: client.client_feedback.map(f => (f.id === id ? { ...f, resolved: true } : f)) })
    } else {
      const r = await api('PATCH', '/api/preview-comments', { id, resolved: true })
      if (!r.ok) { toast(r.data.error ?? 'Could not save', false); return }
      setPins(p => p.filter(x => x.id !== id))
    }
  }

  async function togglePins(projectId: string, on: boolean) {
    const r = await api('POST', '/api/preview-comments/toggle', { projectId, enabled: on })
    if (!r.ok) { toast(r.data.error ?? 'Could not change that', false); return }
    setFeedbackModes(m => ({ ...m, [projectId]: on }))
    toast(on ? 'Pinned comments are on. Publish again so your client can use them on the live site.' : 'Pinned comments are off. Publish again to remove them from the live site.')
  }

  async function postUpdate() {
    const body = updateText.trim()
    if (!body) return
    const r = await api('POST', `/api/clients/${client.id}/updates`, { body, emailClient: emailUpdate })
    if (!r.ok) { toast(r.data.error ?? 'Could not post', false); return }
    merge({ client_updates: [{ ...r.data.update, emailed_at: r.data.email?.sent ? new Date().toISOString() : null }, ...client.client_updates] })
    setUpdateText('')
    const e = r.data.email
    toast(e?.sent ? 'Posted, and emailed to your client' : e ? `Posted. Not emailed: ${e.reason === 'no_email' ? 'no email saved for this client' : e.reason === 'inactive' ? 'their link is off' : e.reason === 'rate_limited' ? 'too many emails this hour' : 'the email failed'}` : 'Update posted to their page')
  }

  async function deliver(d: Deliverable) {
    const r = await patchDel(d.id, { delivered: true, handoverNote: note, emailClient: emailDelivered }, undefined)
    if (!r.ok) return
    setDel(d.id, { delivered_at: r.data.deliverable.delivered_at, handover_note: r.data.deliverable.handover_note })
    setHanding(null); setNote(''); setEmailDelivered(false)
    toast(r.data.email?.sent ? 'Marked delivered, and emailed to your client' : 'Marked delivered')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={sectionTitle}>Projects they can review</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dels.length === 0 && <div style={{ fontSize: 13, color: '#8797ab' }}>Nothing attached yet. Attach a project below, or build one from their brief.</div>}
          {dels.map(d => {
            const st = REVIEW[d.review_status ?? 'pending']
            const name = d.projects?.name ?? 'Unknown project'
            const openClient = client.client_feedback.filter(f => f.deliverable_id === d.id && f.kind === 'changes_requested' && !f.resolved)
            const openPins = pins.filter(p => p.project_id === d.project_id)
            const history = client.client_feedback.filter(f => f.deliverable_id === d.id).sort((a, b) => a.created_at.localeCompare(b.created_at))
            const open: OpenFeedback[] = [
              ...openClient.map(f => ({ source: 'client' as const, project: d.headline || name, author: f.author_name, text: f.body ?? '' })),
              ...openPins.map(p => ({ source: 'pin' as const, project: d.headline || name, author: p.author_name, text: p.body, page: p.page_path })),
            ]
            const liveUrl = d.projects?.custom_domain ? `https://${d.projects.custom_domain}` : d.projects?.published_url || d.projects?.deployed_url || null
            return (
              <div key={d.id} style={{ background: '#0a1018', border: '1px solid #14202e', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eef7' }}>
                      {name}
                      <span style={{ fontSize: 12, fontWeight: 700, color: st.color, marginLeft: 8 }}>{st.text}</span>
                      {d.delivered_at && <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginLeft: 8 }}>Delivered</span>}
                    </div>
                    <input aria-label={`Custom headline for ${name}`} defaultValue={d.headline ?? ''} disabled={!can} onBlur={e => e.target.value !== (d.headline ?? '') && patchDel(d.id, { headline: e.target.value }, { headline: e.target.value })} placeholder="Custom headline (optional)" style={{ ...inputStyle, marginTop: 6, padding: '6px 10px', fontSize: 13 }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8797ab', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" disabled={!can} checked={d.is_visible} onChange={e => patchDel(d.id, { isVisible: e.target.checked }, { is_visible: e.target.checked })} /> Visible
                  </label>
                  {can && <button type="button" aria-label={`Remove ${name}`} onClick={() => remove(d.id)} style={dangerText}>Remove</button>}
                </div>

                {open.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#0d141e', border: '1px solid #F59E0B33', borderRadius: 9 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>{open.length} thing{open.length !== 1 ? 's' : ''} to fix</div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {openClient.map(f => (
                        <li key={f.id} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c7d1de', lineHeight: 1.5 }}>
                          <span style={{ flex: 1 }}><strong style={{ color: '#e8eef7' }}>{f.author_name || 'Client'}</strong> · {ago(f.created_at)}<br />{f.body}</span>
                          {can && <button type="button" onClick={() => openInBuilder(d.project_id, buildFixPrompt([{ source: 'client', project: d.headline || name, author: f.author_name, text: f.body ?? '' }], { clientName: client.name }))} style={ghostBtn}>Fix this</button>}
                          {can && <button type="button" onClick={() => markDone('client', f.id)} style={ghostBtn}>Done</button>}
                        </li>
                      ))}
                      {openPins.map(p => (
                        <li key={p.id} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c7d1de', lineHeight: 1.5 }}>
                          <span style={{ flex: 1 }}><strong style={{ color: '#e8eef7' }}>{p.author_name || 'Reviewer'}</strong> pinned on {p.page_path} · {ago(p.created_at)}<br />{p.body}</span>
                          {can && <button type="button" onClick={() => openInBuilder(d.project_id, buildFixPrompt([{ source: 'pin', project: d.headline || name, author: p.author_name, text: p.body, page: p.page_path }], { clientName: client.name }))} style={ghostBtn}>Fix this</button>}
                          {can && <button type="button" onClick={() => markDone('pin', p.id)} style={ghostBtn}>Done</button>}
                        </li>
                      ))}
                    </ul>
                    {can && <button type="button" onClick={() => openInBuilder(d.project_id, buildFixPrompt(open, { clientName: client.name }))} style={{ ...primaryBtn, marginTop: 10 }}>Fix all {open.length} with AI</button>}
                    <div style={{ fontSize: 11, color: '#5d6d82', marginTop: 6 }}>Opens the builder with the changes written out. Nothing is sent until you press send, so no credits are used yet.</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                  <button type="button" onClick={() => openInBuilder(d.project_id)} style={ghostBtn}>Open in builder</button>
                  {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>View live</a>}
                  {can && d.review_status && d.review_status !== 'pending' && !d.delivered_at && openClient.length === 0 && (
                    <button type="button" onClick={() => patchDel(d.id, { reviewStatus: 'pending' }, { review_status: 'pending' })} style={ghostBtn}>Ask for review again</button>
                  )}
                  {can && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8797ab' }} title="Lets your client drop pins on the live site. Takes effect the next time you publish.">
                      <input type="checkbox" checked={!!feedbackModes[d.project_id]} onChange={e => togglePins(d.project_id, e.target.checked)} /> Pinned comments on live site
                    </label>
                  )}
                  {can && !d.delivered_at && handing !== d.id && (
                    <button type="button" onClick={() => { setHanding(d.id); setNote(d.handover_note ?? '') }} style={d.review_status === 'approved' ? { ...primaryBtn, padding: '6px 12px', fontSize: 12 } : ghostBtn}>Hand over…</button>
                  )}
                  {can && d.delivered_at && (
                    <button type="button" onClick={() => patchDel(d.id, { delivered: false }, { delivered_at: null })} style={ghostBtn}>Undo delivered</button>
                  )}
                </div>

                <SharePreview ctx={ctx} d={d} onChange={p => setDel(d.id, p)} />

                <GoLive ctx={ctx} d={d} onChange={p => setDel(d.id, { projects: d.projects ? { ...d.projects, ...p } : d.projects })} />

                {handing === d.id && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea aria-label="Handover notes for the client" rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder={'What they need to know to own it:\n- Where the code is (repo link or zip)\n- Their domain and where it points\n- Logins you are handing over\n- How to make a small change'} style={{ ...inputStyle, resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a href={`/api/export?project_id=${d.project_id}&format=zip`} style={{ ...ghostBtn, textDecoration: 'none' }}>Download the code (zip)</a>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: hasEmail ? '#8797ab' : '#5d6d82' }}>
                        <input type="checkbox" disabled={!hasEmail} checked={emailDelivered && hasEmail} onChange={e => setEmailDelivered(e.target.checked)} /> Email the client{hasEmail ? '' : ' (add their email in Share first)'}
                      </label>
                      <span style={{ flex: 1 }} />
                      <button type="button" onClick={() => setHanding(null)} style={ghostBtn}>Cancel</button>
                      <button type="button" onClick={() => deliver(d)} style={primaryBtn}>Mark delivered</button>
                    </div>
                  </div>
                )}
                {d.delivered_at && d.handover_note && handing !== d.id && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#8797ab', whiteSpace: 'pre-wrap' }}>Handover note: {d.handover_note}</div>
                )}

                {history.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: '10px 0 0', borderTop: '1px solid #14202e', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {history.map(f => (
                      <li key={f.id} style={{ fontSize: 12, color: '#9aa8bb', lineHeight: 1.5 }}>
                        <strong style={{ color: '#e8eef7' }}>{f.author_name || 'Client'}</strong> {f.kind === 'approved' ? 'approved' : f.kind === 'changes_requested' ? 'asked for changes' : 'commented'} · {ago(f.created_at)}
                        {f.kind === 'changes_requested' && f.resolved && <span style={{ color: '#22c55e' }}> · done</span>}
                        {f.body && <div style={{ color: '#c7d1de' }}>{f.body}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
        {can && pickable.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select aria-label="Attach a project" value={pick} onChange={e => setPick(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }}>
              <option value="">Attach a project…</option>
              {pickable.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={attach} disabled={!pick} style={{ ...primaryBtn, opacity: pick ? 1 : 0.5 }}>Attach</button>
          </div>
        )}
        {can && projects.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select aria-label="Start from a copy of an earlier project" value={copyFrom} onChange={e => setCopyFrom(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }}>
              <option value="">Start from a copy of an earlier project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={copyAndAttach} disabled={!copyFrom || copying} style={{ ...ghostBtn, opacity: copyFrom ? 1 : 0.5 }}>{copying ? 'Copying…' : 'Copy and attach'}</button>
          </div>
        )}
      </div>

      <div>
        <div style={sectionTitle}>Updates on their page</div>
        {can && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea aria-label="Write an update for the client" rows={2} maxLength={1000} value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="Booking flow is live on staging. Have a look and tell us what you think." style={{ ...inputStyle, flex: 1, resize: 'vertical' }} />
              <button onClick={postUpdate} disabled={!updateText.trim()} style={{ ...primaryBtn, alignSelf: 'flex-start', opacity: updateText.trim() ? 1 : 0.5 }}>Post</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: hasEmail ? '#8797ab' : '#5d6d82', marginTop: 8 }}>
              <input type="checkbox" disabled={!hasEmail} checked={emailUpdate && hasEmail} onChange={e => setEmailUpdate(e.target.checked)} /> Also email it to {hasEmail ? client.contact_email : 'the client (add their email in Share first)'}
            </label>
          </>
        )}
        {client.client_updates.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...client.client_updates].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(u => (
              <li key={u.id} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c7d1de', lineHeight: 1.55 }}>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{u.body} <span style={{ color: '#5d6d82', fontSize: 12 }}>· {ago(u.created_at)}{u.emailed_at ? ' · emailed' : ''}</span></span>
                {can && <button type="button" aria-label="Delete this update" onClick={async () => { merge({ client_updates: client.client_updates.filter(x => x.id !== u.id) }); await api('DELETE', `/api/clients/${client.id}/updates/${u.id}`) }} style={{ ...dangerText, padding: '2px 6px' }}>Delete</button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {client.client_feedback.length > 0 && (
        <div>
          <a href={`/api/clients/${client.id}/approvals`} style={{ ...ghostBtn, textDecoration: 'none', display: 'inline-block' }}>Download approval log (CSV)</a>
          <span style={{ fontSize: 12, color: '#5d6d82', marginLeft: 10 }}>Who approved what, and when. Good to keep with an invoice.</span>
        </div>
      )}
    </div>
  )
}

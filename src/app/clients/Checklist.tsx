'use client'
import { useEffect, useState } from 'react'
import { ghostBtn, primaryBtn } from './ui'
import type { ClientRow } from './types'

const KEY = 'wyber-agency-checklist-dismissed'

export interface Step { id: string; title: string; hint: string; done: boolean; action?: { label: string; run: () => void } }

/** What has happened so far, read from the data itself, so it can never drift from reality. */
export function checklistSteps(clients: ClientRow[], hasBusiness: boolean, run: { business: () => void; newClient: () => void }): Step[] {
  const any = (f: (c: ClientRow) => boolean) => clients.some(f)
  return [
    { id: 'biz', title: 'Add your business details', hint: 'Your name and logo go on your clients\' pages, quotes and emails.', done: hasBusiness, action: { label: 'Add details', run: run.business } },
    { id: 'client', title: 'Add your first client', hint: 'One client per job.', done: clients.length > 0, action: { label: 'Add a client', run: run.newClient } },
    { id: 'start', title: 'Get their brief, or attach a project', hint: 'Send the intake link so they answer ten questions, then build from it.', done: any(c => !!c.brief_submitted_at || c.client_deliverables.length > 0) },
    { id: 'publish', title: 'Build it and publish', hint: 'Use the builder, then press Publish.', done: any(c => c.client_deliverables.some(d => !!(d.projects?.published_url || d.projects?.deployed_url))) },
    { id: 'domain', title: 'Connect the client\'s domain', hint: 'Their own, or buy one in their name. We write the DNS note for their IT person.', done: any(c => c.client_deliverables.some(d => !!d.projects?.custom_domain_verified)) },
    { id: 'review', title: 'Get their approval', hint: 'Share their link. They approve or ask for changes; Fix with AI turns requests into edits.', done: any(c => c.client_deliverables.some(d => d.review_status === 'approved')) },
    { id: 'quote', title: 'Send a quote', hint: 'They accept it with their name. You mark it paid.', done: any(c => c.client_quotes.some(q => q.status !== 'draft')) },
    { id: 'handover', title: 'Hand it over', hint: 'Notes, code, and the delivered state.', done: any(c => c.client_deliverables.some(d => !!d.delivered_at)) },
  ]
}

export function Checklist({ steps, force }: { steps: Step[]; force: boolean }) {
  const [hidden, setHidden] = useState(true)
  useEffect(() => { try { setHidden(localStorage.getItem(KEY) === '1' && !force) } catch { setHidden(false) } }, [force])
  const done = steps.filter(s => s.done).length
  if (hidden || done === steps.length) return null
  const next = steps.find(s => !s.done)

  return (
    <section aria-label="Getting started" style={{ background: '#0d141e', border: '1px solid #0EA5E933', borderRadius: 14, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Your first client job <span style={{ color: '#8797ab', fontWeight: 500, fontSize: 13 }}>· {done} of {steps.length}</span></div>
        <button type="button" onClick={() => { try { localStorage.setItem(KEY, '1') } catch { /* private window */ } setHidden(true) }} style={{ ...ghostBtn, border: 'none' }}>Hide</button>
      </div>
      <div aria-hidden style={{ height: 4, background: '#14202e', borderRadius: 2, margin: '10px 0 14px' }}><div style={{ height: 4, width: `${(done / steps.length) * 100}%`, background: '#0EA5E9', borderRadius: 2 }} /></div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
        {steps.map(s => (
          <li key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: s.done ? 0.6 : 1 }}>
            <span aria-hidden style={{ marginTop: 3, width: 14, height: 14, borderRadius: '50%', border: `2px solid ${s.done ? '#22c55e' : s === next ? '#0EA5E9' : '#2a3a4d'}`, background: s.done ? '#22c55e' : 'transparent', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eef7', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}{s.done && <span className="sr-only"> (done)</span>}</div>
              {!s.done && <div style={{ fontSize: 12, color: '#8797ab', lineHeight: 1.5, marginTop: 2 }}>{s.hint}</div>}
              {!s.done && s === next && s.action && <button type="button" onClick={s.action.run} style={{ ...primaryBtn, marginTop: 6, padding: '5px 12px', fontSize: 12 }}>{s.action.label}</button>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

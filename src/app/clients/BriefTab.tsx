'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QUESTIONS, briefToPrompt, buildTypeFor } from '@/lib/agency/brief'
import { api, ago, ghostBtn, primaryBtn, sectionTitle, dangerText } from './ui'
import type { Ctx } from './types'

export function BriefTab({ ctx }: { ctx: Ctx }) {
  const { client, merge, toast } = ctx
  const can = client._canEdit
  const [busy, setBusy] = useState(false)
  const link = client.brief_token ? `${typeof window === 'undefined' ? '' : window.location.origin}/brief/${client.brief_token}` : ''
  const answers = client.brief

  async function createLink(replace: boolean, emailIt = false) {
    if (replace && !confirm('Make a new intake link? The old one stops working and the answers received so far are cleared.')) return
    const r = await api('POST', `/api/clients/${client.id}/brief`, { emailClient: emailIt })
    if (!r.ok) { toast(r.data.error ?? 'Could not make the link', false); return }
    merge({ brief_token: r.data.brief_token, brief: null, brief_submitted_at: null })
    toast(r.data.email?.sent ? 'Intake link ready, and emailed to your client.' : 'Intake link ready. Send it to your client.')
  }

  async function resend() {
    const r = await api('POST', `/api/clients/${client.id}/brief`, { resend: true })
    const e = r.data.email
    toast(r.ok && e?.sent ? `Emailed to ${client.contact_email}` : e ? `Not emailed: ${e.reason === 'no_email' ? 'no email saved for this client' : e.reason === 'rate_limited' ? 'too many emails right now' : 'the email failed'}` : r.data.error ?? 'Could not email it', !!(r.ok && e?.sent))
  }

  async function turnOff() {
    const r = await api('DELETE', `/api/clients/${client.id}/brief`)
    if (r.ok) { merge({ brief_token: null }); toast('Intake link turned off') } else toast(r.data.error ?? 'Could not turn it off', false)
  }

  async function buildFromBrief() {
    if (!answers || busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in again to build.')
      const type = buildTypeFor(answers)
      const prompt = briefToPrompt(client.name, answers)
      const name = (answers.business || client.name).slice(0, 60)
      const framework = type === 'mobile' ? 'react-native' : 'react-vite'
      let projectId: string
      if (client.org_id) {
        // The client lives in a workspace, so the project does too: teammates can open, publish and hand it over.
        const r = await api('POST', `/api/orgs/${client.org_id}/projects`, { name, framework, projectType: type, initialPrompt: prompt })
        if (!r.ok || !r.data.project?.id) throw new Error(r.data.error ?? 'Could not create the project in the workspace')
        projectId = r.data.project.id as string
      } else {
        const { data, error } = await supabase.from('projects')
          .insert({ name, framework, user_id: user.id, initial_prompt: prompt, project_type: type })
          .select('id')
        if (error || !data?.[0]?.id) throw error ?? new Error('Could not create the project')
        projectId = data[0].id as string
      }
      // Attach it to this client straight away, so it is on their page the moment it is ready.
      await api('POST', `/api/clients/${client.id}/deliverables`, { projectId })
      try { sessionStorage.setItem(`wyber_prompt_${projectId}`, prompt) } catch { /* the builder opens with the prompt in the project instead */ }
      window.location.assign(`/project/${projectId}?type=${type}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not start the build', false)
      setBusy(false)
    }
  }

  const copy = (text: string, msg: string) => navigator.clipboard?.writeText(text).then(() => toast(msg)).catch(() => toast(text))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionTitle}>Intake link</div>
        {!client.brief_token ? (
          <>
            <p style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6, margin: '0 0 10px', maxWidth: 560 }}>Skip the first call. Send your client a link with ten short questions. Their answers land here, and one click turns them into the first build.</p>
            {can && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" onClick={() => createLink(false)} style={primaryBtn}>Create intake link</button>
                {client.contact_email && <button type="button" onClick={() => createLink(false, true)} style={ghostBtn}>Create and email it to {client.contact_email}</button>}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <code style={{ fontSize: 12, color: '#9aa8bb', background: '#0a1018', border: '1px solid #14202e', borderRadius: 7, padding: '7px 10px', overflowWrap: 'anywhere' }}>{link.replace(/^https?:\/\//, '')}</code>
            <button type="button" onClick={() => copy(link, 'Intake link copied')} style={ghostBtn}>Copy</button>
            {can && client.contact_email && <button type="button" onClick={resend} style={ghostBtn}>Email it to the client</button>}
            <a href={link} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>Open</a>
            {can && <button type="button" onClick={() => createLink(true)} style={ghostBtn}>Make a new link</button>}
            {can && <button type="button" onClick={turnOff} style={dangerText}>Turn off</button>}
          </div>
        )}
      </div>

      {client.brief_token && !answers && <div style={{ fontSize: 13, color: '#8797ab' }}>Waiting for your client to fill it in. You will get an email when they do.</div>}

      {answers && (
        <div>
          <div style={sectionTitle}>Their brief{client.brief_submitted_at ? ` · received ${ago(client.brief_submitted_at)}` : ''}</div>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUESTIONS.filter(q => answers[q.id]).map(q => (
              <div key={q.id}>
                <dt style={{ fontSize: 12, color: '#8797ab' }}>{q.label}</dt>
                <dd style={{ margin: '2px 0 0', fontSize: 14, color: '#e8eef7', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{answers[q.id]}</dd>
              </div>
            ))}
          </dl>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {can && <button type="button" disabled={busy} onClick={buildFromBrief} style={primaryBtn}>{busy ? 'Starting…' : 'Build from this brief'}</button>}
            <button type="button" onClick={() => copy(briefToPrompt(client.name, answers), 'Build prompt copied')} style={ghostBtn}>Copy as a build prompt</button>
          </div>
          <div style={{ fontSize: 11, color: '#5d6d82', marginTop: 8 }}>Starting a build uses credits, like any build. It is added to this client automatically.</div>
        </div>
      )}
    </div>
  )
}

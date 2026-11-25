'use client'
import { useState } from 'react'
import { api, primaryBtn, ghostBtn, inputStyle, labelStyle, SKY } from './ui'
import type { Workspace } from './types'
import type { AgencyProfile } from '@/lib/agency/profile'

// Guided setup for an agency, three short steps, each saved as it goes through the same endpoints the rest of Clients
// already uses (so the same access rules apply, and nothing here can reach another tenant's data):
//   1. Your business    -> PUT  /api/agency/profile          (name, contact; shown on client pages, quotes and emails)
//   2. Just you or team -> POST /api/orgs                    (a workspace, only if there is a team)
//   3. Your first client -> POST /api/clients                (handed back to the page, which opens its brief)
// Any step can be left and finished later from "Your business", "Team" and "+ New client".

const EMPTY: AgencyProfile = {
  business_name: null, logo_url: null, website: null, support_email: null, phone: null, address: null, tax_label: null, tax_id: null,
  default_currency: null, default_payment_instructions: null, default_terms: null,
}

export function AgencySetup({ onProfile, onWorkspace, onCreateClient, onClose }: {
  onProfile: (p: AgencyProfile) => void
  onWorkspace: (w: Workspace) => void
  /** Creates the client the same way "+ New client" does and opens its brief. Resolves true when it worked. */
  onCreateClient: (name: string, orgId?: string) => Promise<boolean>
  onClose: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [team, setTeam] = useState<'solo' | 'team'>('solo')
  const [teamName, setTeamName] = useState('')
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  const [clientName, setClientName] = useState('')

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault()
    if (!business.trim()) return setError('Add your business name. Your clients see it on their page.')
    setBusy(true); setError('')
    const profile: AgencyProfile = { ...EMPTY, business_name: business.trim(), support_email: email.trim() || null, website: website.trim() || null }
    const r = await api('PUT', '/api/agency/profile', { profile })
    setBusy(false)
    if (!r.ok) return setError(r.data.error ?? 'Could not save. Try again.')
    onProfile(profile); setStep(2)
  }

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (team === 'solo') return setStep(3)
    const name = teamName.trim() || business.trim()
    if (!name) return setError('Give the team a name.')
    setBusy(true)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'studio'
    const r = await api('POST', '/api/orgs', { name, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` })
    setBusy(false)
    if (!r.ok) return setError(r.data.error ?? 'Could not create the team.')
    const w: Workspace = { id: r.data.organization.id, name: r.data.organization.name, slug: r.data.organization.slug, role: 'owner' }
    onWorkspace(w); setOrgId(w.id); setStep(3)
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) return setError('Add your client\'s name, or skip this for now.')
    setBusy(true); setError('')
    const ok = await onCreateClient(clientName.trim(), orgId)
    setBusy(false)
    if (ok) onClose()
    else setError('Could not add the client. Try again.')
  }

  const dots = (
    <div aria-hidden style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
      {[1, 2, 3].map(n => <span key={n} style={{ height: 4, width: 36, borderRadius: 2, background: n <= step ? SKY : '#1b2a3b' }} />)}
    </div>
  )

  return (
    <section aria-label="Set up your agency" style={{ background: '#0d141e', border: '1px solid #0EA5E933', borderRadius: 16, padding: 24, margin: '8px 0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 8px' }}>Set up your agency</h2>
        <button type="button" onClick={onClose} style={{ ...ghostBtn, border: 'none' }}>Finish later</button>
      </div>
      {dots}

      {step === 1 && (
        <form onSubmit={saveBusiness} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
          <p style={{ margin: 0, color: '#9aa8bb', fontSize: 14, lineHeight: 1.6 }}>Step 1 of 3. Your business name and contact go on your clients&apos; pages, quotes and emails, in place of WyberAi.</p>
          <div><label style={labelStyle} htmlFor="as-name">Business name</label><input id="as-name" autoFocus value={business} onChange={e => setBusiness(e.target.value)} style={inputStyle} placeholder="Studio Rao" /></div>
          <div><label style={labelStyle} htmlFor="as-email">Contact email (optional)</label><input id="as-email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="hello@studiorao.com" /></div>
          <div><label style={labelStyle} htmlFor="as-web">Website (optional)</label><input id="as-web" value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} placeholder="studiorao.com" /></div>
          {error && <div role="alert" style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
          <div><button type="submit" disabled={busy} style={{ ...primaryBtn, padding: '10px 22px' }}>{busy ? 'Saving' : 'Save and continue'}</button></div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={saveTeam} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
          <p style={{ margin: 0, color: '#9aa8bb', fontSize: 14, lineHeight: 1.6 }}>Step 2 of 3. Do you work alone, or with a team? A team shares clients and projects in one private workspace. People outside it see nothing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([['solo', 'Just me'], ['team', 'With a team']] as const).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={team === k} onClick={() => setTeam(k)} style={{ ...ghostBtn, padding: '12px 14px', fontSize: 14, color: team === k ? '#03111c' : '#c3cedc', background: team === k ? SKY : 'transparent', borderColor: team === k ? SKY : '#1b2a3b', fontWeight: 700 }}>{label}</button>
            ))}
          </div>
          {team === 'team' && <div><label style={labelStyle} htmlFor="as-team">Team name</label><input id="as-team" value={teamName} onChange={e => setTeamName(e.target.value)} style={inputStyle} placeholder={business || 'Studio Rao'} /></div>}
          {error && <div role="alert" style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={busy} style={{ ...primaryBtn, padding: '10px 22px' }}>{busy ? 'Saving' : 'Continue'}</button>
            <button type="button" onClick={() => setStep(1)} style={ghostBtn}>Back</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={saveClient} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
          <p style={{ margin: 0, color: '#9aa8bb', fontSize: 14, lineHeight: 1.6 }}>Step 3 of 3. Add your first client. You&apos;ll get their intake link next, so they can send you their brief.</p>
          <div><label style={labelStyle} htmlFor="as-client">Client name</label><input id="as-client" autoFocus value={clientName} onChange={e => setClientName(e.target.value)} style={inputStyle} placeholder="Asha's Bakery" /></div>
          {error && <div role="alert" style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy} style={{ ...primaryBtn, padding: '10px 22px' }}>{busy ? 'Adding' : 'Add client'}</button>
            <button type="button" onClick={onClose} style={ghostBtn}>Skip for now</button>
          </div>
        </form>
      )}
    </section>
  )
}

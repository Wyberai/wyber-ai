'use client'
import { useEffect, useState } from 'react'
import { CURRENCIES } from '@/lib/agency/quote'
import type { AgencyProfile } from '@/lib/agency/profile'
import { api, ghostBtn, primaryBtn, inputStyle, labelStyle } from './ui'
import type { Workspace } from './types'

const EMPTY: AgencyProfile = {
  business_name: null, logo_url: null, website: null, support_email: null, phone: null, address: null, tax_label: null, tax_id: null,
  default_currency: null, default_payment_instructions: null, default_terms: null,
}

/**
 * "Your business": the name, logo and details your clients see on their page, quotes and emails (not WyberAi's), plus
 * the defaults new quotes start from. It belongs to you, or to a workspace if you run an agency with others.
 */
export function BusinessPanel({ profiles, workspaces, onSaved, toast, onClose }: {
  profiles: Record<string, AgencyProfile | null>
  workspaces: Workspace[]
  onSaved: (key: string, p: AgencyProfile) => void
  toast: (msg: string, ok?: boolean) => void
  onClose: () => void
}) {
  const [scope, setScope] = useState('me')
  const [form, setForm] = useState<AgencyProfile>(profiles.me ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const space = workspaces.find(w => w.id === scope)
  const canWrite = scope === 'me' || space?.role === 'owner' || space?.role === 'admin'

  useEffect(() => { setForm(profiles[scope] ?? EMPTY) }, [scope, profiles])
  const set = (k: keyof AgencyProfile, v: string) => setForm(f => ({ ...f, [k]: v }))
  const val = (k: keyof AgencyProfile) => form[k] ?? ''

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await api('PUT', scope === 'me' ? '/api/agency/profile' : `/api/agency/profile?orgId=${scope}`, { profile: form })
    setBusy(false)
    if (!r.ok) { toast(r.data.error ?? 'Could not save', false); return }
    onSaved(scope, r.data.profile)
    toast('Saved. Your clients will see this on their pages, quotes and emails.')
  }

  const field = (k: keyof AgencyProfile, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label style={labelStyle} htmlFor={`bz-${k}`}>{label}</label><input id={`bz-${k}`} disabled={!canWrite} value={val(k)} onChange={e => set(k, e.target.value)} style={inputStyle} {...props} /></div>
  )

  return (
    <form onSubmit={save} style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 22, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Your business</div>
        <button type="button" onClick={onClose} style={{ ...ghostBtn, border: 'none' }}>Close</button>
      </div>
      <p style={{ fontSize: 13, color: '#8797ab', lineHeight: 1.6, margin: '4px 0 16px', maxWidth: 620 }}>
        This is what your clients see: your name and logo on their page, your details on quotes and invoices, and the sender of emails. WyberAi does not appear.
      </p>
      {workspaces.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle} htmlFor="bz-scope">Profile for</label>
          <select id="bz-scope" value={scope} onChange={e => setScope(e.target.value)} style={{ ...inputStyle, maxWidth: 320, padding: '9px 12px' }}>
            <option value="me">Just me</option>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} (workspace)</option>)}
          </select>
        </div>
      )}
      {!canWrite && <p style={{ fontSize: 13, color: '#F59E0B', margin: '0 0 12px' }}>Only the owner or an admin of {space?.name} can change this.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {field('business_name', 'Business name', { placeholder: 'Northwind Studio', maxLength: 120 })}
        {field('logo_url', 'Logo link (https)', { placeholder: 'https://…/logo.png' })}
        {field('website', 'Website', { placeholder: 'northwind.studio' })}
        {field('support_email', 'Contact email', { type: 'email', placeholder: 'hello@northwind.studio' })}
        {field('phone', 'Phone', { maxLength: 40 })}
        {field('tax_label', 'Tax name (for invoices)', { placeholder: 'GST, VAT, EIN', maxLength: 30 })}
        {field('tax_id', 'Tax number', { maxLength: 40 })}
        <div>
          <label style={labelStyle} htmlFor="bz-cur">Usual currency</label>
          <select id="bz-cur" disabled={!canWrite} value={val('default_currency')} onChange={e => set('default_currency', e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
            <option value="">Not set</option>{CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle} htmlFor="bz-address">Business address</label>
          <textarea id="bz-address" disabled={!canWrite} rows={2} value={val('address')} onChange={e => set('address', e.target.value)} maxLength={400} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle} htmlFor="bz-pay">Usual payment instructions (new quotes start with this)</label>
          <textarea id="bz-pay" disabled={!canWrite} rows={2} value={val('default_payment_instructions')} onChange={e => set('default_payment_instructions', e.target.value)} maxLength={1000} placeholder="Bank details, UPI id, PayPal address…" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle} htmlFor="bz-terms">Usual terms (new quotes start with this)</label>
          <textarea id="bz-terms" disabled={!canWrite} rows={3} value={val('default_terms')} onChange={e => set('default_terms', e.target.value)} maxLength={2000} placeholder="Payment schedule, revisions included, who owns the code, how to cancel." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>
      {canWrite && <button type="submit" disabled={busy} style={{ ...primaryBtn, marginTop: 16 }}>{busy ? 'Saving…' : 'Save business details'}</button>}
    </form>
  )
}

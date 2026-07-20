'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

interface Connector {
  service: string
  config: { url?: string; project_id?: string }
  connected_at: string
}

export function SupabaseConnector({ onClose }: { onClose: () => void }) {
  const { project } = useEditorStore()
  const t = useT(EDITOR_CONNECTORS_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState<Connector | null>(null)
  const [error, setError] = useState('')

  // ── OAuth "Connect" flow ──────────────────────────────────────────────
  interface SbProject { id: string; name: string; organization_id: string; region: string }
  interface SbOrg { id: string; name: string }
  const [picker, setPicker] = useState(false)
  const [projects, setProjects] = useState<SbProject[]>([])
  const [orgs, setOrgs] = useState<SbOrg[]>([])
  const [pickerBusy, setPickerBusy] = useState(false)

  useEffect(() => {
    if (!project?.id) return
    fetch(`/api/connectors?projectId=${project.id}`)
      .then(r => r.json())
      .then(d => {
        const sb = d.connectors?.find((c: Connector) => c.service === 'supabase')
        if (sb) setConnected(sb)
      })
    // Returned from Supabase OAuth consent via a same-tab fallback (popup
    // blocked) → open the project picker.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('supabase') === 'pick') {
      openPicker()
    }
  }, [project?.id])

  // Normal case: the OAuth callback runs in the popup and posts the result
  // back here, so this tab (and its chat history) never navigates away.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== 'wyber:supabase-oauth-result') return
      if (e.data.success) openPicker()
      else setError(e.data.error || t('supabaseConnectionFailedRetry'))
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const oauthConnect = () => {
    const startUrl = `/api/connectors/supabase/start?projectId=${project?.id}`
    const popup = window.open(startUrl, 'supabase_oauth', 'width=520,height=680,scrollbars=yes,resizable=yes')
    // Popup blocked — fall back to a same-tab redirect so the flow still works.
    if (!popup) window.location.href = startUrl
  }

  async function openPicker() {
    setPicker(true); setPickerBusy(true); setError('')
    try {
      const r = await fetch(`/api/connectors/supabase/projects?projectId=${project?.id}`)
      const d = await r.json()
      if (!r.ok) { setError(d.error || t('couldNotLoadProjects')); return }
      setProjects(d.projects || []); setOrgs(d.orgs || [])
    } catch { setError(t('couldNotLoadProjects')) }
    finally { setPickerBusy(false) }
  }

  async function linkExisting(ref: string) {
    setPickerBusy(true); setError('')
    try {
      const r = await fetch('/api/connectors/supabase/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id, action: 'link', ref }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || t('couldNotLinkProject')); return }
      setConnected({ service: 'supabase', config: { url: d.url }, connected_at: new Date().toISOString() })
      window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
      setPicker(false)
    } catch { setError(t('couldNotLinkProject')) }
    finally { setPickerBusy(false) }
  }

  async function createNew() {
    // Default to the app's name so the project is identifiable in the user's
    // Supabase dashboard instead of another generic "My App".
    const name = window.prompt(t('namePromptForNewProject'), project?.name || '')
    if (!name) return
    const dbPass = window.prompt(t('dbPasswordPrompt'))
    if (!dbPass) return
    const orgId = orgs[0]?.id
    if (!orgId) { setError(t('noSupabaseOrgFound')); return }
    setPickerBusy(true); setError('')
    try {
      const r = await fetch('/api/connectors/supabase/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id, action: 'create', orgId, name, dbPass }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || t('couldNotCreateProject')); return }
      setConnected({ service: 'supabase', config: { url: d.url }, connected_at: new Date().toISOString() })
      window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
      setPicker(false)
    } catch { setError(t('couldNotCreateProject')) }
    finally { setPickerBusy(false) }
  }

  const connect = async () => {
    if (!url.trim() || !anonKey.trim()) { setError(t('bothFieldsRequired')); return }
    if (!url.startsWith('https://')) { setError(t('urlMustStartHttps')); return }
    setSaving(true); setError('')
    try {
      // Validate the credentials work
      const test = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      })
      if (!test.ok && test.status !== 200 && test.status !== 401) {
        setError(t('couldNotConnectCheckCreds'))
        return
      }
      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project?.id,
          service: 'supabase',
          apiKey: anonKey,
          config: { url: url.trim(), project_id: url.split('.')[0].replace('https://', '') }
        })
      })
      if (res.ok) {
        setConnected({ service: 'supabase', config: { url: url.trim() }, connected_at: new Date().toISOString() })
        window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
      } else {
        setError(t('failedToSaveConnection'))
      }
    } catch {
      setError(t('connectionFailedCheckCreds'))
    } finally { setSaving(false) }
  }

  const disconnect = async () => {
    await fetch('/api/connectors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project?.id, service: 'supabase' })
    })
    setConnected(null); setUrl(''); setAnonKey('')
    window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(62,207,142,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5' }}>{t('connectSupabaseModalTitle')}</div>
            <div style={{ fontSize: 12, color: '#52526a' }}>{t('connectSupabaseModalSubtitle')}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#52526a', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {connected ? (
          <div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{t('supabaseConnectedLabel')}</span>
              </div>
              <div style={{ fontSize: 11, color: '#52526a', fontFamily: 'monospace' }}>{connected.config?.url}</div>
            </div>
            <div style={{ fontSize: 12, color: '#8b8b9a', marginBottom: 16 }}>
              {t('connectedExplainer')}
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('wyber:chat-prompt', {
                  detail: 'Wire the entire app to my connected Supabase project: replace all mock/local state with real Supabase reads and writes, add signup/login if missing, and include the schema SQL block at the end so my tables are created.',
                }))
                onClose()
              }}
              style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: '#3ecf8e', color: '#06281c', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span> {t('wireAppNowBtn')}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={disconnect} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('disconnect')}
              </button>
              <button onClick={onClose} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {tc('close')}
              </button>
            </div>
          </div>
        ) : picker ? (
          <div>
            <div style={{ fontSize: 13, color: '#8b8b9a', marginBottom: 8 }}>
              {t('pickerIntro')}
            </div>
            <div style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
              {t('pickerAccountNoticePrefix')} <strong>{t('pickerAccountNoticeBold')}</strong> {t('pickerAccountNoticeSuffix')}
            </div>
            {pickerBusy && <div style={{ fontSize: 12, color: '#52526a', marginBottom: 10 }}>{t('workingEllipsis')}</div>}
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</div>}
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => linkExisting(p.id)} disabled={pickerBusy}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a24', color: '#f0f0f5', fontSize: 13, cursor: pickerBusy ? 'not-allowed' : 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: '#52526a', fontFamily: 'monospace' }}>{p.id} · {p.region}</div>
                </button>
              ))}
              {!pickerBusy && projects.length === 0 && <div style={{ fontSize: 12, color: '#52526a' }}>{t('noExistingProjectsMsg')}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPicker(false)} disabled={pickerBusy} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{tc('back')}</button>
              <button onClick={createNew} disabled={pickerBusy} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: '#3ecf8e', color: '#06281c', fontSize: 13, fontWeight: 700, cursor: pickerBusy ? 'not-allowed' : 'pointer' }}>{t('newProjectBtn')}</button>
            </div>
          </div>
        ) : (
          <div>
            {/* One-click OAuth connect */}
            <button onClick={oauthConnect}
              style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: '#3ecf8e', color: '#06281c', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span> {t('connectWithSupabaseBtn')}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 10, color: '#52526a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('orPasteKeysManually')}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b8b9a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('projectUrlLabel')}</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                style={{ width: '100%', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b8b9a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('anonKeyLabel')}</label>
              <input value={anonKey} onChange={e => setAnonKey(e.target.value)} type="password"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                style={{ width: '100%', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
            </div>
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</div>}
            <div style={{ fontSize: 11, color: '#52526a', marginBottom: 16 }}>
              {t('findKeysHint')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{tc('cancel')}</button>
              <button onClick={connect} disabled={saving}
                style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: saving ? '#3f3f6e' : '#6366f1', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? t('connectingEllipsis') : t('connectSupabaseCta')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

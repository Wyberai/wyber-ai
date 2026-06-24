'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'

interface Connector {
  service: string
  config: { url?: string; project_id?: string }
  connected_at: string
}

export function SupabaseConnector({ onClose }: { onClose: () => void }) {
  const { project } = useEditorStore()
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
    // Returned from Supabase OAuth consent → open the project picker.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('supabase') === 'pick') {
      openPicker()
    }
  }, [project?.id])

  const oauthConnect = () => {
    window.location.href = `/api/connectors/supabase/start?projectId=${project?.id}`
  }

  async function openPicker() {
    setPicker(true); setPickerBusy(true); setError('')
    try {
      const r = await fetch(`/api/connectors/supabase/projects?projectId=${project?.id}`)
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Could not load your Supabase projects'); return }
      setProjects(d.projects || []); setOrgs(d.orgs || [])
    } catch { setError('Could not load your Supabase projects') }
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
      if (!r.ok) { setError(d.error || 'Could not link project'); return }
      setConnected({ service: 'supabase', config: { url: d.url }, connected_at: new Date().toISOString() })
      setPicker(false)
    } catch { setError('Could not link project') }
    finally { setPickerBusy(false) }
  }

  async function createNew() {
    const name = window.prompt('Name for the new Supabase project:')
    if (!name) return
    const dbPass = window.prompt('Database password (save it somewhere safe):')
    if (!dbPass) return
    const orgId = orgs[0]?.id
    if (!orgId) { setError('No Supabase organization found'); return }
    setPickerBusy(true); setError('')
    try {
      const r = await fetch('/api/connectors/supabase/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id, action: 'create', orgId, name, dbPass }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Could not create project'); return }
      setConnected({ service: 'supabase', config: { url: d.url }, connected_at: new Date().toISOString() })
      setPicker(false)
    } catch { setError('Could not create project') }
    finally { setPickerBusy(false) }
  }

  const connect = async () => {
    if (!url.trim() || !anonKey.trim()) { setError('Both fields required'); return }
    if (!url.startsWith('https://')) { setError('URL must start with https://'); return }
    setSaving(true); setError('')
    try {
      // Validate the credentials work
      const test = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
      })
      if (!test.ok && test.status !== 200 && test.status !== 401) {
        setError('Could not connect — check your URL and anon key')
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
      } else {
        setError('Failed to save connection')
      }
    } catch {
      setError('Connection failed — check your credentials')
    } finally { setSaving(false) }
  }

  const disconnect = async () => {
    await fetch('/api/connectors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project?.id, service: 'supabase' })
    })
    setConnected(null); setUrl(''); setAnonKey('')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(62,207,142,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5' }}>Connect Supabase</div>
            <div style={{ fontSize: 12, color: '#52526a' }}>Your generated app will use real data persistence</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#52526a', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {connected ? (
          <div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Supabase Connected</span>
              </div>
              <div style={{ fontSize: 11, color: '#52526a', fontFamily: 'monospace' }}>{connected.config?.url}</div>
            </div>
            <div style={{ fontSize: 12, color: '#8b8b9a', marginBottom: 16 }}>
              Your next generation will include a Supabase client, real CRUD operations, and data that persists between sessions.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={disconnect} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Disconnect
              </button>
              <button onClick={onClose} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        ) : picker ? (
          <div>
            <div style={{ fontSize: 13, color: '#8b8b9a', marginBottom: 8 }}>
              Pick a Supabase project to link, or create a new one. We&apos;ll wire its URL + anon key into your app automatically.
            </div>
            <div style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
              These are the projects in the <strong>Supabase account you just authorized</strong> — make sure it&apos;s the account you want this app&apos;s data to live in. To use a different one, sign into that Supabase account first, then reconnect.
            </div>
            {pickerBusy && <div style={{ fontSize: 12, color: '#52526a', marginBottom: 10 }}>Working…</div>}
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</div>}
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => linkExisting(p.id)} disabled={pickerBusy}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a24', color: '#f0f0f5', fontSize: 13, cursor: pickerBusy ? 'not-allowed' : 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: '#52526a', fontFamily: 'monospace' }}>{p.id} · {p.region}</div>
                </button>
              ))}
              {!pickerBusy && projects.length === 0 && <div style={{ fontSize: 12, color: '#52526a' }}>No existing projects — create one below.</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPicker(false)} disabled={pickerBusy} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back</button>
              <button onClick={createNew} disabled={pickerBusy} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: '#3ecf8e', color: '#06281c', fontSize: 13, fontWeight: 700, cursor: pickerBusy ? 'not-allowed' : 'pointer' }}>+ New project</button>
            </div>
          </div>
        ) : (
          <div>
            {/* One-click OAuth connect */}
            <button onClick={oauthConnect}
              style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: '#3ecf8e', color: '#06281c', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span> Connect with Supabase
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 10, color: '#52526a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or paste keys manually</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b8b9a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                style={{ width: '100%', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b8b9a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anon / Public Key</label>
              <input value={anonKey} onChange={e => setAnonKey(e.target.value)} type="password"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                style={{ width: '100%', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
            </div>
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</div>}
            <div style={{ fontSize: 11, color: '#52526a', marginBottom: 16 }}>
              Find these in your Supabase project → Settings → API. The anon key is safe to use in frontend code.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={connect} disabled={saving}
                style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: saving ? '#3f3f6e' : '#6366f1', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Connecting...' : 'Connect Supabase'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

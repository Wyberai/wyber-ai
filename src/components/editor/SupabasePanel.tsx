'use client'
import { useState, useEffect, useCallback } from 'react'
import { SkeletonList } from './ui'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

interface ConnectorRow {
  id: string
  service: string
  api_key: string
  config: { url: string; project_id?: string }
  connected_at: string
}

function IcoDb() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  )
}

function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IcoLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function Spinner({ size = 12, color = '#0EA5E9' }: { size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  )
}

export function SupabasePanel({ projectId }: { projectId: string }) {
  const t = useT(EDITOR_CONNECTORS_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const [connected, setConnected] = useState<ConnectorRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'own' | 'provision'>('own')
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connectors?projectId=${projectId}`)
      const data = await res.json()
      const sb = (data.connectors || []).find((c: ConnectorRow) => c.service === 'supabase')
      setConnected(sb || null)
    } catch {}
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const testAndSave = async () => {
    setError('')
    const trimUrl = url.trim().replace(/\/$/, '')
    const trimKey = anonKey.trim()
    if (!trimUrl || !trimKey) { setError(t('bothFieldsAreRequired')); return }
    if (!trimUrl.startsWith('https://')) { setError(t('urlMustStartHttps')); return }

    // Test connection: hit the Supabase REST root with the anon key
    setTesting(true)
    try {
      const probe = await fetch(`${trimUrl}/rest/v1/`, {
        headers: { apikey: trimKey, Authorization: `Bearer ${trimKey}` },
      })
      if (!probe.ok && probe.status !== 400) {
        // 400 is fine (no table name given) — it means the server responded
        setError(t('connectionTestFailedTemplate').replace('{status}', String(probe.status)))
        setTesting(false)
        return
      }
    } catch {
      setError(t('couldNotReachUrl'))
      setTesting(false)
      return
    }
    setTesting(false)

    // Save to project_connectors (encrypted server-side)
    setSaving(true)
    const projectRef = trimUrl.split('//')[1]?.split('.')[0] ?? ''
    const res = await fetch('/api/connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        service: 'supabase',
        apiKey: trimKey,
        config: { url: trimUrl, project_id: projectRef },
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setUrl(''); setAnonKey('')
    window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
    await load()
  }

  const disconnect = async () => {
    await fetch('/api/connectors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, service: 'supabase' }),
    })
    setConnected(null)
    window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const S = {
    label: { fontSize: 10, fontWeight: 700, color: 'var(--ide-text3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 4 },
    input: { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--ide-text1)', fontSize: 12, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' as const },
    btn: (bg = '#0EA5E9', fg = '#fff') => ({ padding: '8px 14px', borderRadius: 7, border: 'none', background: bg, color: fg, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 as const, transition: 'opacity 0.15s' }),
    ghost: { padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
    card: { background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 9, padding: 12, marginBottom: 10 },
    row: { display: 'flex', alignItems: 'center', gap: 8 },
  }

  if (loading) {
    return <SkeletonList rows={3} rowHeight={64} />
  }

  // ── Connected state ──
  if (connected) {
    const sbUrl = connected.config?.url || ''
    const projectRef = connected.config?.project_id || sbUrl.split('//')[1]?.split('.')[0] || ''
    const maskedKey = connected.api_key ? connected.api_key.slice(0, 8) + '...' + connected.api_key.slice(-6) : '••••••'
    return (
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header */}
        <div style={{ ...S.row, justifyContent: 'space-between' }}>
          <div style={{ ...S.row }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('connectedStatusLabel')}</span>
          </div>
          <button onClick={disconnect} style={{ ...S.ghost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', fontSize: 10 }}>{t('disconnect')}</button>
        </div>

        {/* Project URL */}
        <div style={S.card}>
          <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={S.label}>{t('projectUrlLabel')}</span>
            <button onClick={() => copy(sbUrl, 'url')} style={{ ...S.ghost, fontSize: 10, padding: '2px 7px' }}>
              {copied === 'url' ? tc('copied') : tc('copy')}
            </button>
          </div>
          <code style={{ fontSize: 10, color: '#0EA5E9', fontFamily: 'monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sbUrl}
          </code>
        </div>

        {/* Anon Key */}
        <div style={S.card}>
          <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={S.label}>{t('anonKeyShortLabel')}</span>
            <button onClick={() => copy(connected.api_key, 'key')} style={{ ...S.ghost, fontSize: 10, padding: '2px 7px' }}>
              {copied === 'key' ? tc('copied') : tc('copy')}
            </button>
          </div>
          <code style={{ fontSize: 10, color: '#a1a1aa', fontFamily: 'monospace' }}>{maskedKey}</code>
        </div>

        {/* Info box */}
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#0EA5E9', marginBottom: 4 }}>{t('autoWiredTitle')}</div>
          {t('autoWiredBody')}
        </div>

        {/* Open dashboard */}
        {projectRef && (
          <a href={`https://supabase.com/dashboard/project/${projectRef}`} target="_blank" rel="noopener noreferrer"
            style={{ ...S.btn('transparent', 'var(--ide-text3)'), border: '1px solid var(--ide-border)', textDecoration: 'none', justifyContent: 'center', fontSize: 11 }}>
            {t('openSupabaseDashboard')} <IcoLink />
          </a>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // ── Not connected ──
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', borderRadius: 8, padding: 3, border: '1px solid var(--ide-border)' }}>
        {(['own', 'provision'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: mode === m ? '#0EA5E9' : 'transparent', color: mode === m ? '#fff' : 'var(--ide-text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {m === 'own' ? t('connectExistingTab') : t('createNewTab')}
          </button>
        ))}
      </div>

      {/* Connect own Supabase */}
      {mode === 'own' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.5 }}>
            {t('connectExistingIntro')}
          </div>

          <div>
            <label style={S.label}>{t('projectUrlLabel')}</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              style={S.input}
              autoComplete="off"
            />
          </div>

          <div>
            <label style={S.label}>{t('anonKeyLabel')}</label>
            <input
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              style={{ ...S.input, fontSize: 10 }}
              autoComplete="off"
            />
          </div>

          {error && <div style={{ fontSize: 11, color: '#ef4444', lineHeight: 1.5 }}>{error}</div>}

          <button
            onClick={testAndSave}
            disabled={testing || saving}
            style={{ ...S.btn(), opacity: (testing || saving) ? 0.7 : 1 }}
          >
            {testing ? <><Spinner size={11} color="#fff" />{t('testingBtn')}</> :
             saving ? <><Spinner size={11} color="#fff" />{tc('saving')}</> :
             <><IcoCheck />{t('connectAndVerifyBtn')}</>}
          </button>

          <div style={{ fontSize: 10, color: 'var(--ide-text3)', lineHeight: 1.5 }}>
            {t('findKeysDashboardPrefix')}{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#0EA5E9' }}>
              {t('supabaseDashboardLink')}
            </a>
            {' '}{t('findKeysDashboardSuffix')}
          </div>
        </div>
      )}

      {/* Connect the user's OWN Supabase (OAuth) — link an existing project or
          create a new one in THEIR org, on their free tier. The old
          auto-provision path created projects in WyberAi's platform org, which
          billed every customer database to us. */}
      {mode === 'provision' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 9, background: 'rgba(63,207,142,0.05)', border: '1px solid rgba(63,207,142,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IcoDb />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3FCF8E' }}>{t('provisionTitle')}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ide-text3)', lineHeight: 1.6, marginBottom: 12 }}>
              {t('provisionIntro')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              {[t('featurePostgres'), t('featureAuth'), t('featureStorage'), t('featureRealtime')].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ide-text3)' }}>
                  <IcoCheck />{f}
                </div>
              ))}
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('wyber-open-supabase'))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#3FCF8E', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {t('connectSupabaseCta')}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}


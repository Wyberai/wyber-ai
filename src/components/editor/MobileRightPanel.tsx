'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_MOBILE_STRINGS } from '@/lib/i18n/dict/editor-mobile'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

interface StoreListing {
  title: string
  subtitle: string
  description: string
  keywords: string[]
  category: string
  privacyPolicyUrl: string
  supportUrl: string
  whatIsNew: string
  easConfig: object
}

function IcoSpinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const t = useT(EDITOR_MOBILE_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <button onClick={copy} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#71717a', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
      {copied ? t('copiedLabel') : tc('copy')}
    </button>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <CopyBtn text={value} />
      </div>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 10px', fontSize: 12, color: '#e4e4e7', lineHeight: 1.5, fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  )
}

function StoreListing({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const { files } = useEditorStore()
  const t = useT(EDITOR_MOBILE_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const [listing, setListing] = useState<StoreListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedFromDb, setLoadedFromDb] = useState(false)

  // Load persisted listing on mount
  useEffect(() => {
    if (!projectId || loadedFromDb) return
    setLoadedFromDb(true)
    fetch(`/api/projects/${projectId}/mobile-meta`)
      .then(r => r.json())
      .then(d => { if (d.store_listing) setListing(d.store_listing) })
      .catch(() => {})
  }, [projectId, loadedFromDb])

  const persist = useCallback(async (data: StoreListing) => {
    if (!projectId) return
    fetch(`/api/projects/${projectId}/mobile-meta`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_listing: data }),
    }).catch(() => {})
  }, [projectId])

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Grab a snippet from App.tsx for context
      const appFile = Object.entries(files ?? {}).find(([p]) => p.includes('App.tsx'))
      const codeSnippet = appFile ? (appFile[1] as any).content?.slice(0, 1200) : ''

      const res = await fetch('/api/store-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: projectName || 'My App', codeSnippet }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setListing(data)
      persist(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [files, projectName, persist])

  if (!listing && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.15)" strokeWidth="1"/><path d="M13 20h14M20 13v14" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/></svg>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{t('generateStoreListingTitle')}</div>
        <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>{t('generateStoreListingDesc')}</div>
        {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
        <button onClick={generate}
          style={{ background: '#0EA5E9', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {t('generateWithAiBtn')}
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <IcoSpinner />
        <span style={{ fontSize: 12, color: '#71717a' }}>{t('writingStoreListing')}</span>
      </div>
    )
  }

  if (!listing) return null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>{t('appStoreListingHeader')}</span>
        <button onClick={generate}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#71717a', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
          {t('regenerateBtn')}
        </button>
      </div>

      <Field label={t('fieldTitleLabel')} value={listing.title} />
      <Field label={t('fieldSubtitleLabel')} value={listing.subtitle} />
      <Field label={t('fieldCategoryLabel')} value={listing.category} />
      <Field label={tc('description')} value={listing.description} />
      <Field label={t('fieldKeywordsLabel')} value={listing.keywords.join(', ')} />
      <Field label={t('fieldWhatsNewLabel')} value={listing.whatIsNew} />
      <Field label={t('fieldPrivacyPolicyLabel')} value={listing.privacyPolicyUrl} />
      <Field label={t('fieldSupportUrlLabel')} value={listing.supportUrl} />
      <Field label={t('fieldEasConfigLabel')} value={JSON.stringify(listing.easConfig, null, 2)} mono />
    </div>
  )
}

function PublishGuide() {
  const [open, setOpen] = useState<number | null>(0)
  const t = useT(EDITOR_MOBILE_STRINGS)
  // Step bodies are literal shell commands/instructions meant to be copy-pasted
  // as-is — only the section titles are translated (see editor-mobile.ts note).
  const steps = [
    {
      title: t('stepInstallTitle'),
      body: `npm install -g expo-cli eas-cli
npx expo login
eas login`,
    },
    {
      title: t('stepInitTitle'),
      body: `# Export your code first (Download button above)
# Then in the project folder:
eas build:configure
# This creates eas.json — paste the config from Store Listing tab`,
    },
    {
      title: t('stepAppleTitle'),
      body: `• Enroll at developer.apple.com ($99/year)
• Create an App ID in Certificates, Identifiers & Profiles
• In App Store Connect: create a new app, fill in metadata from Store Listing tab
• EAS handles provisioning profiles automatically with: eas build --platform ios`,
    },
    {
      title: t('stepGoogleTitle'),
      body: `• Enroll at play.google.com/console ($25 one-time)
• Create a new app, complete the store listing
• EAS handles the keystore automatically with: eas build --platform android`,
    },
    {
      title: t('stepBuildSubmitTitle'),
      // TODO: wire up EAS Build + Submit API calls — currently documentation only
      body: `# These commands run locally after downloading your code:
eas build --platform ios --profile production
eas build --platform android --profile production

# Then submit:
eas submit --platform ios
eas submit --platform android

⚠️  Binary build and submission are not automated here yet.
    Export your code, install EAS CLI, and run these commands locally.`,
    },
    {
      title: t('stepResourcesTitle'),
      body: `EAS Build docs:    https://docs.expo.dev/build/introduction/
EAS Submit docs:   https://docs.expo.dev/submit/introduction/
App Store Connect: https://appstoreconnect.apple.com
Google Play:       https://play.google.com/console`,
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7', marginBottom: 14 }}>{t('publishGuideHeader')}</div>
      {steps.map((step, i) => (
        <div key={i} style={{ marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', background: open === i ? 'rgba(14,165,233,0.06)' : '#111118', border: 'none', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: open === i ? '#0EA5E9' : '#a1a1aa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step.title}
            <span style={{ fontSize: 14, opacity: 0.5 }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div style={{ background: '#0a0a0f', padding: '10px 12px', fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {step.body}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface Props {
  projectId?: string
  projectName?: string
}

function DatabaseTab({ projectId }: { projectId?: string }) {
  const t = useT(EDITOR_MOBILE_STRINGS)
  // WyberCloud state
  const [cloudDbs, setCloudDbs] = useState<any[]>([])
  const [cloudLoading, setCloudLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [cloudError, setCloudError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Supabase state
  const [showSupabase, setShowSupabase] = useState(false)
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [connected, setConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    // Load WyberCloud databases
    fetch(`/api/cloud/databases?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setCloudDbs(d.databases || []) })
      .catch(() => {})
      .finally(() => setCloudLoading(false))
    // Load Supabase connector (secondary)
    fetch(`/api/connectors?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { if (d.supabase?.url) { setUrl(d.supabase.url); setAnonKey('••••••••'); setConnected(true) } })
      .catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [projectId])

  const provisionCloud = async () => {
    if (!projectId) return
    setProvisioning(true); setCloudError(null)
    try {
      const res = await fetch('/api/cloud/create-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, dbName: 'app_db', dbPassword: Math.random().toString(36).slice(2, 14) + 'A1!' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Provisioning failed')
      const refetch = () => fetch(`/api/cloud/databases?projectId=${projectId}`).then(r => r.json()).then(d => setCloudDbs(d.databases || []))
      await refetch()
      if (data.cloudDatabaseId) {
        pollRef.current = setInterval(async () => {
          const st = await fetch(`/api/cloud/create-database/status?cloudDatabaseId=${data.cloudDatabaseId}`).then(r => r.json())
          if (st.status === 'ready' || st.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            if (st.status === 'failed') setCloudError('Provisioning failed — try again.')
            await refetch()
          }
        }, 10_000)
      }
    } catch (e: any) { setCloudError(e.message) }
    setProvisioning(false)
  }

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim() || !projectId) return
    setTesting(true); setSupabaseError(null)
    try {
      const testRes = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } })
      if (!testRes.ok) { setSupabaseError(t('connectionFailedError')); setTesting(false); return }
      await fetch('/api/connectors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, service: 'supabase', apiKey: anonKey, config: { url } }) })
      setConnected(true)
      window.dispatchEvent(new CustomEvent('wyber-connectors-changed'))
    } catch { setSupabaseError(t('networkError')) }
    setTesting(false)
  }

  const firstDb = cloudDbs[0]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      {/* WyberCloud — primary */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7' }}>WyberCloud</span>
          <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em' }}>FREE · 2 YRS</span>
        </div>
        <div style={{ fontSize: 11, color: '#52525b', marginBottom: 12, lineHeight: 1.5 }}>
          Managed Postgres, on us — no setup needed.
        </div>

        {cloudLoading ? (
          <div style={{ fontSize: 11, color: '#52525b' }}>Checking…</div>
        ) : firstDb ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: firstDb.status === 'ready' ? '#22c55e' : firstDb.status === 'provisioning' ? '#f59e0b' : '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: firstDb.status === 'ready' ? '#22c55e' : '#f59e0b' }}>
                {firstDb.status === 'ready' ? 'Connected' : firstDb.status === 'provisioning' ? 'Setting up…' : 'Failed'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#71717a' }}>{firstDb.name || firstDb.db_name}</div>
          </div>
        ) : (
          <>
            {cloudError && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{cloudError}</div>}
            <button onClick={provisionCloud} disabled={provisioning}
              style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: provisioning ? '#1a1a22' : '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer' }}>
              {provisioning ? 'Provisioning…' : '🎁 Get Free Database'}
            </button>
          </>
        )}
      </div>

      {/* Supabase — secondary / advanced */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <button onClick={() => setShowSupabase(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5, marginBottom: showSupabase ? 12 : 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Advanced: connect Supabase</span>
          <span style={{ fontSize: 11, color: '#3f3f46' }}>{showSupabase ? '▲' : '▼'}</span>
        </button>

        {showSupabase && (
          connected ? (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>{t('connectedLabel')}</div>
              <div style={{ fontSize: 11, color: '#71717a', wordBreak: 'break-all' }}>{url}</div>
              <button onClick={() => { setConnected(false); setUrl(''); setAnonKey('') }} style={{ marginTop: 8, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#71717a', cursor: 'pointer', padding: '3px 8px', fontSize: 10 }}>{t('disconnectBtn')}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#71717a', marginBottom: 3 }}>{t('projectUrlLabel')}</div>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co"
                  style={{ width: '100%', padding: '7px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e4e4e7', fontSize: 12, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#71717a', marginBottom: 3 }}>{t('anonKeyLabel')}</div>
                <input value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="eyJhbGciOi..."
                  style={{ width: '100%', padding: '7px 10px', background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e4e4e7', fontSize: 12, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
              {supabaseError && <div style={{ fontSize: 11, color: '#ef4444' }}>{supabaseError}</div>}
              <button onClick={handleConnect} disabled={testing || !url.trim() || !anonKey.trim()}
                style={{ padding: '8px 0', borderRadius: 8, background: testing ? '#1a1a22' : 'rgba(255,255,255,0.06)', color: '#a1a1aa', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', cursor: testing ? 'not-allowed' : 'pointer' }}>
                {testing ? t('testingConnectionBtn') : t('connectSupabaseTitle')}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export function MobileRightPanel({ projectId, projectName }: Props) {
  const t = useT(EDITOR_MOBILE_STRINGS)
  const [tab, setTab] = useState<'database' | 'store' | 'publish'>('database')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#10121a' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {(['database', 'store', 'publish'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === tabKey ? '#0EA5E9' : 'transparent'}`, color: tab === tabKey ? '#0EA5E9' : '#71717a', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {tabKey === 'database' ? t('tabDatabase') : tabKey === 'store' ? t('tabStoreListing') : t('tabPublishGuide')}
          </button>
        ))}
      </div>

      {tab === 'database'
        ? <DatabaseTab projectId={projectId} />
        : tab === 'store'
        ? <StoreListing projectId={projectId} projectName={projectName} />
        : <PublishGuide />
      }
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { DeviceFrame } from './DeviceFrame'
import { DEFAULT_DEVICE_ID, devicesForOS, getDevice, type DeviceOS } from '@/lib/devices'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_MOBILE_STRINGS } from '@/lib/i18n/dict/editor-mobile'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'
import { creditCost, PREVIEW_ACCESS_GAME_COST } from '@/lib/credits'
import { detectGame } from '@/lib/game-detect'

// Base (app, not game) preview-access charge.
const PREVIEW_ACCESS_APP_COST = creditCost('preview-access')

// APK/IPA build cost (premium feature)
const APK_BUILD_COST = 50
const IPA_BUILD_COST = 50

// ── Mode system ────────────────────────────────────────────────────────────────
// inapp      → RNW bundle rendered in-browser (instant, zero deps)
// wyberaigo  → WyberAi companion app: QR deep-link, pre-bundles for fast load
// appetize   → Cloud Android device (Appetize — keep for existing builds)
// apk        → Build real Android APK (50 credits) — premium feature
// ipa        → Build real iOS IPA (50 credits) — premium feature
type PreviewMode = 'inapp' | 'wyberaigo' | 'appetize' | 'apk' | 'ipa'
type AppetizeStatus = 'idle' | 'queued' | 'building' | 'ready' | 'error'
type BuildStatus = 'idle' | 'queued' | 'building' | 'ready' | 'error'

const DEFAULT_MODE: PreviewMode = 'inapp'
const POLL_INTERVAL_MS = 6000

// Fixed, always-overwritten path — the wyberai-mobile repo's Android Release
// workflow publishes here on every successful build (see .github/workflows/
// android-release.yml in that repo), so this URL never changes and never
// expires, unlike a GitHub Actions artifact link.
const WYBERAI_APP_APK_URL = 'https://api.wyberai.com/storage/v1/object/public/app-releases/android/wyberai-latest.apk'

interface Props {
  projectId?: string
}

export function MobilePreviewPanel({ projectId }: Props) {
  const { files, isGenerating, hasGeneratedFiles, credits, setCredits } = useEditorStore()
  const t = useT(EDITOR_MOBILE_STRINGS)

  // The QR gate below reads `credits` from the store, which is only ever set
  // from the page's initial server-rendered profile or after this tab's own
  // spends — a top-up completed in another tab (or on mobile) never reaches
  // it otherwise, so the gate would stay locked until a full reload. Refresh
  // on refocus, the cheapest place a stale balance actually matters here.
  useEffect(() => {
    async function refreshCredits() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
        if (typeof data?.credits === 'number') setCredits(data.credits)
      } catch { /* best-effort */ }
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refreshCredits()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [setCredits])

  const [mode, setMode] = useState<PreviewMode>(DEFAULT_MODE)
  const [platform, setPlatform] = useState<DeviceOS>('ios')
  const [deviceId, setDeviceId] = useState<string>(DEFAULT_DEVICE_ID)

  // ── In-app bundle state ──────────────────────────────────────────────────
  const [bundleJs, setBundleJs] = useState<string | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)

  // ── WyberAi Go pre-bundle state ──────────────────────────────────────────
  const [deviceBundling, setDeviceBundling] = useState(false)
  const [deviceBundleUrl, setDeviceBundleUrl] = useState<string | null>(null)

  // ── Appetize state ───────────────────────────────────────────────────────
  const [appetizeStatus, setAppetizeStatus] = useState<AppetizeStatus>('idle')
  const [appetizeBuildId, setAppetizeBuildId] = useState<string | null>(null)
  const [appetizeTriggerLoading, setAppetizeTriggerLoading] = useState(false)
  const [appetizeError, setAppetizeError] = useState<string | null>(null)
  const appetizePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── APK/IPA build state ──────────────────────────────────────────────
  const [apkBuildId, setApkBuildId] = useState<string | null>(null)
  const [apkStatus, setApkStatus] = useState<BuildStatus>('idle')
  const [apkUrl, setApkUrl] = useState<string | null>(null)
  const [apkError, setApkError] = useState<string | null>(null)
  const [ipaBuildId, setIpaBuildId] = useState<string | null>(null)
  const [ipaStatus, setIpaStatus] = useState<BuildStatus>('idle')
  const [ipaUrl, setIpaUrl] = useState<string | null>(null)
  const [ipaError, setIpaError] = useState<string | null>(null)
  const [buildLoading, setBuildLoading] = useState(false)
  const apkPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ipaPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<string>('')

  // v8: removed 'snack' mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wyber:mobile-preview-mode:v8')
      if (saved === 'inapp' || saved === 'wyberaigo' || saved === 'appetize' || saved === 'apk' || saved === 'ipa') setMode(saved as PreviewMode)
    } catch { /* private mode */ }
  }, [])

  const chooseMode = (m: PreviewMode) => {
    setMode(m)
    try { localStorage.setItem('wyber:mobile-preview-mode:v8', m) } catch { /* private mode */ }
  }

  // ── Appetize polling ─────────────────────────────────────────────────────

  const stopAppetizePoll = useCallback(() => {
    if (appetizePollRef.current) { clearInterval(appetizePollRef.current); appetizePollRef.current = null }
  }, [])

  const fetchAppetizeStatus = useCallback(async () => {
    if (!projectId) return
    try {
      const r = await fetch(`/api/appetize/status?projectId=${projectId}`)
      if (!r.ok) return
      const d = await r.json() as { status: AppetizeStatus; buildId: string | null }
      setAppetizeStatus(d.status)
      if (d.buildId) setAppetizeBuildId(d.buildId)
      if (d.status === 'ready' || d.status === 'error') stopAppetizePoll()
    } catch { /* ignore network blips */ }
  }, [projectId, stopAppetizePoll])

  useEffect(() => {
    if (!projectId) return
    fetchAppetizeStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (mode !== 'appetize') { stopAppetizePoll(); return }
    if (appetizeStatus === 'queued' || appetizeStatus === 'building') {
      if (!appetizePollRef.current) {
        appetizePollRef.current = setInterval(fetchAppetizeStatus, POLL_INTERVAL_MS)
      }
    } else {
      stopAppetizePoll()
    }
    return stopAppetizePoll
  }, [mode, appetizeStatus, fetchAppetizeStatus, stopAppetizePoll])

  // ── APK/IPA build polling ────────────────────────────────────────────────

  const stopApkPoll = useCallback(() => {
    if (apkPollRef.current) { clearInterval(apkPollRef.current); apkPollRef.current = null }
  }, [])

  const stopIpaPoll = useCallback(() => {
    if (ipaPollRef.current) { clearInterval(ipaPollRef.current); ipaPollRef.current = null }
  }, [])

  const fetchBuildStatus = useCallback(async (buildId: string, platform: 'apk' | 'ipa') => {
    if (!buildId) return
    try {
      const r = await fetch(`/api/mobile/status?buildId=${buildId}&platform=${platform}`)
      if (!r.ok) return
      const d = await r.json() as { status: BuildStatus; buildUrl?: string; errorMessage?: string }
      if (platform === 'apk') {
        setApkStatus(d.status)
        if (d.buildUrl) setApkUrl(d.buildUrl)
        if (d.errorMessage) setApkError(d.errorMessage)
        if (d.status === 'ready' || d.status === 'error') stopApkPoll()
      } else {
        setIpaStatus(d.status)
        if (d.buildUrl) setIpaUrl(d.buildUrl)
        if (d.errorMessage) setIpaError(d.errorMessage)
        if (d.status === 'ready' || d.status === 'error') stopIpaPoll()
      }
    } catch { /* ignore network blips */ }
  }, [stopApkPoll, stopIpaPoll])

  // Polling setup for APK
  useEffect(() => {
    if (mode !== 'apk') { stopApkPoll(); return }
    if (apkStatus === 'queued' || apkStatus === 'building') {
      if (apkBuildId && !apkPollRef.current) {
        apkPollRef.current = setInterval(() => fetchBuildStatus(apkBuildId, 'apk'), POLL_INTERVAL_MS)
      }
    } else {
      stopApkPoll()
    }
    return stopApkPoll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, apkStatus, apkBuildId])

  // Polling setup for IPA
  useEffect(() => {
    if (mode !== 'ipa') { stopIpaPoll(); return }
    if (ipaStatus === 'queued' || ipaStatus === 'building') {
      if (ipaBuildId && !ipaPollRef.current) {
        ipaPollRef.current = setInterval(() => fetchBuildStatus(ipaBuildId, 'ipa'), POLL_INTERVAL_MS)
      }
    } else {
      stopIpaPoll()
    }
    return stopIpaPoll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ipaStatus, ipaBuildId])

  // ── APK/IPA build triggers ───────────────────────────────────────────────

  const triggerApkBuild = async () => {
    if (!projectId) return
    if (credits < APK_BUILD_COST) {
      setApkError(`Insufficient credits: need ${APK_BUILD_COST}, have ${credits}`)
      return
    }
    setBuildLoading(true)
    setApkError(null)
    try {
      const r = await fetch('/api/mobile/build-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const d = await r.json() as { error?: string; buildId?: string; status?: string }
      if (!r.ok) {
        const err = d.error || 'Failed to start build'
        setApkError(err)
        if (r.status === 402) {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
            if (typeof data?.credits === 'number') setCredits(data.credits)
          }
        }
        return
      }
      if (d.buildId) {
        setApkBuildId(d.buildId)
        setApkStatus(d.status as BuildStatus ?? 'queued')
        setCredits(credits - APK_BUILD_COST)
      }
    } catch (e) {
      setApkError(String(e))
    } finally {
      setBuildLoading(false)
    }
  }

  const triggerIpaBuild = async () => {
    if (!projectId) return
    if (credits < IPA_BUILD_COST) {
      setIpaError(`Insufficient credits: need ${IPA_BUILD_COST}, have ${credits}`)
      return
    }
    setBuildLoading(true)
    setIpaError(null)
    try {
      const r = await fetch('/api/mobile/build-ipa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const d = await r.json() as { error?: string; buildId?: string; status?: string }
      if (!r.ok) {
        const err = d.error || 'Failed to start build'
        setIpaError(err)
        if (r.status === 402) {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
            if (typeof data?.credits === 'number') setCredits(data.credits)
          }
        }
        return
      }
      if (d.buildId) {
        setIpaBuildId(d.buildId)
        setIpaStatus(d.status as BuildStatus ?? 'queued')
        setCredits(credits - IPA_BUILD_COST)
      }
    } catch (e) {
      setIpaError(String(e))
    } finally {
      setBuildLoading(false)
    }
  }

  // ── File helpers ──────────────────────────────────────────────────────────

  const hasApp = Object.keys(files ?? {}).some(p =>
    p.includes('App.tsx') || p.includes('App.jsx') || p.includes('App.js'),
  )
  const fileCount = Object.keys(files ?? {}).length
  const shouldBuildPreview = hasApp && (hasGeneratedFiles || fileCount > 1)

  const plainFiles = useCallback(() => {
    const out: Record<string, string> = {}
    for (const [path, file] of Object.entries(files ?? {})) {
      const content = (file as { content?: string }).content || (file as unknown as string)
      if (typeof content === 'string') out[path] = content
    }
    return out
  }, [files])

  const filesKey = useCallback((f: Record<string, string>) =>
    Object.keys(f).sort().map(p => `${p}:${f[p].length}:${f[p].slice(-8)}`).join('|'), [])

  // ── In-App bundler ────────────────────────────────────────────────────────

  const buildInApp = useCallback((force = false) => {
    if (!shouldBuildPreview) return
    const f = plainFiles()
    const key = filesKey(f)
    if (!force && key === lastKeyRef.current && bundleJs) return
    lastKeyRef.current = key
    setError(null); setBundleLoading(true)
    fetch('/api/rn-web-bundle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: f }) })
      .then(async r => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!ok || d.error) { setError(d.error || 'Failed to build preview'); setBundleJs(null) }
        else setBundleJs(d.js ?? null)
      })
      .catch(e => setError(String(e)))
      .finally(() => setBundleLoading(false))
  }, [shouldBuildPreview, plainFiles, filesKey, bundleJs])

  // ── WyberAi Go: pre-bundle for fast device load ───────────────────────────

  const triggerDeviceBundle = useCallback((force = false) => {
    if (!projectId || !shouldBuildPreview) return
    setDeviceBundling(true)
    fetch('/api/mobile-bundle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, force }),
    })
      .then(r => r.json())
      .then(d => { if ((d as { url?: string }).url) setDeviceBundleUrl((d as { url: string }).url) })
      .catch(() => { /* best-effort */ })
      .finally(() => setDeviceBundling(false))
  }, [projectId, shouldBuildPreview])

  // ── Trigger builds on file changes ───────────────────────────────────────

  useEffect(() => {
    if (isGenerating || !shouldBuildPreview) return
    if (mode === 'inapp') buildInApp()
    if (mode === 'wyberaigo') triggerDeviceBundle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles, mode])

  const refresh = () => {
    if (mode === 'inapp') { setBundleJs(null); buildInApp(true) }
    if (mode === 'wyberaigo') triggerDeviceBundle(true)
  }

  // ── Appetize build trigger ────────────────────────────────────────────────

  const triggerAppetizeBuild = async () => {
    if (!projectId) return
    setAppetizeTriggerLoading(true); setAppetizeError(null)
    try {
      const r = await fetch('/api/appetize/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const d = await r.json() as { status?: string; error?: string }
      if (!r.ok || d.error) { setAppetizeError(d.error || 'Failed to start build'); return }
      setAppetizeStatus((d.status as AppetizeStatus) ?? 'queued')
    } catch (e) {
      setAppetizeError(String(e))
    } finally {
      setAppetizeTriggerLoading(false)
    }
  }

  // ── Derived display state ─────────────────────────────────────────────────

  const loading = mode === 'inapp' ? bundleLoading : false
  const ready = mode === 'inapp' ? !!bundleJs : mode === 'wyberaigo' ? shouldBuildPreview : appetizeStatus === 'ready'
  const device = getDevice(deviceId)

  const statusText = isGenerating
    ? t('statusWritingApp')
    : mode === 'appetize'
      ? appetizeStatus === 'ready' ? 'Cloud device ready'
        : appetizeStatus === 'queued' ? 'Build queued…'
        : appetizeStatus === 'building' ? 'Building APK…'
        : appetizeStatus === 'error' ? 'Build failed'
        : 'Cloud device preview'
      : mode === 'wyberaigo'
        ? deviceBundling ? 'Pre-bundling for device…'
          : deviceBundleUrl ? 'Ready on device'
          : shouldBuildPreview ? 'Open WyberAi on your phone'
          : t('statusDescribeApp')
        : loading
          ? t('statusStartingLivePreview')
          : ready
            ? t('statusPreviewReady')
            : t('statusDescribeApp')

  const dotColor = isGenerating ? '#f59e0b'
    : mode === 'appetize'
      ? appetizeStatus === 'ready' ? '#22c55e'
        : (appetizeStatus === 'queued' || appetizeStatus === 'building') ? '#f59e0b'
        : appetizeStatus === 'error' ? '#ef4444'
        : '#3f3f46'
      : mode === 'wyberaigo'
        ? deviceBundleUrl ? '#22c55e' : deviceBundling ? '#f59e0b' : '#3f3f46'
        : ready ? '#22c55e'
          : (loading || isGenerating) ? '#f59e0b'
          : '#3f3f46'

  const phoneHeight = Math.min(812, (typeof window !== 'undefined' ? window.innerHeight : 780) - 80)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, transition: 'all 0.3s', flexShrink: 0 }} />

        <Segmented
          value={mode}
          onChange={v => chooseMode(v as PreviewMode)}
          options={[
            { v: 'inapp',      label: 'In-App' },
            { v: 'wyberaigo',  label: '📱 WyberAi Go' },
            { v: 'appetize',   label: '✦ Cloud Device' },
            { v: 'apk',        label: '🔨 APK Build', badge: '50 cr' },
            { v: 'ipa',        label: '🍎 IPA Build', badge: '50 cr' },
          ]}
        />

        {mode === 'inapp' && (
          <>
            <Segmented
              value={platform}
              onChange={v => {
                const os = v as DeviceOS
                setPlatform(os)
                if (getDevice(deviceId).os !== os) setDeviceId(devicesForOS(os)[0].id)
              }}
              options={[{ v: 'ios', label: 'iOS' }, { v: 'android', label: 'Android' }]}
            />
            <select
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              style={{ background: '#1a1a22', color: '#d4d4d8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, fontSize: 11, padding: '3px 6px', cursor: 'pointer', outline: 'none' }}
            >
              {devicesForOS(platform).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </>
        )}

        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace', minWidth: 80, textAlign: 'right' }}>{statusText}</span>

        {shouldBuildPreview && !isGenerating && !loading && mode !== 'appetize' && (
          <button onClick={refresh} title={t('rebuildPreviewTitle')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>⟳</button>
        )}

        {mode === 'appetize' && (appetizeStatus === 'ready' || appetizeStatus === 'error') && (
          <button
            onClick={triggerAppetizeBuild}
            disabled={appetizeTriggerLoading}
            title="Rebuild with latest code"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
          >⟳</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Empty state */}
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="12" y="2" width="24" height="44" rx="5" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)" />
              <rect x="20" y="6" width="8" height="2" rx="1" fill="rgba(14,165,233,0.4)" />
              <circle cx="24" cy="42" r="2" fill="rgba(14,165,233,0.3)" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>{t('mobilePreviewEmptyTitle')}</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>{t('mobilePreviewEmptyDesc')}</div>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>{t('statusWritingApp')}</div>
          </div>
        )}

        {/* ── In-App preview (react-native-web) ── */}
        {!isGenerating && shouldBuildPreview && mode === 'inapp' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ErrorBoundary fallbackMessage="The mobile preview hit an error — your app and editor are unaffected">
              {error ? (
                <PreviewError error={error} onRetry={refresh} />
              ) : (
                <DeviceFrame device={device} js={bundleJs} platform={platform} />
              )}
            </ErrorBoundary>
          </div>
        )}

        {/* ── WyberAi Go ── */}
        {!isGenerating && mode === 'wyberaigo' && (
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#09090b' }}>
            <WyberAiGoCta
              projectId={projectId}
              hasApp={shouldBuildPreview}
              bundling={deviceBundling}
              bundleUrl={deviceBundleUrl}
              phoneHeight={phoneHeight}
              credits={credits}
              files={files}
            />
          </div>
        )}

        {/* ── Cloud Device (Appetize) ── */}
        {!isGenerating && mode === 'appetize' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
            {appetizeStatus === 'ready' && appetizeBuildId ? (
              <AppetizeEmbed buildId={appetizeBuildId} />
            ) : appetizeStatus === 'queued' || appetizeStatus === 'building' ? (
              <AppetizeBuilding status={appetizeStatus} />
            ) : appetizeStatus === 'error' ? (
              <AppetizeError error={appetizeError} onRetry={triggerAppetizeBuild} loading={appetizeTriggerLoading} />
            ) : (
              <AppetizeIdle onBuild={triggerAppetizeBuild} loading={appetizeTriggerLoading} hasProject={!!projectId} />
            )}
          </div>
        )}

        {/* ── APK Build ── */}
        {!isGenerating && mode === 'apk' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
            {apkStatus === 'ready' && apkUrl ? (
              <MobileBuildReady platform="apk" buildUrl={apkUrl} />
            ) : apkStatus === 'queued' || apkStatus === 'building' ? (
              <MobileBuildProgress status={apkStatus} />
            ) : apkStatus === 'error' ? (
              <MobileBuildError error={apkError} onRetry={triggerApkBuild} loading={buildLoading} />
            ) : (
              <MobileBuildIdle
                platform="apk"
                cost={APK_BUILD_COST}
                onBuild={triggerApkBuild}
                loading={buildLoading}
                hasProject={!!projectId}
                hasCredits={credits >= APK_BUILD_COST}
              />
            )}
          </div>
        )}

        {/* ── IPA Build ── */}
        {!isGenerating && mode === 'ipa' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
            {ipaStatus === 'ready' && ipaUrl ? (
              <MobileBuildReady platform="ipa" buildUrl={ipaUrl} />
            ) : ipaStatus === 'queued' || ipaStatus === 'building' ? (
              <MobileBuildProgress status={ipaStatus} />
            ) : ipaStatus === 'error' ? (
              <MobileBuildError error={ipaError} onRetry={triggerIpaBuild} loading={buildLoading} />
            ) : (
              <MobileBuildIdle
                platform="ipa"
                cost={IPA_BUILD_COST}
                onBuild={triggerIpaBuild}
                loading={buildLoading}
                hasProject={!!projectId}
                hasCredits={credits >= IPA_BUILD_COST}
              />
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── WyberAi Go panel ─────────────────────────────────────────────────────────

function WyberAiGoCta({
  projectId, hasApp, bundling, bundleUrl, phoneHeight, credits, files,
}: {
  projectId?: string
  hasApp: boolean
  bundling: boolean
  bundleUrl: string | null
  phoneHeight: number
  credits: number
  files: Record<string, { content?: string }>
}) {
  const deepLink = projectId ? `wyberai://project/${projectId}` : null
  const qrData = deepLink ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(deepLink)}&margin=10&color=0-0-0&bgcolor=ffffff` : null
  // Must match what the server will actually charge (same heuristic, same
  // shared module) — a mismatch here is exactly what let the QR show
  // "unlocked" while the server still charged the higher game rate and
  // 402'd the viewer mid-scan.
  const previewAccessCost = detectGame(files) ? PREVIEW_ACCESS_GAME_COST : PREVIEW_ACCESS_APP_COST
  const creditsLocked = credits < previewAccessCost

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, minHeight: phoneHeight,
    }}>
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* Status badge */}
        {hasApp ? (
          <div style={{ background: bundleUrl ? 'rgba(34,197,94,0.1)' : bundling ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)', border: `1px solid ${bundleUrl ? 'rgba(34,197,94,0.25)' : bundling ? 'rgba(245,158,11,0.25)' : 'rgba(14,165,233,0.25)'}`, borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: bundleUrl ? '#22c55e' : bundling ? '#f59e0b' : '#0EA5E9' }} />
            <span style={{ color: bundleUrl ? '#86efac' : bundling ? '#fcd34d' : '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
              {bundleUrl ? 'READY ON DEVICE' : bundling ? 'PRE-BUNDLING…' : 'APP BUILT'}
            </span>
          </div>
        ) : null}

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Preview on your phone
          </div>
          <div style={{ color: '#71717a', fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>
            {hasApp
              ? 'Open WyberAi on your phone — your project is ready to preview.'
              : 'Describe your app above to build it, then preview it on your real device.'}
          </div>
        </div>

        {/* QR code + instructions */}
        {hasApp && deepLink && qrData && creditsLocked ? (
          <>
            {/* Locked state — builder is out of credits, so sharing this
                preview would charge a viewer's scan against a balance that
                can't cover it. Blurred placeholder instead of a QR that 402s. */}
            <div style={{ position: 'relative', width: 180, height: 180, borderRadius: 14, background: '#fff', filter: 'blur(6px)', opacity: 0.35 }} />
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: -140 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="#f4f4f5" strokeWidth="1.8" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="#f4f4f5" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
            <div style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: 4 }}>
              Add credits to share previews
            </div>
            <div style={{ color: '#71717a', fontSize: 11.5, textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
              Each preview scan costs {previewAccessCost} credits from your balance — top up to let people open this on their phone again.
            </div>
            <a
              href="/pricing"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: '#0EA5E9', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700 }}
            >
              Add Credits
            </a>
          </>
        ) : hasApp && deepLink && qrData && (
          <>
            {/* QR */}
            <div style={{ background: '#fff', padding: 10, borderRadius: 14, lineHeight: 0, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              <img src={qrData} width={160} height={160} alt="Scan to open in WyberAi" style={{ display: 'block', borderRadius: 6 }} loading="lazy" />
            </div>
            <div style={{ color: '#52525b', fontSize: 11, textAlign: 'center' }}>
              Scan with your phone's camera to open this project directly
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ color: '#3f3f46', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {[
                ['1', 'Open WyberAi on your phone'],
                ['2', 'Find this project in My Apps'],
                ['3', 'Tap Preview to see it live'],
              ].map(([n, label]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#0EA5E9', fontSize: 11, fontWeight: 700 }}>{n}</span>
                  </div>
                  <span style={{ color: '#a1a1aa', fontSize: 12 }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Download CTA — real APK, not yet on Google Play */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 20, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9' }} />
            <span style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>COMING TO GOOGLE PLAY</span>
          </div>
          <a
            href={WYBERAI_APP_APK_URL}
            download
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 16px', color: '#e4e4e7', fontSize: 12.5, fontWeight: 600 }}
          >
            <PlayStoreIcon />
            Download the app (Android APK)
          </a>
          <div style={{ color: '#3f3f46', fontSize: 10.5, textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
            Not on Google Play yet — this installs directly. Your phone may ask you to allow installs from this source once.
          </div>
        </div>

        {/* Pre-bundle info */}
        {bundling && (
          <div style={{ color: '#52525b', fontSize: 10, textAlign: 'center', fontStyle: 'italic' }}>
            Pre-bundling your app for instant loading on device…
          </div>
        )}
      </div>
    </div>
  )
}

function PlayStoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3.18 23.3c.41.23.87.25 1.29.08l11.1-11.1-2.72-2.72L3.18 23.3z" fill="#EA4335"/>
      <path d="M21.54 10.42l-3.08-1.75-3.06 3.06 3.06 3.06 3.1-1.75a1.74 1.74 0 000-2.62z" fill="#FBBC05"/>
      <path d="M2.01 1.41A1.74 1.74 0 001.5 2.7v18.6c0 .5.19.95.51 1.3l.07.07 10.42-10.41v-.24L2.08 1.6l-.07-.19z" fill="#4285F4"/>
      <path d="M15.57 9.73L12.5 6.66 2.08 1.41c.42-.18.9-.15 1.3.08l12.19 6.9-3.08 3.08.67-1.74z" fill="#34A853"/>
    </svg>
  )
}

// ── Appetize sub-components ─────────────────────────────────────────────────

function AppetizeEmbed({ buildId }: { buildId: string }) {
  const src = `https://appetize.io/embed/${buildId}?device=pixel7&osVersion=14.0&scale=auto&autoplay=true&screenOnly=true&centered=both&grantPermissions=true&debug=false`
  return (
    <iframe
      src={src}
      title="Cloud device preview"
      allow="clipboard-read; clipboard-write"
      style={{ flex: 1, border: 'none', width: '100%', height: '100%', background: '#000' }}
    />
  )
}

function AppetizeBuilding({ status }: { status: 'queued' | 'building' }) {
  const steps = [
    { id: 'pack',  label: 'Packaging source code',    done: status === 'building' },
    { id: 'build', label: 'Compiling Android APK',     done: false },
    { id: 'up',    label: 'Uploading to cloud device', done: false },
  ]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32 }}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="16" y="4" width="32" height="56" rx="6" stroke="rgba(14,165,233,0.4)" strokeWidth="1.5" fill="rgba(14,165,233,0.06)" />
          <rect x="26" y="9" width="12" height="2.5" rx="1.25" fill="rgba(14,165,233,0.5)" />
          <circle cx="32" cy="55" r="2.5" fill="rgba(14,165,233,0.4)" />
          <rect x="20" y="16" width="24" height="30" rx="2" fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.2)" strokeWidth="0.8" />
        </svg>
        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#e4e4e7', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {status === 'queued' ? 'Build queued' : 'Building your app…'}
        </div>
        <div style={{ color: '#52525b', fontSize: 12, lineHeight: 1.6, maxWidth: 240 }}>
          Compiling to a real Android APK. Takes about 3–5 minutes.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 260 }}>
        {steps.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: s.done ? 'rgba(34,197,94,0.15)' : 'rgba(14,165,233,0.1)',
              border: `1px solid ${s.done ? 'rgba(34,197,94,0.4)' : 'rgba(14,165,233,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.done && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: s.done ? '#86efac' : '#52525b' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppetizeIdle({ onBuild, loading, hasProject }: {
  onBuild: () => void; loading: boolean; hasProject: boolean
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '24px 28px' }}>
      <div style={{ position: 'relative' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect x="18" y="5" width="36" height="62" rx="7" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)" />
          <rect x="29" y="10" width="14" height="3" rx="1.5" fill="rgba(14,165,233,0.4)" />
          <circle cx="36" cy="63" r="3" fill="rgba(14,165,233,0.3)" />
          <rect x="22" y="18" width="28" height="36" rx="3" fill="rgba(14,165,233,0.07)" stroke="rgba(14,165,233,0.18)" strokeWidth="0.8" />
          <path d="M36 26 L37.5 31 L42 32 L37.5 33 L36 38 L34.5 33 L30 32 L34.5 31 Z" fill="rgba(14,165,233,0.6)" />
        </svg>
        <div style={{ position: 'absolute', top: -4, right: -8, background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', borderRadius: 8, padding: '2px 7px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>PRO</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Cloud Device Preview</div>
        <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.7, maxWidth: 230 }}>
          Run your app on a real Pixel 7 (Android 14) — streamed from an actual device.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 250 }}>
        {[{ icon: '⚡', label: 'Real hardware — not a simulator' }, { icon: '👆', label: 'Tap, swipe, scroll, type' }, { icon: '📸', label: 'Screenshot & share' }].map(f => (
          <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{f.label}</span>
          </div>
        ))}
      </div>
      {hasProject ? (
        <button onClick={onBuild} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 260, padding: '14px 20px', borderRadius: 14, border: 'none', background: loading ? '#1c1c2e' : 'linear-gradient(135deg, #7c3aed 0%, #0EA5E9 100%)', color: loading ? '#52525b' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.02em', boxShadow: loading ? 'none' : '0 8px 28px rgba(14,165,233,0.3)' }}>
          {loading ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Starting build…</>) : '✦ Build Cloud Preview'}
        </button>
      ) : (
        <div style={{ color: '#3f3f46', fontSize: 11, textAlign: 'center' }}>Save your project first to build a cloud preview</div>
      )}
      <div style={{ color: '#3f3f46', fontSize: 10, textAlign: 'center' }}>~3–5 min build · Appetize.io</div>
    </div>
  )
}

function AppetizeError({ error, onRetry, loading }: { error: string | null; onRetry: () => void; loading: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✕</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Build failed</div>
        {error && <div style={{ color: '#71717a', fontSize: 11, fontFamily: 'monospace', maxWidth: 260, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{error}</div>}
      </div>
      <button onClick={onRetry} disabled={loading} style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Retrying…' : 'Retry Build'}
      </button>
    </div>
  )
}

// ── Mobile build sub-components ────────────────────────────────────────────

function MobileBuildIdle({
  platform, cost, onBuild, loading, hasProject, hasCredits,
}: {
  platform: 'apk' | 'ipa'
  cost: number
  onBuild: () => void
  loading: boolean
  hasProject: boolean
  hasCredits: boolean
}) {
  const platformName = platform === 'apk' ? 'Android APK' : 'iOS IPA'
  const platformIcon = platform === 'apk' ? '🔨' : '🍎'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '24px 28px' }}>
      <div style={{ position: 'relative' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect x="18" y="5" width="36" height="62" rx="7" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)" />
          <rect x="29" y="10" width="14" height="3" rx="1.5" fill="rgba(14,165,233,0.4)" />
          <circle cx="36" cy="63" r="3" fill="rgba(14,165,233,0.3)" />
          <rect x="22" y="18" width="28" height="36" rx="3" fill="rgba(14,165,233,0.07)" stroke="rgba(14,165,233,0.18)" strokeWidth="0.8" />
        </svg>
        <div style={{ position: 'absolute', top: -4, right: -8, background: 'linear-gradient(135deg, #8b5cf6 0%, #0EA5E9 100%)', borderRadius: 8, padding: '2px 7px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>PREMIUM</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>{platformIcon} {platformName} Build</div>
        <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.7, maxWidth: 240 }}>
          {platform === 'apk'
            ? 'Compile to a real Android APK. Sign in with your GitHub account to start building.'
            : 'Compile to a real iOS IPA. Requires TestFlight or Apple Developer account.'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 260 }}>
        {platform === 'apk'
          ? [{ icon: '🤖', label: 'Real Android APK (compilable)' }, { icon: '🔗', label: 'GitHub authentication required' }, { icon: '📥', label: 'Download & install on device' }]
          : [{ icon: '🍏', label: 'Real iOS IPA (compilable)' }, { icon: '🔗', label: 'GitHub authentication required' }, { icon: '📦', label: 'Upload to TestFlight' }]
        }.map(f => (
          <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{f.label}</span>
          </div>
        ))}
      </div>
      {hasProject ? (
        <>
          <button
            onClick={onBuild}
            disabled={loading || !hasCredits}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              maxWidth: 260,
              padding: '14px 20px',
              borderRadius: 14,
              border: 'none',
              background: loading || !hasCredits ? '#1c1c2e' : 'linear-gradient(135deg, #8b5cf6 0%, #0EA5E9 100%)',
              color: loading || !hasCredits ? '#52525b' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || !hasCredits ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.02em',
              boxShadow: loading || !hasCredits ? 'none' : '0 8px 28px rgba(14,165,233,0.3)',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Starting build…
              </>
            ) : (
              `${platformIcon} Build ${platformName} (${cost} credits)`
            )}
          </button>
          {!hasCredits && <div style={{ color: '#fca5a5', fontSize: 11, textAlign: 'center' }}>Insufficient credits (need {cost})</div>}
        </>
      ) : (
        <div style={{ color: '#3f3f46', fontSize: 11, textAlign: 'center' }}>Save your project first to build</div>
      )}
      <div style={{ color: '#3f3f46', fontSize: 10, textAlign: 'center' }}>~5–10 min build time · Uses Expo EAS</div>
    </div>
  )
}

function MobileBuildProgress({ status }: { status: 'queued' | 'building' }) {
  const steps = [
    { id: 'pack', label: 'Packaging source code', done: status === 'building' },
    { id: 'compile', label: 'Compiling native code', done: false },
    { id: 'up', label: 'Finalizing build', done: false },
  ]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32 }}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="16" y="4" width="32" height="56" rx="6" stroke="rgba(14,165,233,0.4)" strokeWidth="1.5" fill="rgba(14,165,233,0.06)" />
          <rect x="26" y="9" width="12" height="2.5" rx="1.25" fill="rgba(14,165,233,0.5)" />
          <circle cx="32" cy="55" r="2.5" fill="rgba(14,165,233,0.4)" />
          <rect x="20" y="16" width="24" height="30" rx="2" fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.2)" strokeWidth="0.8" />
        </svg>
        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#e4e4e7', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {status === 'queued' ? 'Build queued' : 'Compiling your app…'}
        </div>
        <div style={{ color: '#52525b', fontSize: 12, lineHeight: 1.6, maxWidth: 240 }}>
          Building a native executable. This takes about 5–10 minutes.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 260 }}>
        {steps.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: s.done ? 'rgba(34,197,94,0.15)' : 'rgba(14,165,233,0.1)',
              border: `1px solid ${s.done ? 'rgba(34,197,94,0.4)' : 'rgba(14,165,233,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.done && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: s.done ? '#86efac' : '#52525b' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MobileBuildReady({ platform, buildUrl }: { platform: 'apk' | 'ipa'; buildUrl: string }) {
  const platformName = platform === 'apk' ? 'Android APK' : 'iOS IPA'
  const instructions = platform === 'apk'
    ? ['Connect your Android device via USB or enable Developer Mode', 'Download the file, transfer to device', 'Install & allow installation from unknown sources']
    : ['Download the file to your Mac', 'Open in Xcode or Apple Configurator', 'Deploy to your device or simulator']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '24px 28px', overflowY: 'auto' }}>
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ color: '#86efac', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>BUILD COMPLETE</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Ready to download</div>
          <div style={{ color: '#71717a', fontSize: 13, lineHeight: 1.6 }}>Your {platformName} is compiled and ready for installation.</div>
        </div>

        <a
          href={buildUrl}
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #0EA5E9 100%)',
            borderRadius: 12,
            padding: '14px 24px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
            cursor: 'pointer',
          }}
        >
          <span>⬇️</span>
          Download {platformName}
        </a>

        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginTop: 8 }} />

        <div style={{ width: '100%' }}>
          <div style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>INSTALLATION STEPS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {instructions.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ color: '#0EA5E9', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                </div>
                <span style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileBuildError({ error, onRetry, loading }: { error: string | null; onRetry: () => void; loading: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✕</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Build failed</div>
        {error && <div style={{ color: '#71717a', fontSize: 11, fontFamily: 'monospace', maxWidth: 260, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{error}</div>}
      </div>
      <button onClick={onRetry} disabled={loading} style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Retrying…' : 'Retry Build'}
      </button>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { v: string; label: string; badge?: string }[]
}) {
  return (
    <div style={{ display: 'inline-flex', background: '#0c0c12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 2, gap: 2, flexWrap: 'wrap' }}>
      {options.map(o => (
        <div key={o.v} style={{ position: 'relative' }}>
          <button onClick={() => onChange(o.v)} style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: value === o.v
              ? (o.v === 'appetize' ? 'linear-gradient(135deg, #7c3aed 0%, #0EA5E9 100%)' : '#0EA5E9')
              : 'transparent',
            color: value === o.v ? '#fff' : '#71717a',
          }}>{o.label}</button>
          {o.badge && (
            <div style={{
              position: 'absolute', top: -6, right: -6, background: '#f59e0b', color: '#000', fontSize: 8, fontWeight: 700,
              borderRadius: 10, padding: '2px 5px', letterSpacing: '0.05em', whiteSpace: 'nowrap',
            }}>
              {o.badge}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PreviewError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const t = useT(EDITOR_MOBILE_STRINGS)
  const tc = useT(COMMON_STRINGS)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1a0505', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ff6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>{t('previewErrorLabel')}</strong>{error}
      </div>
      <button onClick={onRetry} style={{ alignSelf: 'flex-start', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>{tc('retry')} ⟳</button>
    </div>
  )
}

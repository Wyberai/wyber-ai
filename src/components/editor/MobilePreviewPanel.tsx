'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { DeviceFrame } from './DeviceFrame'
import { DEFAULT_DEVICE_ID, devicesForOS, getDevice, type DeviceOS } from '@/lib/devices'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_MOBILE_STRINGS } from '@/lib/i18n/dict/editor-mobile'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

type PreviewMode = 'snack' | 'inapp' | 'appetize'
type AppetizeStatus = 'idle' | 'queued' | 'building' | 'ready' | 'error'

// Default: 'snack' — the phone frame shows a clean Expo Go CTA (QR code +
// big button) so users can run their actual app on a real device instantly.
const DEFAULT_MODE: PreviewMode = 'snack'

const POLL_INTERVAL_MS = 6000 // poll every 6s while building

interface Props {
  projectId?: string
}

export function MobilePreviewPanel({ projectId }: Props) {
  const { files, isGenerating, hasGeneratedFiles } = useEditorStore()
  const t = useT(EDITOR_MOBILE_STRINGS)

  const [mode, setMode] = useState<PreviewMode>(DEFAULT_MODE)
  const [platform, setPlatform] = useState<DeviceOS>('ios')
  const [deviceId, setDeviceId] = useState<string>(DEFAULT_DEVICE_ID)

  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [snackLoading, setSnackLoading] = useState(false)

  const [bundleJs, setBundleJs] = useState<string | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)

  // Appetize state
  const [appetizeStatus, setAppetizeStatus] = useState<AppetizeStatus>('idle')
  const [appetizeBuildId, setAppetizeBuildId] = useState<string | null>(null)
  const [appetizeTriggerLoading, setAppetizeTriggerLoading] = useState(false)
  const [appetizeError, setAppetizeError] = useState<string | null>(null)
  const appetizePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<Record<'snack' | 'inapp', string>>({ snack: '', inapp: '' })

  // v7: added 'appetize' mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wyber:mobile-preview-mode:v7')
      if (saved === 'snack' || saved === 'inapp' || saved === 'appetize') setMode(saved)
    } catch { /* private mode */ }
  }, [])

  const chooseMode = (m: PreviewMode) => {
    setMode(m)
    try { localStorage.setItem('wyber:mobile-preview-mode:v7', m) } catch { /* private mode */ }
  }

  // ── Appetize status polling ──────────────────────────────────────────────

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

  // Load appetize status when the component mounts (or projectId changes)
  useEffect(() => {
    if (!projectId) return
    fetchAppetizeStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Start polling when mode = appetize and build is in flight
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

  // ── Snack / In-App helpers (unchanged) ──────────────────────────────────

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

  const buildSnack = useCallback((force = false) => {
    if (!shouldBuildPreview) return
    const f = plainFiles()
    const key = filesKey(f)
    if (!force && key === lastKeyRef.current.snack && embedUrl) return
    lastKeyRef.current.snack = key
    setError(null); setSnackLoading(true)
    fetch('/api/snack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: f }) })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        if (d.snackUrl) setSnackUrl(d.snackUrl)
        if (d.embedUrl) setEmbedUrl(d.embedUrl)
      })
      .catch(e => setError(String(e)))
      .finally(() => setSnackLoading(false))
  }, [shouldBuildPreview, plainFiles, filesKey, embedUrl])

  const buildInApp = useCallback((force = false) => {
    if (!shouldBuildPreview) return
    const f = plainFiles()
    const key = filesKey(f)
    if (!force && key === lastKeyRef.current.inapp && bundleJs) return
    lastKeyRef.current.inapp = key
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

  useEffect(() => {
    if (isGenerating || !shouldBuildPreview) return
    buildSnack()
    if (mode === 'inapp') buildInApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles, mode])

  const refresh = () => {
    setSnackUrl(null); setEmbedUrl(null); buildSnack(true)
    if (mode === 'inapp') { setBundleJs(null); buildInApp(true) }
  }

  // ── Appetize build trigger ───────────────────────────────────────────────

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
      if (!r.ok || d.error) {
        setAppetizeError(d.error || 'Failed to start build')
        return
      }
      setAppetizeStatus((d.status as AppetizeStatus) ?? 'queued')
    } catch (e) {
      setAppetizeError(String(e))
    } finally {
      setAppetizeTriggerLoading(false)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const loading = mode === 'snack' ? snackLoading : (snackLoading || bundleLoading)
  const ready = mode === 'snack' ? !!snackUrl : (mode === 'inapp' ? !!bundleJs : appetizeStatus === 'ready')
  const device = getDevice(deviceId)

  const statusText = isGenerating
    ? t('statusWritingApp')
    : mode === 'appetize'
      ? appetizeStatus === 'ready' ? 'Real device ready'
        : appetizeStatus === 'queued' ? 'Build queued…'
        : appetizeStatus === 'building' ? 'Building APK…'
        : appetizeStatus === 'error' ? 'Build failed'
        : 'Real device preview'
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
      : ready ? '#22c55e'
        : (loading || isGenerating) ? '#f59e0b'
        : '#3f3f46'

  const phoneHeight = Math.min(812, (typeof window !== 'undefined' ? window.innerHeight : 780) - 80)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, transition: 'all 0.3s', flexShrink: 0 }} />

        {/* Mode toggle */}
        <Segmented
          value={mode}
          onChange={v => chooseMode(v as PreviewMode)}
          options={[
            { v: 'snack',    label: 'Expo Go' },
            { v: 'inapp',    label: 'In-App' },
            { v: 'appetize', label: '✦ Real Device' },
          ]}
        />

        {/* In-app: platform toggle + device dropdown */}
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

        {/* ── Expo Go mode ── */}
        {!isGenerating && shouldBuildPreview && mode === 'snack' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', padding: 16 }}>
            <div style={{ width: 375, maxWidth: '100%', height: phoneHeight, borderRadius: 40, overflow: 'hidden', boxShadow: '0 0 0 8px #1a1a1a, 0 0 0 9px #333, 0 30px 80px rgba(0,0,0,0.6)', border: '1px solid #222', background: '#000', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 28, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 90, height: 20, background: '#0a0a0a', borderRadius: 10 }} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {snackLoading && (
                  <Centered dark>
                    <Spinner small />
                    <span style={{ fontSize: 11, color: '#52525b' }}>Uploading to Expo…</span>
                  </Centered>
                )}
                {error && !snackLoading && <PreviewError error={error} onRetry={refresh} />}
                {snackUrl && !snackLoading && !error && <ExpoGoCta snackUrl={snackUrl} />}
              </div>
            </div>
          </div>
        )}

        {/* ── In-app preview (RN-web) ── */}
        {!isGenerating && shouldBuildPreview && mode === 'inapp' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ErrorBoundary fallbackMessage="The mobile preview hit an error — your app and editor are unaffected">
              {error ? (
                <PreviewError error={error} onRetry={refresh} />
              ) : (
                <DeviceFrame device={device} js={bundleJs} platform={platform} />
              )}
            </ErrorBoundary>

            {snackUrl && !bundleLoading && (
              <a
                href={snackUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 16px', textDecoration: 'none',
                  background: 'rgba(9,9,11,0.95)', borderTop: '1px solid rgba(14,165,233,0.2)',
                  color: '#38bdf8', fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                }}
              >
                📱 Test on real device with Expo Go →
              </a>
            )}
          </div>
        )}

        {/* ── Real Device (Appetize) ── */}
        {!isGenerating && mode === 'appetize' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
            {appetizeStatus === 'ready' && appetizeBuildId ? (
              <AppetizeEmbed buildId={appetizeBuildId} />
            ) : appetizeStatus === 'queued' || appetizeStatus === 'building' ? (
              <AppetizeBuilding status={appetizeStatus} />
            ) : appetizeStatus === 'error' ? (
              <AppetizeError
                error={appetizeError}
                onRetry={triggerAppetizeBuild}
                loading={appetizeTriggerLoading}
              />
            ) : (
              <AppetizeIdle
                onBuild={triggerAppetizeBuild}
                loading={appetizeTriggerLoading}
                hasProject={!!projectId}
              />
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Appetize sub-components ──────────────────────────────────────────────────

function AppetizeEmbed({ buildId }: { buildId: string }) {
  const src = `https://appetize.io/embed/${buildId}?device=pixel7&osVersion=14.0&scale=auto&autoplay=true&screenOnly=true&centered=both&grantPermissions=true&debug=false`
  return (
    <iframe
      src={src}
      title="Real device preview"
      allow="clipboard-read; clipboard-write"
      style={{ flex: 1, border: 'none', width: '100%', height: '100%', background: '#000' }}
    />
  )
}

function AppetizeBuilding({ status }: { status: 'queued' | 'building' }) {
  const steps = [
    { id: 'pack',  label: 'Packaging source code',      done: status === 'building' },
    { id: 'build', label: 'Compiling Android APK',       done: false },
    { id: 'up',    label: 'Uploading to device cloud',   done: false },
  ]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32 }}>
      {/* Animated device icon */}
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
          Compiling to a real Android APK.<br />Takes about 3–5 minutes.
        </div>
      </div>

      {/* Step indicators */}
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
      {/* Icon */}
      <div style={{ position: 'relative' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect x="18" y="5" width="36" height="62" rx="7" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)" />
          <rect x="29" y="10" width="14" height="3" rx="1.5" fill="rgba(14,165,233,0.4)" />
          <circle cx="36" cy="63" r="3" fill="rgba(14,165,233,0.3)" />
          <rect x="22" y="18" width="28" height="36" rx="3" fill="rgba(14,165,233,0.07)" stroke="rgba(14,165,233,0.18)" strokeWidth="0.8" />
          {/* Sparkle */}
          <path d="M36 26 L37.5 31 L42 32 L37.5 33 L36 38 L34.5 33 L30 32 L34.5 31 Z" fill="rgba(14,165,233,0.6)" />
        </svg>
        {/* PRO badge */}
        <div style={{
          position: 'absolute', top: -4, right: -8,
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          borderRadius: 8, padding: '2px 7px', fontSize: 9, fontWeight: 800,
          color: '#fff', letterSpacing: '0.06em',
        }}>PRO</div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Real Device Preview
        </div>
        <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.7, maxWidth: 230 }}>
          Run your app on a real Pixel 7 (Android 14) — stream from an actual device, no emulation.
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 250 }}>
        {[
          { icon: '⚡', label: 'Real hardware — not a simulator' },
          { icon: '👆', label: 'Tap, swipe, scroll, type' },
          { icon: '📸', label: 'Screenshot & share' },
        ].map(f => (
          <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {hasProject ? (
        <button
          onClick={onBuild}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', maxWidth: 260, padding: '14px 20px', borderRadius: 14, border: 'none',
            background: loading ? '#1c1c2e' : 'linear-gradient(135deg, #7c3aed 0%, #0EA5E9 100%)',
            color: loading ? '#52525b' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.02em', boxShadow: loading ? 'none' : '0 8px 28px rgba(14,165,233,0.3)',
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Starting build…
            </>
          ) : (
            '✦ Build Real Preview'
          )}
        </button>
      ) : (
        <div style={{ color: '#3f3f46', fontSize: 11, textAlign: 'center' }}>
          Save your project first to build a real preview
        </div>
      )}

      <div style={{ color: '#3f3f46', fontSize: 10, textAlign: 'center' }}>
        ~3–5 min build · powered by Appetize.io
      </div>
    </div>
  )
}

function AppetizeError({ error, onRetry, loading }: {
  error: string | null; onRetry: () => void; loading: boolean
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✕</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Build failed</div>
        {error && <div style={{ color: '#71717a', fontSize: 11, fontFamily: 'monospace', maxWidth: 260, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{error}</div>}
      </div>
      <button
        onClick={onRetry}
        disabled={loading}
        style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Retrying…' : 'Retry Build'}
      </button>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function ExpoGoCta({ snackUrl }: { snackUrl: string }) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(snackUrl)}&margin=8`
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '24px 28px', background: '#0c0c14',
    }}>
      <div style={{
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>APP READY</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.03em' }}>
          Test on your device
        </div>
        <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.6, maxWidth: 220 }}>
          Open in Expo Go for the full interactive experience on iOS or Android
        </div>
      </div>

      <a
        href={snackUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', maxWidth: 270, textDecoration: 'none',
          background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
          color: '#fff', borderRadius: 14, padding: '15px 20px',
          fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em',
          boxShadow: '0 8px 28px rgba(14,165,233,0.35)',
        }}
      >
        📱 Open in Expo Go →
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 270 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ color: '#3f3f46', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600 }}>OR SCAN</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <div style={{ background: '#fff', padding: 10, borderRadius: 14, lineHeight: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <img src={qr} width={130} height={130} alt="Scan to open in Expo Go" style={{ display: 'block', borderRadius: 6 }} loading="lazy" />
      </div>

      <div style={{ color: '#3f3f46', fontSize: 10, textAlign: 'center', letterSpacing: '0.02em' }}>
        Scan with Expo Go on iOS or Android
      </div>
    </div>
  )
}

function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { v: string; label: string }[]
}) {
  return (
    <div style={{ display: 'inline-flex', background: '#0c0c12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
          background: value === o.v
            ? (o.v === 'appetize' ? 'linear-gradient(135deg, #7c3aed 0%, #0EA5E9 100%)' : '#0EA5E9')
            : 'transparent',
          color: value === o.v ? '#fff' : '#71717a',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function Centered({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: dark ? '#0f0f14' : '#09090b' }}>{children}</div>
}

function Spinner({ small }: { small?: boolean }) {
  const s = small ? 22 : 28
  return <div style={{ width: s, height: s, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

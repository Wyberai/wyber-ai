'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { DeviceFrame } from './DeviceFrame'
import { DEVICES, DEFAULT_DEVICE_ID, devicesForOS, getDevice, type DeviceOS } from '@/lib/devices'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_MOBILE_STRINGS } from '@/lib/i18n/dict/editor-mobile'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

type PreviewMode = 'snack' | 'inapp'

// Default: 'inapp' — the in-house RN-web bundler runs the app directly in
// the phone frame so users can navigate and interact without leaving the editor.
// Expo Go QR/button remains available via the toggle for real-device testing.
const DEFAULT_MODE: PreviewMode = 'inapp'

export function MobilePreviewPanel() {
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

  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<Record<PreviewMode, string>>({ snack: '', inapp: '' })

  // v4: bumped to reset anyone stuck on the old 'inapp' default that showed
  // a broken layout, and anyone on 'snack' that showed the code editor.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wyber:mobile-preview-mode:v5')
      if (saved === 'snack' || saved === 'inapp') setMode(saved)
    } catch { /* private mode */ }
  }, [])

  const chooseMode = (m: PreviewMode) => {
    setMode(m)
    try { localStorage.setItem('wyber:mobile-preview-mode:v5', m) } catch { /* private mode */ }
  }

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
    Object.keys(f).sort().map(p => `${p}:${f[p].length}`).join('|'), [])

  // Always build snack so the Expo Go button/QR is available in both modes.
  const buildSnack = useCallback((force = false) => {
    if (!shouldBuildPreview) return
    const f = plainFiles()
    const key = filesKey(f)
    if (!force && key === lastKeyRef.current.snack && embedUrl) return
    lastKeyRef.current.snack = key
    setSnackLoading(true)
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
    // Always build snack for the Expo Go button regardless of active mode.
    buildSnack()
    if (mode === 'inapp') buildInApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles, mode])

  const refresh = () => {
    setSnackUrl(null); setEmbedUrl(null); buildSnack(true)
    if (mode === 'inapp') { setBundleJs(null); buildInApp(true) }
  }

  const loading = mode === 'snack' ? snackLoading : (snackLoading || bundleLoading)
  const ready = mode === 'snack' ? !!snackUrl : !!bundleJs
  const device = getDevice(deviceId)

  const statusText = isGenerating
    ? t('statusWritingApp')
    : loading
      ? t('statusStartingLivePreview')
      : ready
        ? t('statusPreviewReady')
        : t('statusDescribeApp')

  const phoneHeight = Math.min(812, (typeof window !== 'undefined' ? window.innerHeight : 780) - 80)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ready ? '#22c55e' : (loading || isGenerating) ? '#f59e0b' : '#3f3f46', transition: 'all 0.3s', flexShrink: 0 }} />

        {/* Mode toggle */}
        <Segmented
          value={mode}
          onChange={v => chooseMode(v as PreviewMode)}
          options={[{ v: 'inapp', label: 'In-App' }, { v: 'snack', label: 'Expo Go' }]}
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

        {shouldBuildPreview && !isGenerating && !loading && (
          <button onClick={refresh} title={t('rebuildPreviewTitle')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>⟳</button>
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

        {/* Expo Go mode — the phone frame shows a QR code + big "Open in Expo Go"
            button. Expo Snack's embedded iframe always shows its code editor in a
            narrow phone-frame viewport, so we show the CTA instead. */}
        {!isGenerating && shouldBuildPreview && mode === 'snack' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', padding: 16 }}>
            <div style={{ width: 375, maxWidth: '100%', height: phoneHeight, borderRadius: 40, overflow: 'hidden', boxShadow: '0 0 0 8px #1a1a1a, 0 0 0 9px #333, 0 30px 80px rgba(0,0,0,0.6)', border: '1px solid #222', background: '#000', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Phone notch */}
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

        {/* In-app preview (RN-web) — shown with a pinned "Test on device" bar so
            users can always get to the real Expo Go experience. */}
        {!isGenerating && shouldBuildPreview && mode === 'inapp' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ErrorBoundary fallbackMessage="The mobile preview hit an error — your app and editor are unaffected">
              {error ? (
                <PreviewError error={error} onRetry={refresh} />
              ) : (
                <DeviceFrame device={device} js={bundleJs} platform={platform} />
              )}
            </ErrorBoundary>

            {/* Pinned Expo Go prompt — always visible so users know where to go for
                the real thing. Loads after snack finishes in the background. */}
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
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/** Renders inside the phone frame when snack is ready. */
function ExpoGoCta({ snackUrl }: { snackUrl: string }) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(snackUrl)}&margin=8`
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '24px 28px', background: '#0c0c14',
    }}>
      {/* Ready pill */}
      <div style={{
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>APP READY</span>
      </div>

      {/* Headline */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.03em' }}>
          Test on your device
        </div>
        <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.6, maxWidth: 220 }}>
          Open in Expo Go for the full interactive experience on iOS or Android
        </div>
      </div>

      {/* Primary CTA */}
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

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 270 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ color: '#3f3f46', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600 }}>OR SCAN</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* QR code */}
      <div style={{ background: '#fff', padding: 10, borderRadius: 14, lineHeight: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <img
          src={qr}
          width={130}
          height={130}
          alt="Scan to open in Expo Go"
          style={{ display: 'block', borderRadius: 6 }}
          loading="lazy"
        />
      </div>

      <div style={{ color: '#3f3f46', fontSize: 10, textAlign: 'center', letterSpacing: '0.02em' }}>
        Scan with Expo Go on iOS or Android
      </div>
    </div>
  )
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div style={{ display: 'inline-flex', background: '#0c0c12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
          background: value === o.v ? '#0EA5E9' : 'transparent',
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

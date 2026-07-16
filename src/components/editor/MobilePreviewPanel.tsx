'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { DeviceFrame } from './DeviceFrame'
import { DEVICES, DEFAULT_DEVICE_ID, devicesForOS, getDevice, type DeviceOS } from '@/lib/devices'

type PreviewMode = 'snack' | 'inapp'

// Default preview mode. Ships 'snack' — the Expo Snack web player runs the REAL
// React Native runtime (real navigation/reanimated/gesture), so generated apps
// are genuinely interactive, not the static/screenshot-like output the in-house
// react-native-web shim layer produces. The in-house engine stays available as a
// fallback via the toggle. Set NEXT_PUBLIC_INAPP_MOBILE_PREVIEW=inapp to default
// back to it prod-wide. A per-user localStorage choice overrides either way.
const DEFAULT_MODE: PreviewMode =
  process.env.NEXT_PUBLIC_INAPP_MOBILE_PREVIEW === 'inapp' ? 'inapp' : 'snack'

export function MobilePreviewPanel() {
  const { files, isGenerating, hasGeneratedFiles } = useEditorStore()

  const [mode, setMode] = useState<PreviewMode>(DEFAULT_MODE)
  const [platform, setPlatform] = useState<DeviceOS>('ios')
  const [deviceId, setDeviceId] = useState<string>(DEFAULT_DEVICE_ID)

  // Snack (Expo) path state — embedUrl is the interactive web player we iframe;
  // snackUrl is the full editor / QR for testing on a real device.
  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [snackLoading, setSnackLoading] = useState(false)

  // In-app (RN-web) path state
  const [bundleJs, setBundleJs] = useState<string | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<Record<PreviewMode, string>>({ snack: '', inapp: '' })

  // Restore the user's saved mode (prod opt-in), once mounted.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wyber:mobile-preview-mode')
      if (saved === 'snack' || saved === 'inapp') setMode(saved)
    } catch { /* private mode */ }
  }, [])

  const chooseMode = (m: PreviewMode) => {
    setMode(m)
    try { localStorage.setItem('wyber:mobile-preview-mode', m) } catch { /* private mode */ }
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

  // Snack: upload to Expo, get a shareable/QR URL for real-device testing.
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

  // In-app: compile the RN app to a react-native-web bundle we render inline.
  // Re-bundles ONLY when files change — platform/device toggles are pure client
  // re-renders inside DeviceFrame.
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

  // Build the active mode when generation finishes or the user switches mode.
  useEffect(() => {
    if (isGenerating || !shouldBuildPreview) return
    if (mode === 'snack') buildSnack()
    else buildInApp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles, mode])

  const refresh = () => {
    if (mode === 'snack') { setSnackUrl(null); setEmbedUrl(null); buildSnack(true) }
    else { setBundleJs(null); buildInApp(true) }
  }

  const loading = mode === 'snack' ? snackLoading : bundleLoading
  const ready = mode === 'snack' ? !!embedUrl : !!bundleJs
  const device = getDevice(deviceId)

  const statusText = isGenerating
    ? 'Writing your app…'
    : loading
      ? (mode === 'snack' ? 'Starting live preview…' : 'Building preview…')
      : ready
        ? 'Preview ready'
        : 'Describe your app to get started'

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ready ? '#22c55e' : (loading || isGenerating) ? '#f59e0b' : '#3f3f46', transition: 'all 0.3s', flexShrink: 0 }} />

        {/* Mode toggle */}
        <Segmented
          value={mode}
          onChange={v => chooseMode(v as PreviewMode)}
          options={[{ v: 'snack', label: 'Live (Expo)' }, { v: 'inapp', label: 'In‑app (beta)' }]}
        />

        {/* In-app: platform toggle + device dropdown */}
        {mode === 'inapp' && (
          <>
            <Segmented
              value={platform}
              onChange={v => {
                const os = v as DeviceOS
                setPlatform(os)
                // Keep a device that belongs to the chosen OS.
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

        {/* Test on a real phone (QR / Expo Go) — the live embed already runs inline. */}
        {mode === 'snack' && snackUrl && !loading && (
          <a href={snackUrl} target="_blank" rel="noopener noreferrer" title="Open in Expo Go on your phone" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#a1a1aa', textDecoration: 'none', padding: '2px 8px', fontSize: 11 }}>📱 On device ↗</a>
        )}

        {shouldBuildPreview && !isGenerating && !loading && (
          <button onClick={refresh} title="Rebuild preview" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>⟳</button>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Mobile preview</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>Describe your React Native app and it&apos;ll render here instantly</div>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app…</div>
          </div>
        )}

        {/* In-app preview (RN-web). Wrapper is an explicit full-size flex box so
            DeviceFrame always has a real height to scale against (a bare flex:1
            container can resolve to ~0 in this layout → previously black). */}
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

        {/* Expo Snack path (test on a real device) */}
        {!isGenerating && shouldBuildPreview && mode === 'snack' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', padding: 16 }}>
            <div style={{ width: 375, maxWidth: '100%', height: Math.min(812, (typeof window !== 'undefined' ? window.innerHeight : 780) - 80), borderRadius: 40, overflow: 'hidden', boxShadow: '0 0 0 8px #1a1a1a, 0 0 0 9px #333, 0 30px 80px rgba(0,0,0,0.6)', border: '1px solid #222', background: '#000', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 28, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 90, height: 20, background: '#0a0a0a', borderRadius: 10 }} />
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {snackLoading && <Centered dark><Spinner small /><span style={{ fontSize: 11, color: '#52525b' }}>Starting live preview…</span></Centered>}
                {error && !snackLoading && <PreviewError error={error} onRetry={refresh} />}
                {/* Interactive live preview — the Expo Snack web player runs the real
                    RN runtime inline, so the app is genuinely tappable/animated. */}
                {embedUrl && !snackLoading && !error && (
                  <iframe
                    src={embedUrl}
                    title="Live mobile preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#000' }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    allow="accelerometer; gyroscope; clipboard-write"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1a0505', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ff6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>Preview error</strong>{error}
      </div>
      <button onClick={onRetry} style={{ alignSelf: 'flex-start', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Retry ⟳</button>
    </div>
  )
}

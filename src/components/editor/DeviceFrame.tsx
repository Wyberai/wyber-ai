'use client'
import { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react'
import type { Device } from '@/lib/devices'
import { buildPreviewHtml, type PreviewPlatform } from '@/lib/rnw-preview/shell'

interface Props {
  device: Device
  js: string | null            // compiled RN-web bundle; null = nothing to show yet
  platform: PreviewPlatform
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

// Renders a generated RN-web app inside a to-scale phone/tablet bezel.
// The bundle (`js`) is platform-agnostic; we wrap it with per-device globals
// (platform + insets) so switching device/platform is a pure client re-render —
// no server round-trip. A sandboxed blob iframe keeps a crashing app isolated.
//
// SIZING (why this is defensive): the panel's flex container can momentarily
// report ~0 height in the editor layout, which previously drove `scale` to 0/
// negative and collapsed the whole frame to a black void. We derive the
// available box from BOTH the measured container AND a window-based floor, and
// clamp scale to a positive range, so the bezel is ALWAYS visible.
export function DeviceFrame({ device, js, platform }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ h: number; w: number }>(() => ({
    h: typeof window !== 'undefined' ? window.innerHeight - 120 : 720,
    w: typeof window !== 'undefined' ? Math.min(520, window.innerWidth) : 420,
  }))

  // Measure the real container, but never trust a near-zero value — floor it to
  // a window-derived size (mirrors the proven Expo bezel, which never blanked).
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrapRef.current
      const winH = typeof window !== 'undefined' ? window.innerHeight : 720
      const winW = typeof window !== 'undefined' ? window.innerWidth : 420
      const cH = el?.clientHeight ?? 0
      const cW = el?.clientWidth ?? 0
      setBox({
        h: Math.max(cH, winH - 120, 360),
        w: Math.max(cW, Math.min(winW, 480) - 20, 280),
      })
    }
    measure()
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && wrapRef.current) {
      ro = new ResizeObserver(measure)
      ro.observe(wrapRef.current)
    }
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const BEZEL = 10
  const frameW = device.width + BEZEL * 2
  const frameH = device.height + BEZEL * 2
  const scale = clamp(Math.min((box.h - 20) / frameH, (box.w - 20) / frameW), 0.2, 1)

  const html = useMemo(
    () => (js ? buildPreviewHtml(js, { platform, insets: device.insets }) : null),
    [js, platform, device.insets],
  )

  // Deliver via a blob URL (not srcDoc) with an allow-same-origin sandbox —
  // exactly like the web preview (WyberPreview.tsx). A srcDoc frame WITHOUT
  // allow-same-origin runs as an opaque origin, where react-native-web /
  // react-dom throw on storage access during boot → the whole preview blanks.
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const prevBlob = useRef<string | null>(null)
  useEffect(() => {
    if (!html) { setBlobUrl(null); return }
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    if (prevBlob.current) URL.revokeObjectURL(prevBlob.current)
    prevBlob.current = url
    setBlobUrl(url)
    return () => { URL.revokeObjectURL(url); if (prevBlob.current === url) prevBlob.current = null }
  }, [html])

  // Surface a runtime failure INSIDE the bezel instead of a black void. The
  // shell postMessages { type:'wyber-preview-error' } on any boot/async error.
  const [runtimeError, setRuntimeError] = useState<{ message: string; detail: string } | null>(null)
  useEffect(() => {
    setRuntimeError(null) // reset when the app rebuilds / device changes
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'wyber-preview-error') {
        setRuntimeError({ message: String(e.data.message || 'error'), detail: String(e.data.detail || '') })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [blobUrl])

  const statusColor = device.statusBar === 'light' ? '#fff' : '#0A0A0B'

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: frameW * scale, height: frameH * scale, position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: frameW, height: frameH,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            borderRadius: device.radius + BEZEL,
            background: '#0a0a0a',
            boxShadow: '0 0 0 2px #2a2a2e, 0 30px 80px rgba(0,0,0,0.6)',
            padding: BEZEL,
            position: 'absolute', top: 0, left: 0,
          }}
        >
          <div style={{ position: 'relative', width: device.width, height: device.height, borderRadius: device.radius, overflow: 'hidden', background: '#0f0f14' }}>
            {/* App surface — always renders SOMETHING (app, spinner, or error) */}
            {runtimeError ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', gap: 8, overflow: 'auto' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F7' }}>Preview unavailable</div>
                <div style={{ fontSize: 12, color: '#9A9AA5', lineHeight: 1.5, maxWidth: 240 }}>This screen uses something we can’t render in the in-app preview yet. It still works in a full build.</div>
                {runtimeError.message && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 8, maxWidth: 260, textAlign: 'left' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#ff8a8a', wordBreak: 'break-word', lineHeight: 1.5 }}>{runtimeError.message}</div>
                    {runtimeError.detail && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#6b7280', marginTop: 4, wordBreak: 'break-word', maxHeight: 80, overflow: 'hidden' }}>{runtimeError.detail}</div>}
                  </div>
                )}
              </div>
            ) : blobUrl ? (
              <iframe
                key={blobUrl}
                src={blobUrl}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#0A0A0B' }}
                title={`${device.name} preview`}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 11, color: '#52525b' }}>Loading preview…</div>
              </div>
            )}

            {/* Faux status bar (time + signal/battery) sitting in the top inset */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(20, device.insets.top - 6),
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 22px', paddingTop: 4, pointerEvents: 'none',
              fontSize: 13, fontWeight: 600, color: statusColor,
              fontFamily: '-apple-system, system-ui, sans-serif',
            }}>
              <span>{device.os === 'ios' ? '9:41' : '12:30'}</span>
              <span style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11 }}>
                <span>●●●</span>
                <span>{device.os === 'ios' ? 'ᯤ' : 'Wi-Fi'}</span>
                <span style={{ display: 'inline-block', width: 22, height: 11, border: `1px solid ${statusColor}`, borderRadius: 3, position: 'relative' }}>
                  <span style={{ position: 'absolute', inset: 1.5, right: '35%', background: statusColor, borderRadius: 1 }} />
                </span>
              </span>
            </div>

            {/* Cutout */}
            {device.notch === 'notch' && (
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 160, height: 30, background: '#000', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
            )}
            {device.notch === 'island' && (
              <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 118, height: 34, background: '#000', borderRadius: 20 }} />
            )}
            {device.notch === 'punch-hole' && (
              <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, background: '#000', borderRadius: '50%' }} />
            )}

            {/* Android nav pill / iOS home indicator */}
            {device.insets.bottom > 0 && (
              <div style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                width: device.os === 'ios' ? 134 : 108, height: device.os === 'ios' ? 5 : 4,
                borderRadius: 3, background: 'rgba(180,180,190,0.55)', pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

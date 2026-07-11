'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import type { Device } from '@/lib/devices'
import { buildPreviewHtml, type PreviewPlatform } from '@/lib/rnw-preview/shell'

interface Props {
  device: Device
  js: string | null            // compiled RN-web bundle; null = nothing to show yet
  platform: PreviewPlatform
  availableHeight?: number     // panel height for scale-to-fit (px)
  availableWidth?: number
}

// Renders a generated RN-web app inside a to-scale phone/tablet bezel.
// The bundle (`js`) is platform-agnostic; we wrap it here with per-device
// globals (platform + insets) so switching device/platform is a pure client
// re-render — no server round-trip. Sandboxed iframe keeps a crashing app fully
// isolated from the editor.
export function DeviceFrame({ device, js, platform, availableHeight, availableWidth }: Props) {
  const [vh, setVh] = useState(availableHeight ?? 700)
  const [vw, setVw] = useState(availableWidth ?? 420)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (availableHeight && availableWidth) { setVh(availableHeight); setVw(availableWidth); return }
    const measure = () => {
      const el = wrapRef.current
      if (el) { setVh(el.clientHeight); setVw(el.clientWidth) }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [availableHeight, availableWidth])

  // Bezel is ~10px thick each side; leave breathing room in the panel.
  const BEZEL = 10
  const frameW = device.width + BEZEL * 2
  const frameH = device.height + BEZEL * 2
  const scale = Math.min(1, (vh - 24) / frameH, (vw - 24) / frameW)

  const html = useMemo(
    () => (js ? buildPreviewHtml(js, { platform, insets: device.insets }) : null),
    [js, platform, device.insets],
  )

  // Deliver via a blob URL (not srcDoc) with an allow-same-origin sandbox —
  // exactly like the web preview (WyberPreview.tsx). A srcDoc frame WITHOUT
  // allow-same-origin runs as an opaque origin, where react-native-web /
  // react-dom throw on storage access during boot → the whole preview blanks.
  // A same-origin blob document lets the RN-web runtime + esm.sh imports run.
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

  const isDark = device.statusBar === 'light'
  const statusColor = isDark ? '#fff' : '#0A0A0B'

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: frameW * scale, height: frameH * scale, position: 'relative' }}>
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
          <div style={{ position: 'relative', width: device.width, height: device.height, borderRadius: device.radius, overflow: 'hidden', background: '#000' }}>
            {/* App surface */}
            {blobUrl ? (
              <iframe
                key={blobUrl}
                src={blobUrl}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#0A0A0B' }}
                title={`${device.name} preview`}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#0f0f14' }} />
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
    </div>
  )
}

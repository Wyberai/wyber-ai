'use client'
import { useEffect, useRef, useState } from 'react'
import { injectStorageShim, PUBLISHED_APP_SANDBOX, STORAGE_MESSAGE_FLAG, storagePrefix } from '@/lib/published-app-sandbox'

// Renders a published app isolated from wyberai.com (see
// lib/published-app-sandbox.ts). The iframe runs in an opaque origin; this
// component is the only bridge, and it only ever exposes and stores THIS
// app's own data, under `wyber-app:<slug>:`.

const MAX_KEY = 512
const MAX_VALUE = 2_000_000

export function SandboxedApp({ html, slug, projectId, title }: { html: string; slug: string; projectId: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const prefix = storagePrefix(slug)

  useEffect(() => {
    const seed: Record<string, string> = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(prefix)) seed[k.slice(prefix.length)] = localStorage.getItem(k) ?? ''
      }
      // One-time migration: before isolation, the app wrote straight into
      // wyberai.com's localStorage under wyber-store's `wyber:<projectId>:`
      // keys. Carry this app's own keys over so visitors keep their data.
      const legacy = `wyber:${projectId}:`
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(legacy) && !(k in seed)) {
          const v = localStorage.getItem(k) ?? ''
          seed[k] = v
          try { localStorage.setItem(prefix + k, v) } catch { /* quota */ }
        }
      }
    } catch { /* storage blocked — app still runs, just without saved data */ }
    setSrcDoc(injectStorageShim(html, seed))
  }, [html, prefix, projectId])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only this app's frame, only storage messages, only its own namespace.
      if (!frame.current || e.source !== frame.current.contentWindow) return
      const d = e.data as { op?: string; k?: unknown; v?: unknown } | null
      if (!d || typeof d !== 'object' || !(STORAGE_MESSAGE_FLAG in d)) return
      try {
        if (d.op === 'set' && typeof d.k === 'string' && typeof d.v === 'string' && d.k.length <= MAX_KEY && d.v.length <= MAX_VALUE) {
          localStorage.setItem(prefix + d.k, d.v)
        } else if (d.op === 'remove' && typeof d.k === 'string') {
          localStorage.removeItem(prefix + d.k)
        } else if (d.op === 'clear') {
          const mine: string[] = []
          for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(prefix)) mine.push(k) }
          mine.forEach(k => localStorage.removeItem(k))
        }
      } catch { /* quota or blocked storage — the app keeps its in-memory copy */ }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [prefix])

  return (
    <iframe
      ref={frame}
      srcDoc={srcDoc ?? undefined}
      sandbox={PUBLISHED_APP_SANDBOX}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title={title}
    />
  )
}

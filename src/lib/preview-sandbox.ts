// Isolation for the EDITOR previews (PreviewPanel, DeviceFrame, version
// preview). Same problem as published apps (see published-app-sandbox.ts):
// the preview is AI-generated code, and it used to run from a wyberai.com
// blob URL with allow-same-origin — i.e. with the signed-in user's session
// cookies, the editor's localStorage, and every other project's saved data in
// reach. A prompt-injected or malicious template could read them.
//
// Now preview frames get NO allow-same-origin (opaque origin) plus:
//   - the storage shim, seeded with ONLY this project's preview data, persisted
//     by the editor under `wyber-preview:<projectId>:`;
//   - a runtime-error relay. The editor used to attach window.onerror inside the
//     frame directly (same-origin only); the relay posts the same
//     'wyber-runtime-error' message instead, so self-heal keeps working.
import { useEffect } from 'react'
import { buildStorageShim, STORAGE_MESSAGE_FLAG } from './published-app-sandbox'

export const EDITOR_PREVIEW_SANDBOX = 'allow-scripts allow-forms allow-popups allow-modals allow-downloads'

const MAX_KEY = 512
const MAX_VALUE = 2_000_000

export function previewStoragePrefix(projectId: string | null | undefined): string {
  return `wyber-preview:${projectId || 'scratch'}:`
}

const ERROR_RELAY = `<script>(function(){if(window.parent===window)return;function send(m,s,l){try{parent.postMessage({type:'wyber-runtime-error',message:String(m||'Script error'),source:s?String(s).split('/').pop():undefined,lineno:l},'*')}catch(e){}}
window.addEventListener('error',function(e){send(e.message||e.error,e.filename,e.lineno)});
window.addEventListener('unhandledrejection',function(e){send(e.reason&&e.reason.message?e.reason.message:e.reason)});})();</script>`

/** This project's saved preview data (plus pre-isolation wyber-store keys). */
function readSeed(projectId: string | null | undefined): Record<string, string> {
  const seed: Record<string, string> = {}
  const prefix = previewStoragePrefix(projectId)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) seed[k.slice(prefix.length)] = localStorage.getItem(k) ?? ''
    }
    // Before isolation the preview wrote straight into wyberai.com storage via
    // wyber-store's `wyber:<projectId>:` keys — carry those over once.
    if (projectId) {
      const legacy = `wyber:${projectId}:`
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(legacy) && !(k in seed)) {
          const v = localStorage.getItem(k) ?? ''
          seed[k] = v
          try { localStorage.setItem(prefix + k, v) } catch { /* quota */ }
        }
      }
    }
  } catch { /* storage blocked — preview runs without saved data */ }
  return seed
}

/** Prepare built preview HTML for an opaque-origin frame. Client-only. */
export function sandboxPreviewHtml(html: string, projectId: string | null | undefined, opts: { relayErrors?: boolean } = {}): string {
  const inject = buildStorageShim(readSeed(projectId)) + (opts.relayErrors === false ? '' : ERROR_RELAY)
  const m = html.match(/<head[^>]*>/i)
  return m ? html.replace(m[0], `${m[0]}${inject}`) : inject + html
}

/** Persist storage writes from the given preview frame — and only that frame. */
export function usePreviewStorageBridge(getFrame: () => HTMLIFrameElement | null, projectId: string | null | undefined) {
  useEffect(() => {
    const prefix = previewStoragePrefix(projectId)
    const onMessage = (e: MessageEvent) => {
      const frame = getFrame()
      if (!frame || e.source !== frame.contentWindow) return
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
      } catch { /* quota or blocked storage — the preview keeps its in-memory copy */ }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // getFrame is expected to read a ref; re-binding on every render isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])
}

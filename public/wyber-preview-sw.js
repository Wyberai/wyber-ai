/**
 * Wyber Preview Service Worker
 * Phase 2 of the Wyber custom renderer
 *
 * Intercepts requests to /wyber-preview/{projectId}/
 * Serves HTML from memory (sent by the parent page via postMessage)
 *
 * Install at: /wyber-preview-sw.js (scope: /wyber-preview/)
 */

const CACHE_NAME = 'wyber-preview-v1'

// In-memory store: projectId → HTML string
const previewStore = new Map()

// Install — skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate — claim all clients immediately  
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Receive compiled HTML from parent page
self.addEventListener('message', (event) => {
  const { type, projectId, html, timestamp } = event.data || {}

  if (type === 'WYBER_UPDATE_FILES' && projectId && html) {
    previewStore.set(projectId, { html, timestamp })

    // Notify all clients that this project was updated
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'WYBER_FILES_UPDATED',
          projectId,
          timestamp,
        })
      })
    })
  }

  if (type === 'WYBER_CLEAR_PROJECT' && projectId) {
    previewStore.delete(projectId)
  }

  if (type === 'WYBER_GET_STATUS') {
    event.source?.postMessage({
      type: 'WYBER_STATUS',
      projects: Array.from(previewStore.keys()),
      version: CACHE_NAME,
    })
  }
})

// Intercept fetch requests to /wyber-preview/*
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle /wyber-preview/ requests
  if (!url.pathname.startsWith('/wyber-preview/')) return

  // Extract projectId from path: /wyber-preview/{projectId}/...
  const match = url.pathname.match(/^\/wyber-preview\/([^/]+)/)
  if (!match) return

  const projectId = match[1]

  event.respondWith(
    (async () => {
      const stored = previewStore.get(projectId)

      if (!stored) {
        // No preview available yet — return loading screen
        return new Response(loadingHTML(projectId), {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        })
      }

      // Serve the compiled HTML
      return new Response(stored.html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
          'X-Wyber-Project': projectId,
          'X-Wyber-Timestamp': String(stored.timestamp),
        },
      })
    })()
  )
})

function loadingHTML(projectId) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { background:#09090b; color:#71717a; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; flex-direction:column; gap:12px; }
    .spinner { width:24px; height:24px; border:2px solid rgba(14,165,233,0.2); border-top-color:#0EA5E9; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <div style="font-size:13px">Building preview...</div>
  <script>
    // Poll until files are ready
    const channel = new BroadcastChannel('wyber-sw-ready-${projectId}');
    channel.addEventListener('message', (e) => {
      if (e.data?.type === 'WYBER_FILES_UPDATED' && e.data?.projectId === '${projectId}') {
        window.location.reload();
      }
    });
    // Also poll via fetch
    let attempts = 0;
    const check = () => {
      attempts++;
      if (attempts > 60) return; // Give up after 30s
      fetch(window.location.href, { headers: { 'X-Wyber-Check': '1' } })
        .then(r => r.headers.get('X-Wyber-Timestamp'))
        .then(ts => { if (ts) window.location.reload(); else setTimeout(check, 500); })
        .catch(() => setTimeout(check, 500));
    };
    setTimeout(check, 300);
  </script>
</body>
</html>`
}

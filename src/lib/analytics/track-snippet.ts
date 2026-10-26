// Visitor-tracking beacon injected into every published app's index.html at
// publish time (publish/route.ts, alongside injectPwa). Fires one POST per
// page load to /api/analytics/track with a per-browser-session id (so
// "visitors" can be distinguished from raw page views) — no cookies, no
// third-party script, no PII beyond what the request already carries (IP,
// user-agent) which we don't even store beyond the raw user-agent string.
//
// Same isolation philosophy as the PWA runtime: dependency-free, wrapped in
// try/catch, can never break the app it's embedded in. Inert on the
// preview-builder host (checked via location.hostname) so building/previewing
// a project never pollutes its own analytics. This can't be a window.top
// check — every published app is ALSO served inside a sandboxed srcDoc
// iframe (src/app/app/[slug]/page.tsx, for XSS isolation), so window.top !==
// window.self is true there too; a top-check would silently kill tracking
// on 100% of real published traffic.

export const ANALYTICS_MARKER = '<!--wyber-analytics-->'

const PREVIEW_BUILDER_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com').hostname }
  catch { return 'preview-builder.wyberai.com' }
})()

function buildSnippet(projectId: string, publicPath: string): string {
  return String.raw`
${ANALYTICS_MARKER}
<script>
(function () {
  try {
    if (location.hostname === ${JSON.stringify(PREVIEW_BUILDER_HOST)}) return; // inert on the editor's live-preview host
    var KEY = 'wyber:analytics-session';
    var sessionId = sessionStorage.getItem(KEY);
    if (!sessionId) {
      sessionId = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, sessionId);
    }
    var payload = JSON.stringify({
      projectId: ${JSON.stringify(projectId)},
      // Every published app is served inside a sandboxed srcDoc iframe
      // (src/app/app/[slug]/page.tsx, for XSS isolation), where
      // location.pathname is always the literal string "srcdoc" — using it
      // meant the Analytics panel's "Top Pages" showed "srcdoc" for 100% of
      // real visitors on every published app, not just this one. The real
      // path is known once, at publish time, so it's baked in here instead.
      path: ${JSON.stringify(publicPath)},
      referrer: document.referrer || null,
      sessionId: sessionId,
    });
    var send = function (url, body) {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
      }
    };
    send('https://wyberai.com/api/analytics/track', payload);

    // Live-error alerts: report uncaught errors real visitors hit, so the
    // owner gets "visitors hit an error → Fix it" (/api/app-errors). Each
    // distinct message is sent once per page load, max 5 per load.
    var seen = {}, sent = 0;
    var report = function (message, stack, source) {
      try {
        message = String(message || '').slice(0, 500);
        if (!message || seen[message] || sent >= 5) return;
        seen[message] = 1; sent++;
        send('https://wyberai.com/api/app-errors', JSON.stringify({
          projectId: ${JSON.stringify(projectId)},
          path: ${JSON.stringify(publicPath)},
          message: message,
          stack: String(stack || '').slice(0, 2000),
          source: String(source || '').slice(0, 300),
        }));
      } catch (e) {}
    };
    window.addEventListener('error', function (e) {
      if (!e || !e.message) return; // resource-load errors (img/script 404s) carry no message
      report(e.message, e.error && e.error.stack, e.filename);
    });
    window.addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      report(r && r.message ? r.message : r, r && r.stack, '');
    });
  } catch (e) {}
})();
</script>`
}

export function injectAnalytics(html: string, opts: { projectId: string; publicPath?: string }): string {
  if (html.includes(ANALYTICS_MARKER)) return html
  const snippet = buildSnippet(opts.projectId, opts.publicPath || '/')
  return html.includes('</body>')
    ? html.replace('</body>', `${snippet}\n</body>`)
    : html + snippet
}

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

function buildSnippet(projectId: string): string {
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
      path: location.pathname,
      referrer: document.referrer || null,
      sessionId: sessionId,
    });
    var url = 'https://wyberai.com/api/analytics/track';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
    }
  } catch (e) {}
})();
</script>`
}

export function injectAnalytics(html: string, opts: { projectId: string }): string {
  if (html.includes(ANALYTICS_MARKER)) return html
  const snippet = buildSnippet(opts.projectId)
  return html.includes('</body>')
    ? html.replace('</body>', `${snippet}\n</body>`)
    : html + snippet
}

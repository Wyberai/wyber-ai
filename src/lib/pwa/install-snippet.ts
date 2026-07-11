// PWA head tags + install-pill runtime injected into every published app's
// index.html at publish time (publish/route.ts, right before upload).
//
// The runtime only activates on the app's OWN origin ({slug}.wyberai.app or a
// custom domain) — when the same HTML renders inside the main-domain shell
// iframe or an editor preview, `window.top !== window.self` and the script
// exits immediately. Same isolation philosophy as the crash-guard: zero
// dependencies, everything in try/catch, can never take the app down.
//
// IMPORTANT: keep this dependency-free and never place a literal closing
// script tag inside a JS string here — the whole block is inlined into HTML.

export const PWA_MARKER = '<!--wyber-pwa-->'

const HEAD_TAGS = (themeColor: string) => `${PWA_MARKER}
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/pwa-icon-192.png">
<meta name="theme-color" content="${themeColor}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`

// String.raw so nothing needs double-escaping; no backtick/${} inside.
const INSTALL_RUNTIME = String.raw`
<script>
(function () {
  try {
    if (window.top !== window.self) return; // inert inside shell iframe / previews
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone === true) return; // iOS installed
    var KEY = 'wyber:pwa-dismissed';
    try { if (localStorage.getItem(KEY)) return; } catch (e) {}

    var deferred = null;
    var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    function el(tag, css, text) {
      var n = document.createElement(tag);
      if (css) n.style.cssText = css;
      if (text) n.textContent = text;
      return n;
    }

    var pill = el('button',
      'position:fixed;bottom:14px;left:14px;z-index:2147483000;display:none;align-items:center;gap:7px;' +
      'padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;' +
      'background:rgba(9,9,11,0.85);backdrop-filter:blur(8px);color:#fff;font:600 13px system-ui,sans-serif;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.3);');
    pill.setAttribute('aria-label', 'Install this app');
    pill.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Install app</span>';

    var close = el('span', 'margin-left:4px;opacity:0.55;font-size:15px;line-height:1;', '×');
    close.setAttribute('role', 'button');
    close.setAttribute('aria-label', 'Dismiss');
    close.addEventListener('click', function (ev) {
      ev.stopPropagation();
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      pill.style.display = 'none';
    });
    pill.appendChild(close);

    function showIosSheet() {
      var overlay = el('div',
        'position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,0.55);display:flex;align-items:flex-end;justify-content:center;');
      var sheet = el('div',
        'background:#18181b;color:#fff;border-radius:16px 16px 0 0;padding:22px 20px 30px;max-width:420px;width:100%;' +
        'font:400 14px system-ui,sans-serif;line-height:1.55;');
      sheet.innerHTML =
        '<div style="font-weight:700;font-size:16px;margin-bottom:10px;">Install this app</div>' +
        '<div style="margin-bottom:6px;">1. Tap the <b>Share</b> button <span style="opacity:.7">(the square with an arrow)</span></div>' +
        '<div>2. Choose <b>Add to Home Screen</b></div>';
      overlay.addEventListener('click', function () { overlay.remove(); });
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
    }

    pill.addEventListener('click', function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function () { pill.style.display = 'none'; deferred = null; });
      } else if (isIos) {
        showIosSheet();
      }
    });

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      pill.style.display = 'flex';
    });
    window.addEventListener('appinstalled', function () { pill.style.display = 'none'; });

    function mount() {
      if (document.body) {
        document.body.appendChild(pill);
        if (isIos) pill.style.display = 'flex';
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  } catch (e) { /* never break the app */ }
})();
</script>`

/**
 * Inject PWA head tags + the install runtime into built app HTML.
 * Idempotent: the marker comment guards against double-injection on republish.
 */
export function injectPwa(html: string, opts: { themeColor: string }): string {
  if (html.includes(PWA_MARKER)) return html
  let out = html
  const head = HEAD_TAGS(opts.themeColor)
  out = out.includes('</head>')
    ? out.replace('</head>', `${head}\n</head>`)
    : head + out
  out = out.includes('</body>')
    ? out.replace('</body>', `${INSTALL_RUNTIME}\n</body>`)
    : out + INSTALL_RUNTIME
  return out
}
